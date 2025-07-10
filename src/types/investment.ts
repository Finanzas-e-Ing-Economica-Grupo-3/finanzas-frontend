export interface MarketplaceBond {
  id: string;
  name: string;
  nominal_value: number;
  interest_rate: number;
  term: number;
  frequency: number;
  currency: string;
  emission_date: string;
  amortization_type: string;
  grace_type: string;
  grace_periods: number;
  interest_rate_type: string;
  issuer_name: string;
  issuer_id: string;
  available_amount: number;
  min_investment: number;
  max_investment?: number;
  rating?: string;
  description?: string;
  offering_id?: string;
  offering_status?: 'pending' | 'open' | 'closed' | 'cancelled';
}

export interface Investment {
  id: string;
  investor_id: string;
  bond_id: string;
  amount: number;
  investment_date: string;
  status: 'active' | 'matured' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  bond?: {
    name: string;
    interest_rate: number;
    term: number;
    frequency: number;
    currency: string;
    emission_date: string;
    amortization_type: string;
    issuer_name: string;
    nominal_value: number;
  };
  current_value?: number;
  expected_return?: number;
  days_to_maturity?: number;
}

export interface Transaction {
  id: string;
  investment_id: string;
  transaction_type: 'interest_payment' | 'amortization' | 'principal_return' | 'fee';
  amount: number;
  transaction_date: string;
  period_number?: number;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'investment' | 'payment' | 'maturity' | 'system' | 'alert';
  read: boolean;
  created_at: string;
  expires_at?: string;
}

export interface BondOffering {
  id: string;
  bond_id: string;
  total_amount: number;
  available_amount: number;
  min_investment: number;
  max_investment?: number;
  offering_start_date: string;
  offering_end_date: string;
  status: 'pending' | 'open' | 'closed' | 'cancelled';
  description?: string;
  terms_and_conditions?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BondRating {
  id: string;
  bond_id: string;
  rating_agency: string;
  rating: string;
  outlook?: 'positive' | 'stable' | 'negative' | 'developing';
  rating_date: string;
  notes?: string;
  created_at?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_currency: string;
  default_interest_rate_type: string;
  default_capitalization?: string;
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive';
  preferred_term?: 'short' | 'medium' | 'long' | 'any';
  auto_reinvest: boolean;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PortfolioStats {
  total_invested: number;
  current_value: number;
  total_return: number;
  return_percentage: number;
  active_investments: number;
  average_yield: number;
  best_performing_bond_id?: string;
  best_performing_return?: number;
}

export interface MarketplaceStats {
  total_bonds: number;
  active_offerings: number;
  average_yield: number;
  total_available: number;
  total_issuers: number;
}

// Enums y tipos de unión
export type InvestmentStatus = 'active' | 'matured' | 'cancelled';
export type TransactionType = 'interest_payment' | 'amortization' | 'principal_return' | 'fee';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type NotificationType = 'investment' | 'payment' | 'maturity' | 'system' | 'alert';
export type OfferingStatus = 'pending' | 'open' | 'closed' | 'cancelled';
export type RatingOutlook = 'positive' | 'stable' | 'negative' | 'developing';
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type PreferredTerm = 'short' | 'medium' | 'long' | 'any';
export type RoleType = 'investor' | 'issuer' | 'admin';

// Tipos para formularios y requests
export interface InvestmentRequest {
  bond_id: string;
  amount: number;
  investor_id: string;
}

export interface CreateOfferingRequest {
  bond_id: string;
  total_amount: number;
  available_amount: number;
  min_investment: number;
  max_investment?: number;
  offering_start_date: string;
  offering_end_date: string;
  description?: string;
  terms_and_conditions?: string;
}

export interface NotificationRequest {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  expires_at?: string;
}

// Tipos para filtros y búsquedas
export interface MarketplaceFilters {
  search: string;
  currency: 'all' | string;
  term: 'all' | 'short' | 'medium' | 'long';
  rating: 'all' | string;
  min_amount?: number;
  max_amount?: number;
  sort_by: 'interest_rate_desc' | 'interest_rate_asc' | 'term_asc' | 'term_desc' | 'amount_desc' | 'amount_asc';
}

export interface PortfolioFilters {
  status: 'all' | InvestmentStatus;
  currency: 'all' | string;
  bond_name: string;
  date_from?: string;
  date_to?: string;
}

// Tipos para respuestas de API
export interface InvestmentResponse {
  success: boolean;
  message: string;
  investment?: Investment;
  error?: string;
}

export interface PortfolioResponse {
  investments: Investment[];
  stats: PortfolioStats;
  total_count: number;
}

export interface MarketplaceResponse {
  bonds: MarketplaceBond[];
  stats: MarketplaceStats;
  total_count: number;
}

// Tipos para cálculos financieros
export interface InvestmentCalculation {
  principal: number;
  current_value: number;
  accrued_interest: number;
  total_return: number;
  return_percentage: number;
  days_held: number;
  days_to_maturity: number;
  annualized_return: number;
}

export interface BondMetrics {
  yield_to_maturity: number;
  current_yield: number;
  duration: number;
  modified_duration: number;
  convexity: number;
  price_volatility: number;
}

// Tipos para dashboards y analytics
export interface DashboardData {
  portfolio_stats: PortfolioStats;
  recent_investments: Investment[];
  upcoming_payments: Transaction[];
  market_trends: {
    average_rates: number[];
    volume_trends: number[];
    popular_terms: string[];
  };
  notifications: Notification[];
}

export interface AnalyticsData {
  performance_over_time: {
    date: string;
    value: number;
    return: number;
  }[];
  diversification: {
    by_currency: Record<string, number>;
    by_term: Record<string, number>;
    by_issuer: Record<string, number>;
  };
  risk_metrics: {
    portfolio_duration: number;
    credit_risk_score: number;
    concentration_risk: number;
  };
}

// Tipos para tablas de la base de datos (extendiendo los tipos base)
export interface DatabaseInvestment {
  id: string;
  investor_id: string;
  bond_id: string;
  amount: number;
  investment_date: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface DatabaseNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean | null;
  created_at: string | null;
  expires_at: string | null;
}

export interface DatabaseBondOffering {
  id: string;
  bond_id: string;
  total_amount: number;
  available_amount: number;
  min_investment: number;
  max_investment: number | null;
  offering_start_date: string;
  offering_end_date: string;
  status: string;
  description: string | null;
  terms_and_conditions: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DatabaseTransaction {
  id: string;
  investment_id: string;
  transaction_type: string;
  amount: number;
  transaction_date: string;
  period_number: number | null;
  description: string | null;
  status: string;
  created_at: string | null;
}

export interface DatabaseBondRating {
  id: string;
  bond_id: string;
  rating_agency: string;
  rating: string;
  outlook: string | null;
  rating_date: string;
  notes: string | null;
  created_at: string | null;
}

// Utility types para transformaciones
export type CreateInvestment = Omit<Investment, 'id' | 'created_at' | 'updated_at'>;
export type UpdateInvestment = Partial<Pick<Investment, 'amount' | 'status'>>;
export type CreateNotification = Omit<Notification, 'id' | 'created_at' | 'read'>;
export type CreateBondOffering = Omit<BondOffering, 'id' | 'created_at' | 'updated_at'>;

// Types para hooks y context
export interface InvestmentContextType {
  investments: Investment[];
  stats: PortfolioStats;
  loading: boolean;
  error: string | null;
  refreshInvestments: () => Promise<void>;
  createInvestment: (investment: CreateInvestment) => Promise<InvestmentResponse>;
  updateInvestment: (id: string, updates: UpdateInvestment) => Promise<InvestmentResponse>;
}

export interface MarketplaceContextType {
  bonds: MarketplaceBond[];
  stats: MarketplaceStats;
  loading: boolean;
  error: string | null;
  filters: MarketplaceFilters;
  setFilters: (filters: Partial<MarketplaceFilters>) => void;
  refreshBonds: () => Promise<void>;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}