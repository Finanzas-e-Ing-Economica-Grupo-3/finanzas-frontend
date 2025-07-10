import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  Search,
  Filter,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  Eye,
  ShoppingCart,
  Star,
  Award,
  Grid3X3,
  List,
  ArrowUpDown
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

  const fetchMarketplaceBonds = async () => {
    try {
      setLoading(true);
      console.log('🔍 Iniciando fetch de bonos...');

      // 1. Verificar conexión a Supabase
      console.log('📡 Verificando conexión a Supabase...');
      const { data: testConnection, error: connectionError } = await supabase
        .from('bonds')
        .select('count')
        .limit(1);
      
      if (connectionError) {
        console.error('❌ Error de conexión:', connectionError);
        throw connectionError;
      }
      console.log('✅ Conexión exitosa');

      // 2. Obtener TODOS los bonos con información detallada
      console.log('📊 Obteniendo bonos...');
      const { data: bondsData, error: bondsError, count } = await supabase
        .from('bonds')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      console.log('📈 Resultado de consulta bonds:', {
        data: bondsData,
        error: bondsError,
        count: count,
        dataLength: bondsData?.length || 0
      });

      if (bondsError) {
        console.error('❌ Error al obtener bonos:', bondsError);
        throw bondsError;
      }

      if (!bondsData || bondsData.length === 0) {
        console.warn('⚠️ No se encontraron bonos en la base de datos');
        setBonds([]);
        return;
      }

      console.log('✅ Bonos obtenidos:', bondsData.length);

      // 3. Obtener perfiles de emisores
      const uniqueUserIds = [...new Set(bondsData.map((bond: any) => bond.user_id))];
      console.log('👥 IDs únicos de usuarios:', uniqueUserIds);

      let profilesMap: Record<string, string> = {};
      if (uniqueUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uniqueUserIds);

        console.log('👤 Perfiles obtenidos:', {
          data: profilesData,
          error: profilesError
        });

        if (profilesError) {
          console.warn('⚠️ Error al obtener perfiles, usando nombres por defecto:', profilesError);
        } else {
          profilesMap = (profilesData || []).reduce((acc: Record<string, string>, profile: any) => {
            acc[profile.id] = profile.name || 'Sin nombre';
            return acc;
          }, {});
        }
      }

      console.log('🗺️ Mapa de perfiles:', profilesMap);

      // 4. Transformar bonos
      console.log('🔄 Transformando bonos...');
      const marketplaceBonds: MarketplaceBond[] = bondsData.map((bond: any, index: number) => {
        console.log(`🔄 Transformando bono ${index + 1}:`, {
          id: bond.id,
          name: bond.name,
          user_id: bond.user_id,
          issuer_name: profilesMap[bond.user_id] || 'Desconocido'
        });

        return transformToMarketplaceBond(
          bond,
          profilesMap[bond.user_id] || 'Desconocido',
          undefined, // offering data
          undefined  // rating data
        );
      });

      console.log('✅ Bonos transformados:', marketplaceBonds.length);
      console.log('📋 Primer bono transformado:', marketplaceBonds[0]);

      setBonds(marketplaceBonds);

    } catch (error) {
      console.error('💥 Error completo en fetchMarketplaceBonds:', error);
      toast.error('Error al cargar los bonos del mercado');
    } finally {
      setLoading(false);
      console.log('🏁 Fetch completado');
    }
  };

  const filterAndSortBonds = () => {
    let filtered = bonds.filter(bond => {
      // Filtro por búsqueda
      const matchesSearch = bond.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bond.issuer_name.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por moneda
      const matchesCurrency = selectedCurrency === "all" || bond.currency === selectedCurrency;

      // Filtro por plazo
      const matchesTerm = selectedTerm === "all" ||
        (selectedTerm === "short" && bond.term <= 2) ||
        (selectedTerm === "medium" && bond.term > 2 && bond.term <= 5) ||
        (selectedTerm === "long" && bond.term > 5);

      // Filtro por rating
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

      // Verificar si ya existe una inversión en este bono
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
        // Actualizar inversión existente
        const { error: updateError } = await supabase
          .from('investments')
          .update({
            amount: existingInvestment.amount + amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInvestment.id);

        if (updateError) throw updateError;
      } else {
        // Crear nueva inversión
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

      // Actualizar la disponibilidad del bono (simplificado)
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

    useEffect(() => {
    console.log('🔄 Estado bonds actualizado:', {
      length: bonds.length,
      bonds: bonds
    });
  }, [bonds]);

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
                  <SelectItem value="long">Largo (&gt;5 años)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedRating} onValueChange={setSelectedRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los ratings</SelectItem>
                  <SelectItem value="AAA">AAA</SelectItem>
                  <SelectItem value="AA+">AA+</SelectItem>
                  <SelectItem value="AA">AA</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="BBB+">BBB+</SelectItem>
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
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBonds.map((bond) => (
              <Card key={bond.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{bond.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">por {bond.issuer_name}</p>
                    </div>
                    <Badge className={getRatingColor(bond.rating || 'BBB')}>
                      {bond.rating}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tasa de Interés</p>
                      <p className="text-xl font-bold text-bond-green">{bond.interest_rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Plazo</p>
                      <p className="text-lg font-semibold">{bond.term} años</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Disponible</p>
                      <p className="text-sm font-medium">{formatCurrency(bond.available_amount, bond.currency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mín. Inversión</p>
                      <p className="text-sm font-medium">{formatCurrency(bond.min_investment, bond.currency)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Pagos</p>
                    <p className="text-sm">{getFrequencyText(bond.frequency)} • {bond.amortization_type}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedBond(bond);
                        setDetailModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalles
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-bond-green text-black hover:bg-bond-green/80"
                      onClick={() => {
                        setSelectedBond(bond);
                        setInvestmentModalOpen(true);
                      }}
                      disabled={bond.available_amount <= 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Invertir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lista de Bonos</span>
                <Badge variant="secondary">{filteredBonds.length} bonos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-foreground">
                        <Button variant="ghost" size="sm" onClick={() => setSortBy(sortBy === 'name_asc' ? 'name_desc' : 'name_asc')}>
                          Nombre del Bono
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <Button variant="ghost" size="sm" onClick={() => setSortBy(sortBy === 'issuer_asc' ? 'issuer_desc' : 'issuer_asc')}>
                          Emisor
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <Button variant="ghost" size="sm" onClick={() => setSortBy(sortBy === 'interest_rate_desc' ? 'interest_rate_asc' : 'interest_rate_desc')}>
                          Tasa (%)
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <Button variant="ghost" size="sm" onClick={() => setSortBy(sortBy === 'term_asc' ? 'term_desc' : 'term_asc')}>
                          Plazo
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">Moneda</TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <Button variant="ghost" size="sm" onClick={() => setSortBy(sortBy === 'amount_desc' ? 'amount_asc' : 'amount_desc')}>
                          Disponible
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">Min. Inversión</TableHead>
                      <TableHead className="font-semibold text-foreground">Rating</TableHead>
                      <TableHead className="font-semibold text-foreground">Frecuencia</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBonds.map((bond) => (
                      <TableRow key={bond.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                        <TableCell className="font-medium py-4 max-w-[200px]">
                          <div>
                            <p className="font-semibold truncate">{bond.name}</p>
                            <p className="text-xs text-muted-foreground">{bond.amortization_type}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">{bond.issuer_name}</TableCell>
                        <TableCell className="py-4">
                          <span className="font-mono text-lg font-bold text-bond-green">
                            {bond.interest_rate}%
                          </span>
                        </TableCell>
                        <TableCell className="py-4">{bond.term} años</TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline">{bond.currency}</Badge>
                        </TableCell>
                        <TableCell className="py-4 font-mono">
                          {formatCurrency(bond.available_amount, bond.currency)}
                        </TableCell>
                        <TableCell className="py-4 font-mono text-sm">
                          {formatCurrency(bond.min_investment, bond.currency)}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={getRatingColor(bond.rating || 'BBB')}>
                            {bond.rating}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-sm">
                          {getFrequencyText(bond.frequency)}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBond(bond);
                                setDetailModalOpen(true);
                              }}
                              className="hover:bg-bond-blue/10 h-8 w-8 p-0"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4 text-bond-blue" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBond(bond);
                                setInvestmentModalOpen(true);
                              }}
                              className="hover:bg-bond-green/10 h-8 w-8 p-0"
                              title="Invertir"
                              disabled={bond.available_amount <= 0}
                            >
                              <ShoppingCart className="h-4 w-4 text-bond-green" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredBonds.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron bonos</h3>
              <p className="text-muted-foreground">
                Intenta ajustar los filtros de búsqueda para encontrar más opciones
              </p>
            </CardContent>
          </Card>
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

        {/* Detail Modal */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedBond?.name}
                <Badge className={getRatingColor(selectedBond?.rating || 'BBB')}>
                  {selectedBond?.rating}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            {selectedBond && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-bond-blue">Información Básica</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Emisor:</span>
                        <span className="text-sm font-medium">{selectedBond.issuer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Valor Nominal:</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(selectedBond.nominal_value, selectedBond.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tasa de Interés:</span>
                        <span className="text-sm font-medium">
                          {selectedBond.interest_rate}% {selectedBond.interest_rate_type === 'Effective' ? 'Efectiva' : 'Nominal'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Plazo:</span>
                        <span className="text-sm font-medium">{selectedBond.term} años</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Frecuencia:</span>
                        <span className="text-sm font-medium">{getFrequencyText(selectedBond.frequency)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-bond-green">Detalles de Inversión</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Disponible:</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(selectedBond.available_amount, selectedBond.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Mín. Inversión:</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(selectedBond.min_investment, selectedBond.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fecha Emisión:</span>
                        <span className="text-sm font-medium">
                          {new Date(selectedBond.emission_date).toLocaleDateString('es-PE')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tipo Amortización:</span>
                        <span className="text-sm font-medium">{selectedBond.amortization_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Período Gracia:</span>
                        <span className="text-sm font-medium">
                          {selectedBond.grace_type === 'None' ? 'Sin gracia' :
                            `${selectedBond.grace_type} (${selectedBond.grace_periods} períodos)`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">{selectedBond.description}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDetailModalOpen(false)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    className="flex-1 bg-bond-green text-black hover:bg-bond-green/80"
                    onClick={() => {
                      setDetailModalOpen(false);
                      setInvestmentModalOpen(true);
                    }}
                    disabled={selectedBond.available_amount <= 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Invertir Ahora
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default MarketplaceBonds;