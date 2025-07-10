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

// Función para calcular el flujo de caja
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
  
  // Convertir tasa de interés anual a tasa periódica basada en la frecuencia
  const periodRate = convertInterestRate(interestRate, bond.settings.interestRateType, frequency);
  
  // Período 0: Flujo de caja inicial (emisión del bono)
  // Desde la perspectiva del emisor, aquí es cuando reciben el valor nominal
  const emissionDate = new Date(bond.emissionDate);
  cashFlow.push({
    period: 0,
    date: emissionDate.toISOString().split('T')[0],
    initialBalance: 0,
    interest: 0,
    amortization: 0,
    payment: -nominalValue, // Negativo porque el emisor recibe dinero
    finalBalance: nominalValue,
  });
  
  let initialBalance = nominalValue;
  let periodDate = new Date(bond.emissionDate);
  const periodInterval = 12 / frequency; // Meses entre pagos
  
  for (let period = 1; period <= totalPeriods; period++) {
    // Calcular fecha para este período
    periodDate = new Date(periodDate);
    periodDate.setMonth(periodDate.getMonth() + periodInterval);
    
    const isGracePeriod = period <= gracePeriods;
    let interest = initialBalance * periodRate;
    let amortization = 0;
    let payment = 0;
    
    // Calcular amortización basada en el tipo y período de gracia
    if (!isGracePeriod) {
      // Método americano: Sin amortización hasta el último período, solo pagos de interés
      amortization = period === totalPeriods ? initialBalance : 0;
    } else if (graceType === "Partial") {
      // Gracia parcial: pagos de interés pero sin amortización
      amortization = 0;
    } else if (graceType === "Total") {
      // Gracia total: sin pago, el interés se capitaliza
      amortization = 0;
      initialBalance += interest;
      interest = 0; // El interés no se paga sino que se añade al principal
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

// Convertir tasa anual a tasa periódica basada en la frecuencia
function convertInterestRate(
  rate: number,
  rateType: InterestRateType,
  frequency: number
): number {
  // Convertir porcentaje a decimal
  const decimalRate = rate / 100;
  
  if (rateType === "Effective") {
    // Convertir tasa anual efectiva a tasa periódica efectiva
    return Math.pow(1 + decimalRate, 1 / frequency) - 1;
  } else {
    // Para nominal, simplemente dividimos por la frecuencia (simplificado)
    return decimalRate / frequency;
  }
}

// Calcular métricas de análisis de bonos
export function analyzeBond(bond: Bond, cashFlow: CashFlow[], marketRate: number): BondAnalysis {
  const periodRate = convertInterestRate(bond.interestRate, bond.settings.interestRateType, bond.frequency);
  const marketPeriodRate = convertInterestRate(marketRate, bond.settings.interestRateType, bond.frequency);
  
  // Calcular valor presente de los flujos de caja (precio de mercado)
  let presentValue = 0;
  let weightedTime = 0;
  let weightedTimeSquared = 0;
  
  // Calcular duración y valor presente
  // Omitir período 0 ya que es el flujo de salida inicial, comenzar desde período 1
  for (let i = 1; i < cashFlow.length; i++) {
    const period = i; // Número de período (1, 2, 3, ...)
    const payment = cashFlow[i].payment;
    const discountFactor = Math.pow(1 + marketPeriodRate, -period);
    
    const presentValueOfPayment = payment * discountFactor;
    presentValue += presentValueOfPayment;
    weightedTime += period * presentValueOfPayment;
    weightedTimeSquared += period * period * presentValueOfPayment;
  }
  
  // Duración de Macaulay (en períodos)
  const macaulayDuration = weightedTime / presentValue;
  
  // Duración Modificada
  const modifiedDuration = macaulayDuration / (1 + marketPeriodRate);
  
  // Convexidad
  const convexity = weightedTimeSquared / (presentValue * Math.pow(1 + marketPeriodRate, 2));
  
  // Convertir duración de períodos a años
  const durationInYears = macaulayDuration / bond.frequency;
  const modifiedDurationInYears = modifiedDuration / bond.frequency;
  
  // Calcular TCEA (perspectiva del emisor) - Tasa de Costo Efectiva Anual
  // Desde la perspectiva del emisor: reciben el valor nominal, pagan los flujos de caja
  const tcea = calculateTCEA(bond, cashFlow);
  
  // Calcular TREA (perspectiva del inversor) - Tasa de Rendimiento Efectiva Anual
  // Desde la perspectiva del inversor: pagan el precio de mercado, reciben los flujos de caja
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

// Calcular TCEA (Tasa de Costo Efectiva Anual) - Perspectiva del emisor
function calculateTCEA(bond: Bond, cashFlow: CashFlow[]): number {
  // Para el emisor: el flujo de caja ya incluye el período 0 con -valorNominal
  // y períodos subsecuentes con pagos
  const flows = cashFlow.map(cf => cf.payment);
  const periodicRate = calculateIRR(flows);
  
  // Convertir tasa periódica a tasa anual efectiva
  const annualRate = (Math.pow(1 + periodicRate, bond.frequency) - 1) * 100;
  return annualRate;
}

// Calcular TREA (Tasa de Rendimiento Efectiva Anual) - Perspectiva del inversor
function calculateTREA(marketPrice: number, cashFlow: CashFlow[], frequency: number): number {
  // Para el inversor: pagan el precio de mercado en t=0, reciben los flujos de caja desde el período 1 en adelante
  const flows = [-marketPrice, ...cashFlow.slice(1).map(cf => cf.payment)];
  const periodicRate = calculateIRR(flows);
  
  // Convertir tasa periódica a tasa anual efectiva
  const annualRate = (Math.pow(1 + periodicRate, frequency) - 1) * 100;
  return annualRate;
}

// Calcular Tasa Interna de Retorno (TIR) usando el método de Newton-Raphson
function calculateIRR(cashFlows: number[]): number {
  const MAX_ITERATIONS = 1000;
  const PRECISION = 0.000001;
  
  // Mejor estimación inicial basada en retorno simple
  let guess = 0.05; // Comenzar con 5%
  
  // Manejar casos extremos
  if (cashFlows.length < 2) return 0;
  
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const npv = calculateNPV(cashFlows, guess);
    const derivativeNpv = calculateDerivativeNPV(cashFlows, guess);
    
    // Verificar convergencia
    if (Math.abs(npv) < PRECISION) {
      break;
    }
    
    // Evitar división por cero
    if (Math.abs(derivativeNpv) < PRECISION) {
      break;
    }
    
    const newGuess = guess - npv / derivativeNpv;
    
    // Verificar convergencia
    if (Math.abs(newGuess - guess) < PRECISION) {
      guess = newGuess;
      break;
    }
    
    // Prevenir que las tasas negativas se vuelvan demasiado negativas (límite práctico)
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
    if (index === 0) return derivative; // Omitir t=0 en el cálculo de la derivada
    return derivative - (index * flow) / Math.pow(1 + rate, index + 1);
  }, 0);
}
