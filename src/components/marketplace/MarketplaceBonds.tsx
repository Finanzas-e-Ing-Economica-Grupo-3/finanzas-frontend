import React, { useEffect, useState } from "react";
import { calculateCashFlow, analyzeBond } from "@/utils/bondCalculations";
import { generateBondReportPDF } from "@/utils/pdfGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  Grid3X3,
  List
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";
import {
  MarketplaceBond,
  Investment,
  InvestmentRequest,
  MarketplaceFilters
} from '@/types/investment';
import {
  transformToMarketplaceBond,
  formatCurrency,
  getCurrencySymbol,
  getFrequencyText,
  generateRandomRating,
  getRatingColor
} from '@/utils/typeTransformers';
import { Bond, CashFlow, BondAnalysis } from "@/types/bond";

// Importar los nuevos componentes
import { BondCard } from './BondCard';
import { BondTable } from './BondTable';
import { BondDetailModal } from './BondDetailModal';

const MarketplaceBonds: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bonds, setBonds] = useState<MarketplaceBond[]>([]);
  const [filteredBonds, setFilteredBonds] = useState<MarketplaceBond[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("all");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [sortBy, setSortBy] = useState("interest_rate_desc");

  // Modal states
  const [selectedBond, setSelectedBond] = useState<MarketplaceBond | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [investing, setInvesting] = useState(false);

  // Para flujo de caja y análisis en el modal de detalles
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [bondAnalysis, setBondAnalysis] = useState<BondAnalysis | null>(null);

  // Validar rol de usuario inversionista
  useEffect(() => {
    const role = localStorage.getItem("currentUserRole");
    if (role !== "investor") {
      toast.error("Acceso solo para inversionistas");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    fetchMarketplaceBonds();
  }, []);

  useEffect(() => {
    filterAndSortBonds();
  }, [bonds, searchTerm, selectedCurrency, selectedTerm, selectedRating, sortBy]);

  // Calcular flujo de caja y análisis cuando se abre el modal de detalles
  useEffect(() => {
    if (selectedBond && detailModalOpen) {
      try {
        const bondObj: Bond = {
          id: selectedBond.id,
          name: selectedBond.name,
          nominalValue: selectedBond.nominal_value,
          interestRate: selectedBond.interest_rate,
          term: selectedBond.term,
          frequency: selectedBond.frequency,
          amortizationType: selectedBond.amortization_type as Bond['amortizationType'],
          graceType: selectedBond.grace_type as Bond['graceType'],
          emissionDate: selectedBond.emission_date,
          settings: {
            currency: selectedBond.currency as Bond['settings']['currency'],
            interestRateType: selectedBond.interest_rate_type as Bond['settings']['interestRateType'],
            capitalization: selectedBond.capitalization || undefined
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: selectedBond.issuer_id,
          gracePeriods: selectedBond.grace_periods
        };

        const flow = calculateCashFlow(bondObj);
        setCashFlow(flow);
        
        const analysis = analyzeBond(bondObj, flow, 5.0);
        setBondAnalysis(analysis);
      } catch (error) {
        console.error('Error calculando flujo de caja y análisis:', error);
        setCashFlow([]);
        setBondAnalysis(null);
      }
    } else {
      setCashFlow([]);
      setBondAnalysis(null);
    }
  }, [selectedBond, detailModalOpen]);

  const fetchMarketplaceBonds = async () => {
    try {
      setLoading(true);
      
      const { data: bondsData, error: bondsError } = await supabase
        .from('bonds')
        .select('*')
        .order('created_at', { ascending: false });

      if (bondsError) throw bondsError;

      if (!bondsData || bondsData.length === 0) {
        setBonds([]);
        return;
      }

      // Obtener perfiles de emisores
      const uniqueUserIds = [...new Set(bondsData.map((bond: any) => bond.user_id))];
      let profilesMap: Record<string, string> = {};
      
      if (uniqueUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uniqueUserIds);

        if (!profilesError) {
          profilesMap = (profilesData || []).reduce((acc: Record<string, string>, profile: any) => {
            acc[profile.id] = profile.name || 'Sin nombre';
            return acc;
          }, {});
        }
      }

      // Transformar bonos
      const marketplaceBonds: MarketplaceBond[] = bondsData.map((bond: any) =>
        transformToMarketplaceBond(
          bond,
          profilesMap[bond.user_id] || 'Desconocido',
          undefined,
          undefined
        )
      );

      setBonds(marketplaceBonds);
    } catch (error) {
      console.error('Error fetching marketplace bonds:', error);
      toast.error('Error al cargar los bonos del mercado');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBonds = () => {
    let filtered = bonds.filter(bond => {
      const matchesSearch = bond.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bond.issuer_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCurrency = selectedCurrency === "all" || bond.currency === selectedCurrency;
      const matchesTerm = selectedTerm === "all" ||
        (selectedTerm === "short" && bond.term <= 2) ||
        (selectedTerm === "medium" && bond.term > 2 && bond.term <= 5) ||
        (selectedTerm === "long" && bond.term > 5);
      const matchesRating = selectedRating === "all" || bond.rating === selectedRating;
      
      return matchesSearch && matchesCurrency && matchesTerm && matchesRating;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "interest_rate_desc":
          return b.interest_rate - a.interest_rate;
        case "interest_rate_asc":
          return a.interest_rate - b.interest_rate;
        case "term_asc":
          return a.term - b.term;
        case "term_desc":
          return b.term - a.term;
        case "amount_desc":
          return b.available_amount - a.available_amount;
        case "amount_asc":
          return a.available_amount - b.available_amount;
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "issuer_asc":
          return a.issuer_name.localeCompare(b.issuer_name);
        case "issuer_desc":
          return b.issuer_name.localeCompare(a.issuer_name);
        default:
          return 0;
      }
    });

    setFilteredBonds(filtered);
  };

  const handleInvestment = async () => {
    if (!selectedBond || !investmentAmount || !user) return;

    const amount = parseFloat(investmentAmount);

    if (amount < selectedBond.min_investment) {
      toast.error(`El monto mínimo de inversión es ${formatCurrency(selectedBond.min_investment, selectedBond.currency)}`);
      return;
    }

    if (amount > selectedBond.available_amount) {
      toast.error(`El monto máximo disponible es ${formatCurrency(selectedBond.available_amount, selectedBond.currency)}`);
      return;
    }

    try {
      setInvesting(true);

      const { data: existingInvestment, error: checkError } = await supabase
        .from('investments')
        .select('*')
        .eq('investor_id', user.id)
        .eq('bond_id', selectedBond.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingInvestment) {
        const { error: updateError } = await supabase
          .from('investments')
          .update({
            amount: existingInvestment.amount + amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInvestment.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('investments')
          .insert({
            investor_id: user.id,
            bond_id: selectedBond.id,
            amount: amount,
            investment_date: new Date().toISOString(),
            status: 'active'
          });

        if (insertError) throw insertError;
      }

      toast.success(`¡Inversión realizada con éxito! Has invertido ${formatCurrency(amount, selectedBond.currency)} en ${selectedBond.name}`);
      setInvestmentModalOpen(false);
      setInvestmentAmount("");
      setSelectedBond(null);

      setBonds(prev => prev.map(bond =>
        bond.id === selectedBond.id
          ? { ...bond, available_amount: Math.max(0, bond.available_amount - amount) }
          : bond
      ));

    } catch (error) {
      console.error('Error making investment:', error);
      toast.error('Error al realizar la inversión');
    } finally {
      setInvesting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedBond || !cashFlow.length || !bondAnalysis) {
      toast.error('Error: No hay datos suficientes para generar el PDF');
      return;
    }

    try {
      const bondObj: Bond = {
        id: selectedBond.id,
        name: selectedBond.name,
        nominalValue: selectedBond.nominal_value,
        interestRate: selectedBond.interest_rate,
        term: selectedBond.term,
        frequency: selectedBond.frequency,
        amortizationType: selectedBond.amortization_type as Bond['amortizationType'],
        graceType: selectedBond.grace_type as Bond['graceType'],
        gracePeriods: selectedBond.grace_periods,
        emissionDate: selectedBond.emission_date,
        settings: {
          currency: selectedBond.currency as Bond['settings']['currency'],
          interestRateType: selectedBond.interest_rate_type as Bond['settings']['interestRateType'],
          capitalization: selectedBond.capitalization || undefined
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: selectedBond.issuer_id
      };

      generateBondReportPDF(bondObj, cashFlow, bondAnalysis);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const handleViewDetails = (bond: MarketplaceBond) => {
    setSelectedBond(bond);
    setDetailModalOpen(true);
  };

  const handleInvestClick = (bond: MarketplaceBond) => {
    setSelectedBond(bond);
    setInvestmentModalOpen(true);
  };

  const handleSort = (sortType: string) => {
    setSortBy(sortType);
  };

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
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Mercado de Bonos</h1>
            <p className="text-muted-foreground">
              Explora y invierte en bonos de diferentes emisores
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mensaje cuando no hay datos */}
        {!loading && bonds.length === 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-16 text-center">
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-orange-900">No hay bonos en la base de datos</h3>
                <div className="text-orange-700 space-y-2">
                  <p>Parece que no hay bonos creados aún en el sistema.</p>
                  <p className="text-sm">Para ver bonos aquí, necesitas:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li>Crear bonos como emisor primero</li>
                    <li>Verificar que las tablas de la base de datos estén creadas</li>
                    <li>Comprobar los permisos RLS de Supabase</li>
                  </ul>
                </div>
                <Button onClick={fetchMarketplaceBonds} className="mt-4">
                  🔄 Intentar de nuevo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content normal solo si hay datos */}
        {bonds.length > 0 && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Bonos Disponibles</p>
                      <p className="text-2xl font-bold">{filteredBonds.length}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-bond-blue" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tasa Promedio</p>
                      <p className="text-2xl font-bold">
                        {filteredBonds.length > 0
                          ? (filteredBonds.reduce((sum, bond) => sum + bond.interest_rate, 0) / filteredBonds.length).toFixed(2)
                          : '0.00'}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-bond-green" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          filteredBonds.reduce((sum, bond) => sum + bond.available_amount, 0),
                          'USD'
                        )}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Plazo Promedio</p>
                      <p className="text-2xl font-bold">
                        {filteredBonds.length > 0
                          ? (filteredBonds.reduce((sum, bond) => sum + bond.term, 0) / filteredBonds.length).toFixed(1)
                          : '0.0'} años
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar bonos o emisores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las monedas</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="PEN">PEN (S/.)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Plazo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los plazos</SelectItem>
                      <SelectItem value="short">Corto (≤2 años)</SelectItem>
                      <SelectItem value="medium">Medio (2-5 años)</SelectItem>
                      <SelectItem value="long">Largo ({'>'}5 años)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interest_rate_desc">Tasa ↓</SelectItem>
                      <SelectItem value="interest_rate_asc">Tasa ↑</SelectItem>
                      <SelectItem value="name_asc">Nombre A-Z</SelectItem>
                      <SelectItem value="name_desc">Nombre Z-A</SelectItem>
                      <SelectItem value="issuer_asc">Emisor A-Z</SelectItem>
                      <SelectItem value="issuer_desc">Emisor Z-A</SelectItem>
                      <SelectItem value="term_asc">Plazo ↑</SelectItem>
                      <SelectItem value="term_desc">Plazo ↓</SelectItem>
                      <SelectItem value="amount_desc">Monto ↓</SelectItem>
                      <SelectItem value="amount_asc">Monto ↑</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Content Views */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBonds.map((bond) => (
                  <BondCard
                    key={bond.id}
                    bond={bond}
                    onViewDetails={handleViewDetails}
                    onInvest={handleInvestClick}
                  />
                ))}
              </div>
            ) : (
              <BondTable
                bonds={filteredBonds}
                sortBy={sortBy}
                onSort={handleSort}
                onViewDetails={handleViewDetails}
                onInvest={handleInvestClick}
              />
            )}

            {filteredBonds.length === 0 && bonds.length > 0 && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron bonos con los filtros aplicados</h3>
                  <p className="text-muted-foreground">
                    Intenta ajustar los filtros de búsqueda para encontrar más opciones
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Investment Modal */}
        <Dialog open={investmentModalOpen} onOpenChange={setInvestmentModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invertir en {selectedBond?.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Emisor:</span>
                  <span className="text-sm font-medium">{selectedBond?.issuer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tasa:</span>
                  <span className="text-sm font-medium">{selectedBond?.interest_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Disponible:</span>
                  <span className="text-sm font-medium">
                    {selectedBond && formatCurrency(selectedBond.available_amount, selectedBond.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Mín. Inversión:</span>
                  <span className="text-sm font-medium">
                    {selectedBond && formatCurrency(selectedBond.min_investment, selectedBond.currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investment-amount">Monto a Invertir</Label>
                <Input
                  id="investment-amount"
                  type="number"
                  placeholder="0.00"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  min={selectedBond?.min_investment}
                  max={selectedBond?.available_amount}
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  Monto en {selectedBond?.currency}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setInvestmentModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-bond-green text-black hover:bg-bond-green/80"
                  onClick={handleInvestment}
                  disabled={investing || !investmentAmount || parseFloat(investmentAmount) < (selectedBond?.min_investment || 0)}
                >
                  {investing ? 'Procesando...' : 'Confirmar Inversión'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail Modal usando el nuevo componente */}
        <BondDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          bond={selectedBond}
          cashFlow={cashFlow}
          bondAnalysis={bondAnalysis}
          onDownloadPDF={handleDownloadPDF}
          onInvest={handleInvestClick}
        />
      </div>
    </AppLayout>
  );
};

export default MarketplaceBonds;