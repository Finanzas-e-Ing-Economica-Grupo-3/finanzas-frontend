// utils/typeTransformers.ts - Utilidades para transformar entre tipos de DB y aplicación

import { 
  Investment, 
  DatabaseInvestment, 
  MarketplaceBond, 
  Notification, 
  DatabaseNotification,
  BondOffering,
  DatabaseBondOffering,
  Transaction,
  DatabaseTransaction,
  BondRating,
  DatabaseBondRating
} from '@/types/investment';

import type { Tables, TablesInsert } from '@/integrations/supabase/types';

// Transformadores para Inversiones
export const transformDatabaseInvestment = (
  dbInvestment: Tables<'investments'>,
  bondData?: any
): Investment => {
  return {
    id: dbInvestment.id,
    investor_id: dbInvestment.investor_id,
    bond_id: dbInvestment.bond_id,
    amount: dbInvestment.amount,
    investment_date: dbInvestment.investment_date,
    status: dbInvestment.status as 'active' | 'matured' | 'cancelled',
    created_at: dbInvestment.created_at || undefined,
    updated_at: dbInvestment.updated_at || undefined,
    bond: bondData ? {
      name: bondData.name,
      interest_rate: bondData.interest_rate,
      term: bondData.term,
      frequency: bondData.frequency,
      currency: bondData.currency,
      emission_date: bondData.emission_date,
      amortization_type: bondData.amortization_type,
      issuer_name: bondData.issuer_name || bondData.profiles?.name || 'Emisor Anónimo',
      nominal_value: bondData.nominal_value
    } : undefined
  };
};

export const transformInvestmentToDatabase = (
  investment: Omit<Investment, 'id' | 'created_at' | 'updated_at' | 'bond' | 'current_value' | 'expected_return' | 'days_to_maturity'>
): Omit<TablesInsert<'investments'>, 'id' | 'created_at' | 'updated_at'> => {
  return {
    investor_id: investment.investor_id,
    bond_id: investment.bond_id,
    amount: investment.amount,
    investment_date: investment.investment_date,
    status: investment.status
  };
};

// Transformadores para Bonos del Marketplace
export const transformToMarketplaceBond = (
  bond: Tables<'bonds'>,
  issuerName?: string,
  offering?: Tables<'bond_offerings'>,
  rating?: Tables<'bond_ratings'>
): MarketplaceBond => {
  return {
    id: bond.id,
    name: bond.name,
    nominal_value: bond.nominal_value,
    interest_rate: bond.interest_rate,
    term: bond.term,
    frequency: bond.frequency,
    currency: bond.currency,
    emission_date: bond.emission_date,
    amortization_type: bond.amortization_type,
    grace_type: bond.grace_type,
    grace_periods: bond.grace_periods,
    interest_rate_type: bond.interest_rate_type,
    issuer_name: issuerName || 'Emisor Anónimo',
    issuer_id: bond.user_id,
    available_amount: offering?.available_amount || bond.nominal_value,
    min_investment: offering?.min_investment || Math.min(1000, bond.nominal_value * 0.1),
    max_investment: offering?.max_investment || undefined,
    rating: rating?.rating,
    description: offering?.description || `Bono ${bond.amortization_type} con pagos ${getFrequencyText(bond.frequency)}`,
    offering_id: offering?.id,
    offering_status: offering?.status as 'pending' | 'open' | 'closed' | 'cancelled' || undefined
  };
};

// Transformadores para Notificaciones
export const transformDatabaseNotification = (
  dbNotification: Tables<'notifications'>
): Notification => {
  return {
    id: dbNotification.id,
    user_id: dbNotification.user_id,
    title: dbNotification.title,
    message: dbNotification.message,
    type: dbNotification.type as 'investment' | 'payment' | 'maturity' | 'system' | 'alert',
    read: dbNotification.read || false,
    created_at: dbNotification.created_at || new Date().toISOString(),
    expires_at: dbNotification.expires_at || undefined
  };
};

export const transformNotificationToDatabase = (
  notification: Omit<Notification, 'id' | 'created_at' | 'read'>
): Omit<TablesInsert<'notifications'>, 'id' | 'created_at' | 'read'> => {
  return {
    user_id: notification.user_id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    expires_at: notification.expires_at || null
  };
};

// Transformadores para Ofertas de Bonos
export const transformDatabaseBondOffering = (
  dbOffering: Tables<'bond_offerings'>
): BondOffering => {
  return {
    id: dbOffering.id,
    bond_id: dbOffering.bond_id,
    total_amount: dbOffering.total_amount,
    available_amount: dbOffering.available_amount,
    min_investment: dbOffering.min_investment,
    max_investment: dbOffering.max_investment || undefined,
    offering_start_date: dbOffering.offering_start_date,
    offering_end_date: dbOffering.offering_end_date,
    status: dbOffering.status as 'pending' | 'open' | 'closed' | 'cancelled',
    description: dbOffering.description || undefined,
    terms_and_conditions: dbOffering.terms_and_conditions || undefined,
    created_at: dbOffering.created_at || undefined,
    updated_at: dbOffering.updated_at || undefined
  };
};

export const transformBondOfferingToDatabase = (
  offering: Omit<BondOffering, 'id' | 'created_at' | 'updated_at'>
): Omit<TablesInsert<'bond_offerings'>, 'id' | 'created_at' | 'updated_at'> => {
  return {
    bond_id: offering.bond_id,
    total_amount: offering.total_amount,
    available_amount: offering.available_amount,
    min_investment: offering.min_investment,
    max_investment: offering.max_investment || null,
    offering_start_date: offering.offering_start_date,
    offering_end_date: offering.offering_end_date,
    status: offering.status,
    description: offering.description || null,
    terms_and_conditions: offering.terms_and_conditions || null
  };
};

// Transformadores para Transacciones
export const transformDatabaseTransaction = (
  dbTransaction: Tables<'transactions'>
): Transaction => {
  return {
    id: dbTransaction.id,
    investment_id: dbTransaction.investment_id,
    transaction_type: dbTransaction.transaction_type as 'interest_payment' | 'amortization' | 'principal_return' | 'fee',
    amount: dbTransaction.amount,
    transaction_date: dbTransaction.transaction_date,
    period_number: dbTransaction.period_number || undefined,
    description: dbTransaction.description || undefined,
    status: dbTransaction.status as 'pending' | 'completed' | 'failed',
    created_at: dbTransaction.created_at || undefined
  };
};

export const transformTransactionToDatabase = (
  transaction: Omit<Transaction, 'id' | 'created_at'>
): Omit<TablesInsert<'transactions'>, 'id' | 'created_at'> => {
  return {
    investment_id: transaction.investment_id,
    transaction_type: transaction.transaction_type,
    amount: transaction.amount,
    transaction_date: transaction.transaction_date,
    period_number: transaction.period_number || null,
    description: transaction.description || null,
    status: transaction.status
  };
};

// Transformadores para Ratings
export const transformDatabaseBondRating = (
  dbRating: Tables<'bond_ratings'>
): BondRating => {
  return {
    id: dbRating.id,
    bond_id: dbRating.bond_id,
    rating_agency: dbRating.rating_agency,
    rating: dbRating.rating,
    outlook: dbRating.outlook as 'positive' | 'stable' | 'negative' | 'developing' || undefined,
    rating_date: dbRating.rating_date,
    notes: dbRating.notes || undefined,
    created_at: dbRating.created_at || undefined
  };
};

export const transformBondRatingToDatabase = (
  rating: Omit<BondRating, 'id' | 'created_at'>
): Omit<TablesInsert<'bond_ratings'>, 'id' | 'created_at'> => {
  return {
    bond_id: rating.bond_id,
    rating_agency: rating.rating_agency,
    rating: rating.rating,
    outlook: rating.outlook || null,
    rating_date: rating.rating_date,
    notes: rating.notes || null
  };
};

// Funciones auxiliares
export const getFrequencyText = (frequency: number): string => {
  switch (frequency) {
    case 1: return 'anuales';
    case 2: return 'semestrales';
    case 4: return 'trimestrales';
    case 12: return 'mensuales';
    default: return `cada ${12/frequency} meses`;
  }
};

export const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case "USD": return "$";
    case "PEN": return "S/.";
    case "EUR": return "€";
    default: return "";
  }
};

export const formatCurrency = (amount: number, currency: string): string => {
  return `${getCurrencySymbol(currency)} ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const generateRandomRating = (): string => {
  const ratings = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-'];
  return ratings[Math.floor(Math.random() * ratings.length)];
};

export const getRatingColor = (rating: string): string => {
  if (rating.startsWith('AAA') || rating.startsWith('AA')) return 'bg-green-100 text-green-800';
  if (rating.startsWith('A')) return 'bg-blue-100 text-blue-800';
  if (rating.startsWith('BBB')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

export const calculateInvestmentMetrics = (investment: Investment) => {
  const investmentDate = new Date(investment.investment_date);
  const currentDate = new Date();
  const daysHeld = Math.floor((currentDate.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (!investment.bond) {
    return {
      current_value: investment.amount,
      expected_return: 0,
      days_to_maturity: 0,
      return_percentage: 0
    };
  }

  const emissionDate = new Date(investment.bond.emission_date);
  const maturityDate = new Date(emissionDate);
  maturityDate.setFullYear(maturityDate.getFullYear() + investment.bond.term);
  
  const daysToMaturity = Math.max(0, Math.floor((maturityDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Cálculo simplificado del valor actual
  const timeHeld = daysHeld / 365.25; // años
  const annualRate = investment.bond.interest_rate / 100;
  const expectedReturn = investment.amount * annualRate * timeHeld;
  const currentValue = investment.amount + expectedReturn;
  const returnPercentage = investment.amount > 0 ? (expectedReturn / investment.amount) * 100 : 0;

  return {
    current_value: currentValue,
    expected_return: expectedReturn,
    days_to_maturity: daysToMaturity,
    return_percentage: returnPercentage,
    days_held: daysHeld
  };
};

// Validadores de tipos
export const isValidInvestmentStatus = (status: string): status is 'active' | 'matured' | 'cancelled' => {
  return ['active', 'matured', 'cancelled'].includes(status);
};

export const isValidTransactionType = (type: string): type is 'interest_payment' | 'amortization' | 'principal_return' | 'fee' => {
  return ['interest_payment', 'amortization', 'principal_return', 'fee'].includes(type);
};

export const isValidNotificationType = (type: string): type is 'investment' | 'payment' | 'maturity' | 'system' | 'alert' => {
  return ['investment', 'payment', 'maturity', 'system', 'alert'].includes(type);
};

export const isValidOfferingStatus = (status: string): status is 'pending' | 'open' | 'closed' | 'cancelled' => {
  return ['pending', 'open', 'closed', 'cancelled'].includes(status);
};

// Constantes útiles
export const INVESTMENT_STATUS_LABELS = {
  active: 'Activa',
  matured: 'Vencida',
  cancelled: 'Cancelada'
} as const;

export const TRANSACTION_TYPE_LABELS = {
  interest_payment: 'Pago de Intereses',
  amortization: 'Amortización',
  principal_return: 'Devolución Principal',
  fee: 'Comisión'
} as const;

export const NOTIFICATION_TYPE_LABELS = {
  investment: 'Inversión',
  payment: 'Pago',
  maturity: 'Vencimiento',
  system: 'Sistema',
  alert: 'Alerta'
} as const;

export const OFFERING_STATUS_LABELS = {
  pending: 'Pendiente',
  open: 'Abierta',
  closed: 'Cerrada',
  cancelled: 'Cancelada'
} as const;