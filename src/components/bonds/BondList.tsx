
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileText, Plus, Download, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Bond, CashFlow, BondAnalysis } from "@/types/bond";
import { calculateCashFlow, analyzeBond } from "@/utils/bondCalculations";
import { generateBondReportPDF } from "@/utils/pdfGenerator";

interface BondListItem {
  id: string;
  name: string;
  nominal_value: number;
  interest_rate: number;
  term: number;
  amortization_type: string;
  currency: string;
  emission_date: string;
}

const BondList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bonds, setBonds] = useState<BondListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBonds = async () => {
      try {
        setLoading(true);
        if (!user) return;

        const { data, error } = await supabase
          .from('bonds')
          .select('id, name, nominal_value, interest_rate, term, amortization_type, currency, emission_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setBonds(data || []);
      } catch (error) {
        console.error('Error fetching bonds:', error);
        toast.error('Error al cargar los bonos');
      } finally {
        setLoading(false);
      }
    };

    fetchBonds();
  }, [user]);

  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case "USD":
        return "$";
      case "PEN":
        return "S/";
      case "EUR":
        return "€";
      default:
        return "";
    }
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return `${getCurrencySymbol(currency)} ${amount.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const generatePDFFromList = async (bondItem: BondListItem) => {
    try {
      // Fetch complete bond data
      const { data: bondData, error: bondError } = await supabase
        .from('bonds')
        .select('*')
        .eq('id', bondItem.id)
        .eq('user_id', user!.id)
        .single();

      if (bondError) throw bondError;

      // Transform to Bond interface
      const bond: Bond = {
        id: bondData.id,
        name: bondData.name,
        nominalValue: bondData.nominal_value,
        interestRate: bondData.interest_rate,
        term: bondData.term,
        frequency: bondData.frequency,
        amortizationType: bondData.amortization_type as Bond['amortizationType'],
        graceType: bondData.grace_type as Bond['graceType'],
        gracePeriods: bondData.grace_periods,
        emissionDate: bondData.emission_date,
        settings: {
          currency: bondData.currency as Bond['settings']['currency'],
          interestRateType: bondData.interest_rate_type as Bond['settings']['interestRateType'],
          capitalization: bondData.capitalization || undefined
        },
        createdAt: bondData.created_at,
        updatedAt: bondData.updated_at,
        userId: bondData.user_id
      };

      const cashFlow = calculateCashFlow(bond);
      const analysis = analyzeBond(bond, cashFlow, 5.0);

      generateBondReportPDF(bond, cashFlow, analysis);
      
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const deleteBond = async (bondId: string, bondName: string) => {
    try {
      setDeletingId(bondId);
      
      const { error: cashFlowError } = await supabase
        .from('cash_flows')
        .delete()
        .eq('bond_id', bondId);

      if (cashFlowError && cashFlowError.code !== 'PGRST116') {
        throw cashFlowError;
      }

      const { error: analysisError } = await supabase
        .from('bond_analysis')
        .delete()
        .eq('bond_id', bondId);

      if (analysisError && analysisError.code !== 'PGRST116') {
        throw analysisError;
      }

      const { error: bondError } = await supabase
        .from('bonds')
        .delete()
        .eq('id', bondId)
        .eq('user_id', user!.id);

      if (bondError) throw bondError;

      setBonds(prevBonds => prevBonds.filter(bond => bond.id !== bondId));
      
      toast.success(`Bono "${bondName}" eliminado exitosamente`);
    } catch (error) {
      console.error('Error deleting bond:', error);
      toast.error('Error al eliminar el bono');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-bond-green"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Bonos</h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza todos tus bonos registrados
          </p>
        </div>
        {bonds.length > 0 && (
          <Button
            className="bg-bond-green text-black hover:bg-bond-green/80 h-11 px-6"
            onClick={() => navigate("/bonds/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Bono
          </Button>
        )}
      </div>

      {bonds.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total de Bonos</p>
                  <p className="text-3xl font-bold">{bonds.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-bond-blue/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-bond-blue" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(
                      bonds.reduce((sum, bond) => sum + bond.nominal_value, 0),
                      bonds[0]?.currency || "USD"
                    )}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-bond-green/10 flex items-center justify-center">
                  <span className="text-bond-green font-bold text-xl">$</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Tasa Promedio</p>
                  <p className="text-3xl font-bold">
                    {(bonds.reduce((sum, bond) => sum + bond.interest_rate, 0) / bonds.length).toFixed(2)}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-xl">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Lista de Bonos</CardTitle>
            {bonds.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {bonds.length} {bonds.length === 1 ? 'bono' : 'bonos'} registrado{bonds.length === 1 ? '' : 's'}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {bonds.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground">Nombre</TableHead>
                    <TableHead className="font-semibold text-foreground">Valor Nominal</TableHead>
                    <TableHead className="font-semibold text-foreground">Tasa (%)</TableHead>
                    <TableHead className="font-semibold text-foreground">Plazo</TableHead>
                    <TableHead className="font-semibold text-foreground">Amortización</TableHead>
                    <TableHead className="font-semibold text-foreground">Emisión</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonds.map((bond) => (
                    <TableRow key={bond.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                      <TableCell className="font-medium py-4">{bond.name}</TableCell>
                      <TableCell className="font-mono py-4">
                        {formatCurrency(bond.nominal_value, bond.currency)}
                      </TableCell>
                      <TableCell className="font-mono py-4">{bond.interest_rate}%</TableCell>
                      <TableCell className="py-4">{bond.term} años</TableCell>
                      <TableCell className="py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted border">
                          Americano
                        </span>
                      </TableCell>
                      <TableCell className="py-4">{new Date(bond.emission_date).toLocaleDateString('es-PE')}</TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/bonds/${bond.id}`)}
                            className="hover:bg-bond-blue/10 h-8 w-8 p-0"
                            title="Ver detalles"
                          >
                            <FileText className="h-4 w-4 text-bond-blue" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/bonds/${bond.id}/edit`)}
                            className="hover:bg-blue-600/10 h-8 w-8 p-0"
                            title="Editar bono"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              generatePDFFromList(bond);
                            }}
                            className="hover:bg-green-600/10 h-8 w-8 p-0"
                            title="Descargar PDF"
                          >
                            <Download className="h-4 w-4 text-green-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-red-600/10 h-8 w-8 p-0"
                                title="Eliminar bono"
                                disabled={deletingId === bond.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el bono
                                  <span className="font-semibold"> "{bond.name}"</span> y todos sus datos asociados
                                  (flujos de caja, análisis, etc.).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBond(bond.id, bond.name)}
                                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                >
                                  {deletingId === bond.id ? (
                                    <div className="flex items-center">
                                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                      Eliminando...
                                    </div>
                                  ) : (
                                    "Eliminar"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No hay bonos registrados aún</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Comienza creando tu primer bono para gestionar tus inversiones y realizar cálculos financieros
              </p>
              <Button
                className="bg-bond-green text-black hover:bg-bond-green/80 h-11 px-6"
                onClick={() => navigate("/bonds/new")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear primer bono
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BondList;
