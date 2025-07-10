
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
  role?: string;
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
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
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
                    <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Estado de la Cuenta</Label>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-500 font-medium">Cuenta Activa</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Rol de la cuenta</Label>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-red-200">
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-red-500 font-medium">
                        {
                          localStorage.getItem('currentUserRole') === 'investor' ? 'Inversionista' : 'Emisor'
                        }
                      </span>
                      </div>
                    </div>
                    </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
