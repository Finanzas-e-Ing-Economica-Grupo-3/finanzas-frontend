
import { AmortizationType, Bond, BondAnalysis, CashFlow, GraceType, InterestRateType } from "@/types/bond";

// Function to calculate cash flow
export function calculateCashFlow(bond: Bond): CashFlow[] {
  const {
    nominalValue,
    interestRate,
    term,
    frequency,
    amortizationType,
    graceType,
    gracePeriods,
  } = bond;
  
  const totalPeriods = term * frequency;
  const cashFlow: CashFlow[] = [];
  
  // Convert annual interest rate to period rate based on frequency
  const periodRate = convertInterestRate(interestRate, bond.settings.interestRateType, frequency);
  
  let initialBalance = nominalValue;
  let periodDate = new Date(bond.emissionDate);
  const periodInterval = 12 / frequency; // Months between payments
  
  for (let period = 1; period <= totalPeriods; period++) {
    // Calculate date for this period
    periodDate = new Date(periodDate);
    periodDate.setMonth(periodDate.getMonth() + periodInterval);
    
    const isGracePeriod = period <= gracePeriods;
    let interest = initialBalance * periodRate;
    let amortization = 0;
    let payment = 0;
    
    // Calculate amortization based on type and grace period
    if (!isGracePeriod) {
      switch (amortizationType) {
        case "American":
          // No amortization until last period, only interest payments
          amortization = period === totalPeriods ? initialBalance : 0;
          break;
          
        case "German":
          // Equal amortization each period
          amortization = nominalValue / (totalPeriods - gracePeriods);
          break;
          
        case "French":
          // Equal total payment each period
          const remainingPeriods = totalPeriods - period + 1;
          // Formula for fixed payment: P = r * PV / (1 - (1+r)^-n)
          payment = periodRate * initialBalance / (1 - Math.pow(1 + periodRate, -remainingPeriods));
          amortization = payment - interest;
          break;
      }
    } else if (graceType === "Partial") {
      // Partial grace: interest payments but no amortization
      amortization = 0;
    } else if (graceType === "Total") {
      // Total grace: no payment, interest is capitalized
      amortization = 0;
      initialBalance += interest;
      interest = 0; // Interest is not paid but added to the principal
    }
    
    // If payment was not calculated in French method
    if (amortizationType !== "French" || isGracePeriod) {
      payment = interest + amortization;
    }
    
    const finalBalance = initialBalance - amortization;
    
    cashFlow.push({
      period,
      date: periodDate.toISOString().split('T')[0],
      initialBalance,
      interest,
      amortization,
      payment,
      finalBalance,
    });
    
    initialBalance = finalBalance;
  }
  
  return cashFlow;
}

// Convert annual rate to period rate based on frequency
function convertInterestRate(
  rate: number,
  rateType: InterestRateType,
  frequency: number
): number {
  // Convert percentage to decimal
  const decimalRate = rate / 100;
  
  if (rateType === "Effective") {
    // Convert effective annual rate to effective period rate
    return Math.pow(1 + decimalRate, 1 / frequency) - 1;
  } else {
    // For nominal, we simply divide by frequency (simplified)
    return decimalRate / frequency;
  }
}

// Calculate bond analysis metrics
export function analyzeBond(bond: Bond, cashFlow: CashFlow[], marketRate: number): BondAnalysis {
  const periodRate = convertInterestRate(bond.interestRate, bond.settings.interestRateType, bond.frequency);
  const marketPeriodRate = convertInterestRate(marketRate, bond.settings.interestRateType, bond.frequency);
  
  // Calculate present value of cash flows (market price)
  let presentValue = 0;
  let weightedTime = 0;
  let weightedTimeSquared = 0;
  
  // Calculate duration and present value
  for (let i = 0; i < cashFlow.length; i++) {
    const period = i + 1;
    const payment = cashFlow[i].payment;
    const discountFactor = Math.pow(1 + marketPeriodRate, -period);
    
    const presentValueOfPayment = payment * discountFactor;
    presentValue += presentValueOfPayment;
    weightedTime += period * presentValueOfPayment;
    weightedTimeSquared += period * period * presentValueOfPayment;
  }
  
  // Macaulay Duration (in periods)
  const macaulayDuration = weightedTime / presentValue;
  
  // Modified Duration
  const modifiedDuration = macaulayDuration / (1 + marketPeriodRate);
  
  // Convexity
  const convexity = weightedTimeSquared / (presentValue * Math.pow(1 + marketPeriodRate, 2));
  
  // Convert duration from periods to years
  const durationInYears = macaulayDuration / bond.frequency;
  const modifiedDurationInYears = modifiedDuration / bond.frequency;
  
  // Calculate TCEA (issuer perspective) - Internal Rate of Return of cash flows
  const tcea = calculateIRR(bond.nominalValue, cashFlow.map(cf => cf.payment)) * 100;
  
  // Calculate TREA (investor perspective) - Effective Annual Yield
  const trea = (Math.pow(1 + tcea / 100, 1) - 1) * 100;
  
  return {
    convexity,
    duration: durationInYears,
    modifiedDuration: modifiedDurationInYears,
    effectiveCostRate: tcea,
    effectiveYieldRate: trea,
    marketPrice: presentValue,
  };
}

// Calculate Internal Rate of Return (IRR)
function calculateIRR(initialInvestment: number, cashFlows: number[]): number {
  // Simple IRR calculation using Newton-Raphson method
  const MAX_ITERATIONS = 100;
  const PRECISION = 0.0000001;
  
  const flows = [-initialInvestment, ...cashFlows];
  
  let guess = 0.1; // Initial guess
  
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const npv = calculateNPV(flows, guess);
    const derivativeNpv = calculateDerivativeNPV(flows, guess);
    
    if (Math.abs(derivativeNpv) < PRECISION) {
      break;
    }
    
    const newGuess = guess - npv / derivativeNpv;
    
    if (Math.abs(newGuess - guess) < PRECISION) {
      guess = newGuess;
      break;
    }
    
    guess = newGuess;
  }
  
  return guess;
}

function calculateNPV(cashFlows: number[], rate: number): number {
  return cashFlows.reduce((npv, flow, index) => {
    return npv + flow / Math.pow(1 + rate, index);
  }, 0);
}

function calculateDerivativeNPV(cashFlows: number[], rate: number): number {
  return cashFlows.reduce((derivative, flow, index) => {
    return derivative - (index * flow) / Math.pow(1 + rate, index + 1);
  }, 0);
}
