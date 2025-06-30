
export type AmortizationType = "American";

export type InterestRateType = "Effective" | "Nominal";

export type CurrencyType = "PEN" | "USD" | "EUR";

export type GraceType = "None" | "Partial" | "Total";

export interface BondSettings {
  currency: CurrencyType;
  interestRateType: InterestRateType;
  capitalization?: string; // Only required if interestRateType is Nominal
}

export interface Bond {
  id: string;
  name: string;
  nominalValue: number;
  interestRate: number;
  term: number; // in years
  frequency: number; // payments per year
  amortizationType: AmortizationType;
  graceType: GraceType;
  gracePeriods: number;
  emissionDate: string;
  settings: BondSettings;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CashFlow {
  period: number;
  date: string;
  initialBalance: number;
  interest: number;
  amortization: number;
  payment: number;
  finalBalance: number;
}

export interface BondAnalysis {
  convexity: number;
  duration: number;
  modifiedDuration: number;
  effectiveCostRate: number; // TCEA (Issuer perspective)
  effectiveYieldRate: number; // TREA (Investor perspective)
  marketPrice: number;
}
