
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

  // Load user settings
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
      
      // Check if settings already exist
      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      let response;
      
      if (data) {
        // Update existing settings
        response = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('user_id', user.id);
      } else {
        // Insert new settings
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
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Sistema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configuración de Moneda</h3>
            
            <div className="space-y-2">
              <Label htmlFor="default-currency">Moneda Predeterminada</Label>
              <Select 
                value={defaultCurrency} 
                onValueChange={(value) => setDefaultCurrency(value as CurrencyType)}
              >
                <SelectTrigger id="default-currency">
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
              <Label>Símbolos de Moneda</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 border rounded-md text-center">
                  <p className="font-medium">PEN</p>
                  <p className="text-lg">S/</p>
                </div>
                <div className="p-2 border rounded-md text-center">
                  <p className="font-medium">USD</p>
                  <p className="text-lg">$</p>
                </div>
                <div className="p-2 border rounded-md text-center">
                  <p className="font-medium">EUR</p>
                  <p className="text-lg">€</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configuración de Tasas</h3>
            
            <div className="space-y-2">
              <Label htmlFor="default-interest-type">Tipo de Tasa Predeterminada</Label>
              <Select 
                value={defaultInterestType} 
                onValueChange={setDefaultInterestType}
              >
                <SelectTrigger id="default-interest-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Effective">Efectiva</SelectItem>
                  <SelectItem value="Nominal">Nominal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="default-capitalization">Capitalización Predeterminada</Label>
              <Select 
                value={defaultCapitalization} 
                onValueChange={setDefaultCapitalization}
                disabled={defaultInterestType !== "Nominal"}
              >
                <SelectTrigger id="default-capitalization">
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
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Preferencias de Visualización</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Modo Oscuro</Label>
            <Switch id="dark-mode" checked disabled />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="decimals">Mostrar 4 decimales en porcentajes</Label>
            <Switch id="decimals" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-save">Guardar automáticamente</Label>
            <Switch id="auto-save" />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            className="bg-bond-green text-black hover:bg-bond-green/80" 
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsForm;
