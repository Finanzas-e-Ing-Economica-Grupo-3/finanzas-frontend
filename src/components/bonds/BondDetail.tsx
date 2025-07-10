
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Bond, CashFlow, BondAnalysis } from "@/types/bond";
import { calculateCashFlow, analyzeBond } from "@/utils/bondCalculations";
import { generateBondReportPDF } from "@/utils/pdfGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const BondDetailComponent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bond, setBond] = useState<Bond | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [bondAnalysis, setBondAnalysis] = useState<BondAnalysis | null>(null);
  const [marketRate, setMarketRate] = useState<string>("5.0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;

    const fetchBond = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('bonds')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          toast.error("Bono no encontrado");
          navigate("/bonds");
          return;
        }
        
        // Transform from database format to app format
        const bondData: Bond = {
          id: data.id,
          name: data.name,
          nominalValue: data.nominal_value,
          interestRate: data.interest_rate,
          term: data.term,
          frequency: data.frequency,
          amortizationType: data.amortization_type as "American",
          graceType: data.grace_type as "None" | "Partial" | "Total",
          gracePeriods: data.grace_periods,
          emissionDate: data.emission_date,
          settings: {
            currency: data.currency as "USD" | "PEN" | "EUR",
            interestRateType: data.interest_rate_type as "Effective" | "Nominal",
            capitalization: data.capitalization || undefined
          },
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          userId: data.user_id
        };
        
        setBond(bondData);
        
        // Calculate cash flow and analysis
        const flows = calculateCashFlow(bondData);
        setCashFlow(flows);
        
        const analysis = analyzeBond(bondData, flows, parseFloat(marketRate));
        setBondAnalysis(analysis);
        
        // Save cash flows and analysis to database
        try {
          // First check if cash flows already exist
          const { count, error: countError } = await supabase
            .from('cash_flows')
            .select('*', { count: 'exact', head: true })
            .eq('bond_id', id);
            
          if (countError) throw countError;
          
          // If no cash flows exist, insert them
          if (count === 0) {
            // Format cash flows for database
            const cashFlowsData = flows.map(flow => ({
              bond_id: id,
              period: flow.period,
              date: flow.date,
              initial_balance: flow.initialBalance,
              interest: flow.interest,
              amortization: flow.amortization,
              payment: flow.payment,
              final_balance: flow.finalBalance
            }));
            
            const { error: insertError } = await supabase
              .from('cash_flows')
              .insert(cashFlowsData);
              
            if (insertError) throw insertError;
          }
          
          // Check if analysis already exists
          const { data: existingAnalysis, error: analysisError } = await supabase
            .from('bond_analysis')
            .select('id')
            .eq('bond_id', id)
            .maybeSingle();
            
          if (analysisError) throw analysisError;
          
          // Format analysis for database
          const analysisData = {
            bond_id: id,
            convexity: analysis.convexity,
            duration: analysis.duration,
            modified_duration: analysis.modifiedDuration,
            effective_cost_rate: analysis.effectiveCostRate,
            effective_yield_rate: analysis.effectiveYieldRate,
            market_price: analysis.marketPrice
          };
          
          if (existingAnalysis) {
            // Update existing analysis
            const { error: updateError } = await supabase
              .from('bond_analysis')
              .update(analysisData)
              .eq('id', existingAnalysis.id);
              
            if (updateError) throw updateError;
          } else {
            // Insert new analysis
            const { error: insertError } = await supabase
              .from('bond_analysis')
              .insert(analysisData);
              
            if (insertError) throw insertError;
          }
        } catch (saveError) {
          // Log error but don't stop the UI from showing
          console.error("Error saving cash flows or analysis:", saveError);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading bond:", error);
        toast.error("Error al cargar los datos del bono");
        navigate("/bonds");
      }
    };

    fetchBond();
  }, [id, navigate, marketRate, user]);

  const handleMarketRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMarketRate(e.target.value);
    
    if (bond && cashFlow.length > 0) {
      const analysis = analyzeBond(bond, cashFlow, parseFloat(e.target.value));
      setBondAnalysis(analysis);
    }
  };

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

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return "";
    
    const currency = bond?.settings.currency || "USD";
    return `${getCurrencySymbol(currency)} ${amount.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined) return "";
    return `${value.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  };

  if (loading || !bond || !bondAnalysis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-bond-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{bond.name}</h1>
        <div className="space-x-2">
          <Button 
            variant="secondary"
            onClick={() => generateBondReportPDF(bond, cashFlow, bondAnalysis)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            📄 Descargar PDF
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(`/bonds/${id}/edit`)}
          >
            Editar
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate("/bonds")}
          >
            Volver
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos del Bono</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Nominal</p>
                <p className="font-medium">{formatCurrency(bond.nominalValue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Interés</p>
                <p className="font-medium">{bond.interestRate}% {bond.settings.interestRateType === "Nominal" ? "Nominal" : "Efectiva"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plazo</p>
                <p className="font-medium">{bond.term} años</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frecuencia de Pago</p>
                <p className="font-medium">
                  {bond.frequency === 1
                    ? "Anual"
                    : bond.frequency === 2
                    ? "Semestral"
                    : bond.frequency === 4
                    ? "Trimestral"
                    : "Mensual"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Amortización</p>
                <p className="font-medium">
                  {bond.amortizationType === "American"
                    ? "Americana"
                    : "No definido"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Periodo de Gracia</p>
                <p className="font-medium">
                  {bond.graceType === "None"
                    ? "Ninguno"
                    : `${bond.graceType === "Partial" ? "Parcial" : "Total"} (${bond.gracePeriods} periodos)`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Emisión</p>
                <p className="font-medium">{new Date(bond.emissionDate).toLocaleDateString('es-PE')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Moneda</p>
                <p className="font-medium">
                  {bond.settings.currency === "USD"
                    ? "Dólares (USD)"
                    : bond.settings.currency === "PEN"
                    ? "Soles (PEN)"
                    : "Euros (EUR)"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análisis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="market-rate">Tasa de Mercado (%)</Label>
              <Input
                id="market-rate"
                type="number"
                value={marketRate}
                onChange={handleMarketRateChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-muted-foreground">Duración</p>
                <p className="font-medium">
                {bondAnalysis.duration !== undefined && !isNaN(bondAnalysis.duration)
                ? `${bondAnalysis.duration.toFixed(2)} años`
                : "No disponible"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duración Modificada</p>
                <p className="font-medium">
                {bondAnalysis.modifiedDuration !== undefined && !isNaN(bondAnalysis.modifiedDuration)
                  ? `${bondAnalysis.modifiedDuration.toFixed(2)} años`
                  : "No disponible"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Convexidad</p>
                <p className="font-medium">
                  {bondAnalysis.convexity !== undefined && !isNaN(bondAnalysis.convexity)
                    ? bondAnalysis.convexity.toFixed(2)
                    : "No disponible"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TCEA (Emisor)</p>
                <p className="font-medium text-bond-red">{formatPercentage(bondAnalysis.effectiveCostRate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TREA (Inversor)</p>
                <p className="font-medium text-bond-blue">{formatPercentage(bondAnalysis.effectiveYieldRate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precio de Mercado</p>
                <p className="font-medium text-bond-green">{formatCurrency(bondAnalysis.marketPrice)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flujo de Caja</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="flow">
            <TabsList className="mb-4">
              <TabsTrigger value="flow">Flujo Completo</TabsTrigger>
              <TabsTrigger value="summary">Resumen</TabsTrigger>
            </TabsList>
            
            <TabsContent value="flow" className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Saldo Inicial</TableHead>
                    <TableHead>Interés</TableHead>
                    <TableHead>Amortización</TableHead>
                    <TableHead>Cuota</TableHead>
                    <TableHead>Saldo Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashFlow.map((flow) => (
                    <TableRow key={flow.period}>
                      <TableCell>{flow.period}</TableCell>
                      <TableCell>{new Date(flow.date).toLocaleDateString('es-PE')}</TableCell>
                      <TableCell>{formatCurrency(flow.initialBalance)}</TableCell>
                      <TableCell>{formatCurrency(flow.interest)}</TableCell>
                      <TableCell>{formatCurrency(flow.amortization)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(flow.payment)}</TableCell>
                      <TableCell>{formatCurrency(flow.finalBalance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="summary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Resumen del Flujo</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Total Pagos:</p>
                      <p className="font-medium">{formatCurrency(cashFlow.reduce((sum, flow) => sum + flow.payment, 0))}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Total Intereses:</p>
                      <p className="font-medium text-bond-red">{formatCurrency(cashFlow.reduce((sum, flow) => sum + flow.interest, 0))}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Periodos Totales:</p>
                      <p className="font-medium">{cashFlow.length}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Periodos de Gracia:</p>
                      <p className="font-medium">{bond.gracePeriods}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Análisis de Rentabilidad</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">TCEA:</p>
                      <p className="font-medium text-bond-red">{formatPercentage(bondAnalysis.effectiveCostRate)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">TREA:</p>
                      <p className="font-medium text-bond-blue">{formatPercentage(bondAnalysis.effectiveYieldRate)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Precio de Mercado:</p>
                      <p className="font-medium text-bond-green">{formatCurrency(bondAnalysis.marketPrice)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BondDetailComponent;
