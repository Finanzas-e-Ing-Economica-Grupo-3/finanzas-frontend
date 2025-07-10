
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CurrencyType } from "@/types/bond";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SettingsForm: React.FC = () => {
  const { user } = useAuth();
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyType>("USD");
  const [defaultInterestType, setDefaultInterestType] = useState("Effective");
  const [defaultCapitalization, setDefaultCapitalization] = useState("Semiannual");
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return;
      
      try {
        setIsSettingsLoading(true);
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        if (data) {
          setDefaultCurrency(data.default_currency as CurrencyType);
          setDefaultInterestType(data.default_interest_rate_type);
          if (data.default_capitalization) {
            setDefaultCapitalization(data.default_capitalization);
          }
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
        toast.error("Error al cargar la configuración");
      } finally {
        setIsSettingsLoading(false);
      }
    };
    
    loadUserSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const settingsData = {
        user_id: user.id,
        default_currency: defaultCurrency,
        default_interest_rate_type: defaultInterestType,
        default_capitalization: defaultInterestType === "Nominal" ? defaultCapitalization : null
      };
      
      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      let response;
      
      if (data) {
        response = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('user_id', user.id);
      } else {
        response = await supabase
          .from('user_settings')
          .insert(settingsData);
      }
      
      if (response.error) throw response.error;
      
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSettingsLoading) {
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
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Personaliza las configuraciones predeterminadas para tus bonos
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-bond-green/10 flex items-center justify-center">
                <span className="text-bond-green font-bold text-lg">$</span>
              </div>
              Configuración de Moneda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Label htmlFor="default-currency" className="text-sm font-medium">
                Moneda Predeterminada
              </Label>
              <Select 
                value={defaultCurrency} 
                onValueChange={(value) => setDefaultCurrency(value as CurrencyType)}
              >
                <SelectTrigger id="default-currency" className="h-12">
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">Soles (PEN)</SelectItem>
                  <SelectItem value="USD">Dólares (USD)</SelectItem>
                  <SelectItem value="EUR">Euros (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <Label className="text-sm font-medium">Símbolos de Moneda</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-4 border-2 rounded-lg text-center hover:bg-muted/50 transition-all cursor-pointer ${defaultCurrency === 'PEN' ? 'border-bond-green bg-bond-green/5' : 'border-border'}`}>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">PEN</p>
                  <p className="text-2xl font-bold">S/</p>
                </div>
                <div className={`p-4 border-2 rounded-lg text-center hover:bg-muted/50 transition-all cursor-pointer ${defaultCurrency === 'USD' ? 'border-bond-green bg-bond-green/5' : 'border-border'}`}>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">USD</p>
                  <p className="text-2xl font-bold">$</p>
                </div>
                <div className={`p-4 border-2 rounded-lg text-center hover:bg-muted/50 transition-all cursor-pointer ${defaultCurrency === 'EUR' ? 'border-bond-green bg-bond-green/5' : 'border-border'}`}>
                  <p className="font-semibold text-xs text-muted-foreground mb-1">EUR</p>
                  <p className="text-2xl font-bold">€</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-bond-blue/10 flex items-center justify-center">
                <span className="text-bond-blue font-bold text-lg">%</span>
              </div>
              Configuración de Tasas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Label htmlFor="default-interest-type" className="text-sm font-medium">
                Tipo de Tasa Predeterminada
              </Label>
              <Select 
                value={defaultInterestType} 
                onValueChange={setDefaultInterestType}
              >
                <SelectTrigger id="default-interest-type" className="h-12">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Effective">Efectiva</SelectItem>
                  <SelectItem value="Nominal">Nominal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="default-capitalization" className="text-sm font-medium flex items-center gap-2">
                Capitalización Predeterminada
                {defaultInterestType !== "Nominal" && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                    Solo para tasas nominales
                  </span>
                )}
              </Label>
              <Select 
                value={defaultCapitalization} 
                onValueChange={setDefaultCapitalization}
                disabled={defaultInterestType !== "Nominal"}
              >
                <SelectTrigger id="default-capitalization" className="h-12">
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
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              className="bg-bond-green text-black hover:bg-bond-green/80 px-8 h-12 text-base font-medium" 
              disabled={isLoading}
            >
              {isLoading ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsForm;
