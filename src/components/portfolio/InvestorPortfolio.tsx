import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  PieChart,
  BarChart3,
  Wallet,
  Target,
  Award
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { 
  Investment, 
  PortfolioStats 
} from '@/types/investment';
import { 
  transformDatabaseInvestment,
  calculateInvestmentMetrics,
  formatCurrency,
  getFrequencyText
} from '@/utils/typeTransformers';

const InvestorPortfolio: React.FC = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stats, setStats] = useState<PortfolioStats>({
    total_invested: 0,
    current_value: 0,
    total_return: 0,
    return_percentage: 0,
    active_investments: 0,
    average_yield: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvestments();
    }
  }, [user]);

  const fetchInvestments = async () => {
    try {
      setLoading(true);

      // 1. Obtener inversiones con información básica del bono (sin join a profiles)
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('investments')
        .select(`*, bonds:bond_id(name, interest_rate, term, frequency, currency, emission_date, amortization_type, user_id, nominal_value)`) // sin join a profiles
        .eq('investor_id', user!.id)
        .eq('status', 'active')
        .order('investment_date', { ascending: false });

      if (investmentsError) throw investmentsError;

      // 2. Obtener todos los userIds únicos de los bonos
      const userIds = Array.from(new Set(investmentsData.map(inv => inv.bonds?.user_id).filter(Boolean)));
      let userIdToName: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        if (profilesError) throw profilesError;
        userIdToName = (profilesData || []).reduce((acc, profile) => {
          acc[profile.id] = profile.name;
          return acc;
        }, {} as Record<string, string>);
      }

      // 3. Procesar datos de inversiones, agregando issuer_name correcto
      const processedInvestments: Investment[] = investmentsData.map(inv => {
        const bond = inv.bonds ? {
          ...inv.bonds,
          issuer_name: userIdToName[inv.bonds.user_id] || 'Emisor Anónimo',
        } : undefined;
        const transformedInvestment = transformDatabaseInvestment(inv, bond);
        const metrics = calculateInvestmentMetrics(transformedInvestment);
        return {
          ...transformedInvestment,
          ...metrics
        };
      });

      setInvestments(processedInvestments);

      // Calcular estadísticas del portfolio
      const totalInvested = processedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
      const totalCurrentValue = processedInvestments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);
      const totalReturn = totalCurrentValue - totalInvested;
      const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
      const averageYield = processedInvestments.length > 0 
        ? processedInvestments.reduce((sum, inv) => sum + inv.bond.interest_rate, 0) / processedInvestments.length 
        : 0;

      setStats({
        total_invested: totalInvested,
        current_value: totalCurrentValue,
        total_return: totalReturn,
        return_percentage: returnPercentage,
        active_investments: processedInvestments.length,
        average_yield: averageYield
      });

    } catch (error) {
      console.error('Error fetching investments:', error);
      toast.error('Error al cargar el portfolio');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case "USD": return "$";
      case "PEN": return "S/.";
      case "EUR": return "€";
      default: return "";
    }
  };

  const formatCurrencyLocal = (amount: number, currency: string = 'USD'): string => {
    return `${getCurrencySymbol(currency)} ${amount.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusColor = (daysToMaturity: number): string => {
    if (daysToMaturity > 365) return 'bg-green-100 text-green-800';
    if (daysToMaturity > 90) return 'bg-yellow-100 text-yellow-800';
    if (daysToMaturity > 30) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = (daysToMaturity: number): string => {
    if (daysToMaturity > 365) return 'Largo Plazo';
    if (daysToMaturity > 90) return 'Medio Plazo';
    if (daysToMaturity > 30) return 'Próximo Venc.';
    return 'Vencimiento Próximo';
  };

  // Agrupar inversiones por moneda para el resumen
  const investmentsByCurrency = investments.reduce((acc, inv) => {
    const currency = inv.bond.currency;
    if (!acc[currency]) {
      acc[currency] = { invested: 0, current: 0, count: 0 };
    }
    acc[currency].invested += inv.amount;
    acc[currency].current += inv.current_value || inv.amount;
    acc[currency].count += 1;
    return acc;
  }, {} as Record<string, { invested: number; current: number; count: number }>);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-bond-green"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Mi Portfolio</h1>
          <p className="text-muted-foreground">
            Gestiona y monitorea tus inversiones en bonos
          </p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invertido</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_invested, 'USD')}</p>
                </div>
                <Wallet className="h-8 w-8 text-bond-blue" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Actual</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.current_value, 'USD')}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-bond-green" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rendimiento</p>
                  <p className={`text-2xl font-bold flex items-center ${
                    stats.return_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.return_percentage >= 0 ? (
                      <TrendingUp className="h-5 w-5 mr-1" />
                    ) : (
                      <TrendingDown className="h-5 w-5 mr-1" />
                    )}
                    {stats.return_percentage.toFixed(2)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inversiones Activas</p>
                  <p className="text-2xl font-bold">{stats.active_investments}</p>
                  <p className="text-xs text-muted-foreground">Yield prom: {stats.average_yield.toFixed(2)}%</p>
                </div>
                <PieChart className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Content */}
        <Tabs defaultValue="investments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="investments">Inversiones</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="diversification">Diversificación</TabsTrigger>
          </TabsList>

          <TabsContent value="investments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mis Inversiones</CardTitle>
              </CardHeader>
              <CardContent>
                {investments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bono</TableHead>
                          <TableHead>Emisor</TableHead>
                          <TableHead>Inversión</TableHead>
                          <TableHead>Valor Actual</TableHead>
                          <TableHead>Rendimiento</TableHead>
                          <TableHead>Tasa</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {investments.map((investment) => (
                          <TableRow key={investment.id}>
                            <TableCell className="font-medium">
                              {investment.bond.name}
                            </TableCell>
                            <TableCell>{investment.bond.issuer_name}</TableCell>
                            <TableCell>
                              {formatCurrency(investment.amount, investment.bond.currency)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(investment.current_value || investment.amount, investment.bond.currency)}
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium ${
                                (investment.expected_return || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(investment.expected_return || 0, investment.bond.currency)}
                              </span>
                            </TableCell>
                            <TableCell>{investment.bond.interest_rate}%</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {investment.days_to_maturity} días
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {getFrequencyText(investment.bond.frequency)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(investment.days_to_maturity || 0)}>
                                {getStatusText(investment.days_to_maturity || 0)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tienes inversiones aún</h3>
                    <p className="text-muted-foreground mb-4">
                      Explora el mercado de bonos para hacer tu primera inversión
                    </p>
                    <Button
                      className="bg-bond-green text-black hover:bg-bond-green/80"
                      onClick={() => window.location.href = '/marketplace'}
                    >
                      Explorar Bonos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-bond-green" />
                    Resumen de Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Ganancia/Pérdida Total:</span>
                    <span className={`font-bold ${
                      stats.total_return >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(stats.total_return, 'USD')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">ROI Total:</span>
                    <span className={`font-bold ${
                      stats.return_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.return_percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Yield Promedio:</span>
                    <span className="font-bold text-bond-blue">
                      {stats.average_yield.toFixed(2)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    Mejores Inversiones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {investments
                      .sort((a, b) => (b.expected_return || 0) - (a.expected_return || 0))
                      .slice(0, 3)
                      .map((investment, index) => (
                        <div key={investment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{investment.bond.name}</p>
                              <p className="text-xs text-muted-foreground">{investment.bond.interest_rate}%</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">
                              {formatCurrency(investment.expected_return || 0, investment.bond.currency)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="diversification" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Por Moneda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(investmentsByCurrency).map(([currency, data]) => {
                      const percentage = (data.invested / stats.total_invested) * 100;
                      return (
                        <div key={currency} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{currency}</span>
                            <span className="text-sm text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-bond-blue h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatCurrency(data.invested, currency)}</span>
                            <span>{data.count} inversiones</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Por Vencimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Corto Plazo (< 1 año)', filter: (inv: Investment) => (inv.days_to_maturity || 0) < 365 },
                      { label: 'Medio Plazo (1-3 años)', filter: (inv: Investment) => (inv.days_to_maturity || 0) >= 365 && (inv.days_to_maturity || 0) < 1095 },
                      { label: 'Largo Plazo (> 3 años)', filter: (inv: Investment) => (inv.days_to_maturity || 0) >= 1095 }
                    ].map(({ label, filter }) => {
                      const filtered = investments.filter(filter);
                      const amount = filtered.reduce((sum, inv) => sum + inv.amount, 0);
                      const percentage = stats.total_invested > 0 ? (amount / stats.total_invested) * 100 : 0;
                      
                      return (
                        <div key={label} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">{label}</span>
                            <span className="text-sm text-muted-foreground">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-bond-green h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatCurrency(amount, 'USD')}</span>
                            <span>{filtered.length} inversiones</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default InvestorPortfolio;