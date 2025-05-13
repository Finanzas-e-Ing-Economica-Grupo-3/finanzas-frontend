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
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Bono" : "Crear Nuevo Bono"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Bond Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Básica</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Bono</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nominal-value">Valor Nominal</Label>
                <Input 
                  id="nominal-value" 
                  type="number" 
                  value={nominalValue} 
                  onChange={(e) => setNominalValue(e.target.value)} 
                  min="0"
                  step="0.01"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interest-rate">Tasa de Interés (%)</Label>
                <Input 
                  id="interest-rate" 
                  type="number" 
                  value={interestRate} 
                  onChange={(e) => setInterestRate(e.target.value)} 
                  min="0"
                  step="0.01"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="term">Plazo (años)</Label>
                <Input 
                  id="term" 
                  type="number" 
                  value={term} 
                  onChange={(e) => setTerm(e.target.value)} 
                  min="1"
                  step="1"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Frecuencia de Pago</Label>
                <Select 
                  value={frequency} 
                  onValueChange={setFrequency}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Anual</SelectItem>
                    <SelectItem value="2">Semestral</SelectItem>
                    <SelectItem value="4">Trimestral</SelectItem>
                    <SelectItem value="12">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emission-date">Fecha de Emisión</Label>
                <Input 
                  id="emission-date" 
                  type="date" 
                  value={emissionDate} 
                  onChange={(e) => setEmissionDate(e.target.value)} 
                  required 
                />
              </div>
            </div>
            
            {/* Amortization and Grace Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuración de Amortización</h3>
              
              <div className="space-y-2">
                <Label htmlFor="amortization-type">Tipo de Amortización</Label>
                <Select 
                  value={amortizationType} 
                  onValueChange={(value) => setAmortizationType(value as AmortizationType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="American">Americano</SelectItem>
                    <SelectItem value="German">Alemán</SelectItem>
                    <SelectItem value="French">Francés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grace-type">Tipo de Periodo de Gracia</Label>
                <Select 
                  value={graceType} 
                  onValueChange={(value) => setGraceType(value as GraceType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">Sin periodo de gracia</SelectItem>
                    <SelectItem value="Partial">Parcial</SelectItem>
                    <SelectItem value="Total">Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {graceType !== "None" && (
                <div className="space-y-2">
                  <Label htmlFor="grace-periods">Número de Periodos de Gracia</Label>
                  <Input 
                    id="grace-periods" 
                    type="number" 
                    value={gracePeriods} 
                    onChange={(e) => setGracePeriods(e.target.value)} 
                    min="0"
                    step="1"
                    required 
                  />
                </div>
              )}
              
              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium">Configuración de Moneda y Tasa</h3>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select 
                  value={currency} 
                  onValueChange={(value) => setCurrency(value as CurrencyType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEN">Soles (PEN)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                    <SelectItem value="EUR">Euros (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interest-rate-type">Tipo de Tasa de Interés</Label>
                <Select 
                  value={interestRateType} 
                  onValueChange={(value) => setInterestRateType(value as InterestRateType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Effective">Efectiva</SelectItem>
                    <SelectItem value="Nominal">Nominal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {interestRateType === "Nominal" && (
                <div className="space-y-2">
                  <Label htmlFor="capitalization">Capitalización</Label>
                  <Select 
                    value={capitalization} 
                    onValueChange={setCapitalization}
                  >
                    <SelectTrigger>
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
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/bonds")}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-bond-green text-black hover:bg-bond-green/80" disabled={isLoading}>
              {isLoading ? "Guardando..." : isEditing ? "Actualizar Bono" : "Crear Bono"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BondForm;
