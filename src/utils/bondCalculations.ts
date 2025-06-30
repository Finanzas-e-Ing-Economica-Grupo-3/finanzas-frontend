import { AmortizationType, Bond, BondAnalysis, CashFlow, GraceType, InterestRateType } from "@/types/bond";

/**
 * MÉTRICAS FINANCIERAS DE BONOS
 * 
 * TCEA (Tasa de Costo Efectiva Anual):
 * - Perspectiva del EMISOR del bono
 * - Representa el costo efectivo anual del financiamiento
 * - Ecuación: -Valor_Nominal + Σ(Pago_t / (1+TCEA)^t) = 0
 * 
 * TREA (Tasa de Rendimiento Efectiva Anual):
 * - Perspectiva del INVERSOR/COMPRADOR del bono
 * - Representa el rendimiento efectivo anual de la inversión
 * - Ecuación: -Precio_Pagado + Σ(Pago_t / (1+TREA)^t) = 0
 * 
 * Para un bono sin prima/descuento (precio = valor nominal):
 * - TCEA = TREA = Tasa de interés del bono
 */

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
      // American method: No amortization until last period, only interest payments
      amortization = period === totalPeriods ? initialBalance : 0;
    } else if (graceType === "Partial") {
      // Partial grace: interest payments but no amortization
      amortization = 0;
    } else if (graceType === "Total") {
      // Total grace: no payment, interest is capitalized
      amortization = 0;
      initialBalance += interest;
      interest = 0; // Interest is not paid but added to the principal
    }
    
    payment = interest + amortization;
    
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
  
  // Calculate TCEA (issuer perspective) - Effective Annual Cost Rate
  // From issuer's perspective: they receive nominal value, pay out the cash flows
  const tcea = calculateTCEA(bond, cashFlow);
  
  // Calculate TREA (investor perspective) - Effective Annual Yield Rate  
  // From investor's perspective: they pay market price, receive the cash flows
  const trea = calculateTREA(presentValue, cashFlow, bond.frequency);
  
  return {
    convexity,
    duration: durationInYears,
    modifiedDuration: modifiedDurationInYears,
    effectiveCostRate: tcea,
    effectiveYieldRate: trea,
    marketPrice: presentValue,
  };
}

// Calculate TCEA (Tasa de Costo Efectiva Anual) - Issuer perspective
function calculateTCEA(bond: Bond, cashFlow: CashFlow[]): number {
  // For the issuer: they receive the nominal value at t=0, pay out the cash flows
  // TCEA satisfies: -NominalValue + Σ(Payment_t / (1+TCEA)^t) = 0
  const flows = [-bond.nominalValue, ...cashFlow.map(cf => cf.payment)];
  const periodicRate = calculateIRR(flows);
  
  // Convert periodic rate to annual effective rate
  const annualRate = Math.pow(1 + periodicRate, bond.frequency) - 1;
  return annualRate * 100;
}

// Calculate TREA (Tasa de Rendimiento Efectiva Anual) - Investor perspective  
function calculateTREA(marketPrice: number, cashFlow: CashFlow[], frequency: number): number {
  // For the investor: they pay the market price at t=0, receive the cash flows
  // TREA satisfies: -MarketPrice + Σ(Payment_t / (1+TREA)^t) = 0
  const flows = [-marketPrice, ...cashFlow.map(cf => cf.payment)];
  const periodicRate = calculateIRR(flows);
  
  // Convert periodic rate to annual effective rate
  const annualRate = Math.pow(1 + periodicRate, frequency) - 1;
  return annualRate * 100;
}

// Calculate Internal Rate of Return (IRR) using Newton-Raphson method
function calculateIRR(cashFlows: number[]): number {
  const MAX_ITERATIONS = 1000;
  const PRECISION = 0.000001;
  
  // Better initial guess based on simple return
  let guess = 0.05; // Start with 5%
  
  // Handle edge cases
  if (cashFlows.length < 2) return 0;
  
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const npv = calculateNPV(cashFlows, guess);
    const derivativeNpv = calculateDerivativeNPV(cashFlows, guess);
    
    // Check for convergence
    if (Math.abs(npv) < PRECISION) {
      break;
    }
    
    // Avoid division by zero
    if (Math.abs(derivativeNpv) < PRECISION) {
      break;
    }
    
    const newGuess = guess - npv / derivativeNpv;
    
    // Check for convergence
    if (Math.abs(newGuess - guess) < PRECISION) {
      guess = newGuess;
      break;
    }
    
    // Prevent negative rates from going too negative (practical limit)
    guess = Math.max(newGuess, -0.99);
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
    if (index === 0) return derivative; // Skip t=0 in derivative calculation
    return derivative - (index * flow) / Math.pow(1 + rate, index + 1);
  }, 0);
}
