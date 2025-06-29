import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AmortizationType, Bond, CurrencyType, GraceType, InterestRateType } from "@/types/bond";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BondFormProps {
  initialData?: Partial<Bond>;
  isEditing?: boolean;
}

const BondForm: React.FC<BondFormProps> = ({ initialData, isEditing = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [nominalValue, setNominalValue] = useState(initialData?.nominalValue?.toString() || "");
  const [interestRate, setInterestRate] = useState(initialData?.interestRate?.toString() || "");
  const [term, setTerm] = useState(initialData?.term?.toString() || "");
  const [frequency, setFrequency] = useState(initialData?.frequency?.toString() || "2"); // Default semiannual
  const [amortizationType, setAmortizationType] = useState<AmortizationType>(initialData?.amortizationType || "French");
  const [graceType, setGraceType] = useState<GraceType>(initialData?.graceType || "None");
  const [gracePeriods, setGracePeriods] = useState(initialData?.gracePeriods?.toString() || "0");
  const [emissionDate, setEmissionDate] = useState(initialData?.emissionDate || new Date().toISOString().split('T')[0]);
  
  // Bond settings
  const [currency, setCurrency] = useState<CurrencyType>(initialData?.settings?.currency || "USD");
  const [interestRateType, setInterestRateType] = useState<InterestRateType>(initialData?.settings?.interestRateType || "Effective");
  const [capitalization, setCapitalization] = useState(initialData?.settings?.capitalization || "");

  // Load user's default settings
  useEffect(() => {
    const loadDefaultSettings = async () => {
      if (!user || isEditing) return;
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('default_currency, default_interest_rate_type, default_capitalization')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error("Error loading user settings:", error);
          return;
        }
        
        if (data) {
          setCurrency(data.default_currency as CurrencyType);
          setInterestRateType(data.default_interest_rate_type as InterestRateType);
          if (data.default_capitalization) {
            setCapitalization(data.default_capitalization);
          }
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
      }
    };
    
    loadDefaultSettings();
  }, [user, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate form inputs
      if (!name || !nominalValue || !interestRate || !term || !frequency || !user) {
        throw new Error("Por favor completa todos los campos obligatorios");
      }
      
      // Additional validation for capitalization if nominal rate type
      if (interestRateType === "Nominal" && !capitalization) {
        throw new Error("Debe especificar la capitalización para tasas nominales");
      }
      
      // Create bond object for Supabase
      const bondData = {
        user_id: user.id,
        name,
        nominal_value: parseFloat(nominalValue),
        interest_rate: parseFloat(interestRate),
        term: parseInt(term),
        frequency: parseInt(frequency),
        amortization_type: amortizationType,
        grace_type: graceType,
        grace_periods: parseInt(gracePeriods),
        emission_date: emissionDate,
        currency,
        interest_rate_type: interestRateType,
        capitalization: interestRateType === "Nominal" ? capitalization : null
      };
      
      let response;
      
      if (isEditing && initialData?.id) {
        // Update existing bond
        response = await supabase
          .from('bonds')
          .update(bondData)
          .eq('id', initialData.id)
          .select();
      } else {
        // Create new bond
        response = await supabase
          .from('bonds')
          .insert(bondData)
          .select();
      }
      
      if (response.error) throw response.error;
      
      toast.success(isEditing ? "Bono actualizado con éxito" : "Bono creado con éxito");
      navigate("/bonds");
      
    } catch (error) {
      console.error("Error saving bond:", error);
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? "Editar Bono" : "Crear Nuevo Bono"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? "Modifica los parámetros de tu bono" : "Configura los parámetros financieros de tu nuevo bono"}
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Basic Bond Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-bond-blue/10 flex items-center justify-center">
                    <span className="text-bond-blue font-bold text-lg">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold">Información Básica</h3>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="name" className="text-sm font-medium">Nombre del Bono</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="h-12"
                    placeholder="Ej: Bono Gobierno 2025"
                    required 
                  />
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="nominal-value" className="text-sm font-medium">Valor Nominal</Label>
                  <Input 
                    id="nominal-value" 
                    type="number" 
                    value={nominalValue} 
                    onChange={(e) => setNominalValue(e.target.value)} 
                    className="h-12"
                    placeholder="1000"
                    min="0"
                    step="0.01"
                    required 
                  />
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="interest-rate" className="text-sm font-medium">Tasa de Interés (%)</Label>
                  <Input 
                    id="interest-rate" 
                    type="number" 
                    value={interestRate} 
                    onChange={(e) => setInterestRate(e.target.value)} 
                    className="h-12"
                    placeholder="5.5"
                    min="0"
                    step="0.01"
                    required 
                  />
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="term" className="text-sm font-medium">Plazo (años)</Label>
                  <Input 
                    id="term" 
                    type="number" 
                    value={term} 
                    onChange={(e) => setTerm(e.target.value)} 
                    className="h-12"
                    placeholder="5"
                    min="1"
                    step="1"
                    required 
                  />
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="frequency" className="text-sm font-medium">Frecuencia de Pago</Label>
                  <Select 
                    value={frequency} 
                    onValueChange={setFrequency}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Anual (1 vez por año)</SelectItem>
                      <SelectItem value="2">Semestral (2 veces por año)</SelectItem>
                      <SelectItem value="4">Trimestral (4 veces por año)</SelectItem>
                      <SelectItem value="12">Mensual (12 veces por año)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="emission-date" className="text-sm font-medium">Fecha de Emisión</Label>
                  <Input 
                    id="emission-date" 
                    type="date" 
                    value={emissionDate} 
                    onChange={(e) => setEmissionDate(e.target.value)} 
                    className="h-12"
                    required 
                  />
                </div>
              </div>
              
              {/* Amortization and Grace Settings */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-bond-green/10 flex items-center justify-center">
                    <span className="text-bond-green font-bold text-lg">⚙️</span>
                  </div>
                  <h3 className="text-xl font-semibold">Configuración de Amortización</h3>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="amortization-type" className="text-sm font-medium">Tipo de Amortización</Label>
                  <Select 
                    value={amortizationType} 
                    onValueChange={(value) => setAmortizationType(value as AmortizationType)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="American">Americano (Al vencimiento)</SelectItem>
                      <SelectItem value="German">Alemán (Cuota decreciente)</SelectItem>
                      <SelectItem value="French">Francés (Cuota constante)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="grace-type" className="text-sm font-medium">Tipo de Periodo de Gracia</Label>
                  <Select 
                    value={graceType} 
                    onValueChange={(value) => setGraceType(value as GraceType)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">Sin periodo de gracia</SelectItem>
                      <SelectItem value="Partial">Parcial (Solo intereses)</SelectItem>
                      <SelectItem value="Total">Total (Sin pagos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {graceType !== "None" && (
                  <div className="space-y-4">
                    <Label htmlFor="grace-periods" className="text-sm font-medium">Número de Periodos de Gracia</Label>
                    <Input 
                      id="grace-periods" 
                      type="number" 
                      value={gracePeriods} 
                      onChange={(e) => setGracePeriods(e.target.value)} 
                      className="h-12"
                      placeholder="2"
                      min="0"
                      step="1"
                      required 
                    />
                  </div>
                )}
                
                <div className="pt-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <span className="text-yellow-600 font-bold text-lg">💰</span>
                    </div>
                    <h3 className="text-xl font-semibold">Configuración de Moneda y Tasa</h3>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="currency" className="text-sm font-medium">Moneda</Label>
                  <Select 
                    value={currency} 
                    onValueChange={(value) => setCurrency(value as CurrencyType)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">🇵🇪 Soles (PEN)</SelectItem>
                      <SelectItem value="USD">🇺🇸 Dólares (USD)</SelectItem>
                      <SelectItem value="EUR">🇪🇺 Euros (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="interest-rate-type" className="text-sm font-medium">Tipo de Tasa de Interés</Label>
                  <Select 
                    value={interestRateType} 
                    onValueChange={(value) => setInterestRateType(value as InterestRateType)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Effective">Efectiva (TEA)</SelectItem>
                      <SelectItem value="Nominal">Nominal (TNA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {interestRateType === "Nominal" && (
                  <div className="space-y-4">
                    <Label htmlFor="capitalization" className="text-sm font-medium">Capitalización</Label>
                    <Select 
                      value={capitalization} 
                      onValueChange={setCapitalization}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Seleccionar capitalización" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Annual">Anual</SelectItem>
                        <SelectItem value="Semiannual">Semestral</SelectItem>
                        <SelectItem value="Quarterly">Trimestral</SelectItem>
                        <SelectItem value="Monthly">Mensual</SelectItem>
                        <SelectItem value="Daily">Diaria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/bonds")}
                className="h-12 px-8"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-bond-green text-black hover:bg-bond-green/80 h-12 px-8 text-base font-medium" 
                disabled={isLoading}
              >
                {isLoading ? "Guardando..." : isEditing ? "Actualizar Bono" : "Crear Bono"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BondForm;
