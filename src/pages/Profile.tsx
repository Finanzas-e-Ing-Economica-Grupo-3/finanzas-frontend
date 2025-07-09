
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  name: string;
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setProfile(data);
        setName(data.name || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Error al cargar el perfil");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>
        
        {/* Profile Cards */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Personal Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-bond-blue/10 flex items-center justify-center">
                  <span className="text-bond-blue font-bold text-lg">👤</span>
                </div>
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <Label htmlFor="name" className="text-sm font-medium">Nombre Completo</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                  placeholder="Ingresa tu nombre completo"
                />
              </div>
              
              <div className="space-y-4">
                <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  value={user?.email || ""} 
                  disabled 
                  className="h-12 bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El email no se puede cambiar por motivos de seguridad
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-6">
              <Button 
                onClick={handleSave} 
                className="bg-bond-green text-black hover:bg-bond-green/80 h-12 px-8 text-base font-medium"
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardFooter>
          </Card>

          {/* Account Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-bond-green/10 flex items-center justify-center">
                  <span className="text-bond-green font-bold text-lg">ℹ️</span>
                </div>
                Información de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {profile && (
                <>
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Miembro desde</Label>
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <p className="font-medium text-base">
                        {new Date(profile.created_at).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Estado de la Cuenta</Label>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-500 font-medium">Cuenta Activa</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Security Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                <span className="text-red-600 font-bold text-lg">🔒</span>
              </div>
              Seguridad y Privacidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-6 border rounded-lg hover:shadow-sm transition-shadow">
                <h4 className="font-semibold mb-3 text-base">Autenticación</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Tu cuenta está protegida con autenticación por email verificado
                </p>
                <Button variant="outline" size="sm" disabled className="h-10">
                  Configurar 2FA (Próximamente)
                </Button>
              </div>

              <div className="p-6 border rounded-lg hover:shadow-sm transition-shadow">
                <h4 className="font-semibold mb-3 text-base">Privacidad de Datos</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Tus datos están encriptados y almacenados de forma segura
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
