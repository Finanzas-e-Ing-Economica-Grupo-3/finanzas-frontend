
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, BarChart3, Settings, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada correctamente");
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  const isLinkActive = (path: string) => {
    if (path === "/bonds" && location.pathname !== "/bonds") {
      return location.pathname.startsWith("/bonds/");
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen w-16 md:w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      <div className="p-4 flex items-center justify-center md:justify-start">
        <div className="w-8 h-8 bg-bond-green rounded-full"></div>
        <h1 className="text-xl font-bold text-sidebar-primary ml-2 hidden md:block">BondFlow</h1>
      </div>
      
      <div className="mt-8 space-y-2 px-2">
        <NavItem
          to="/bonds"
          icon={<Home size={20} />}
          label="Bonos"
          isActive={isLinkActive("/bonds")}
        />
        <NavItem
          to="/settings"
          icon={<Settings size={20} />}
          label="Configuración"
          isActive={isLinkActive("/settings")}
        />
        <NavItem
          to="/profile"
          icon={<User size={20} />}
          label="Perfil"
          isActive={isLinkActive("/profile")}
        />
      </div>

      <div className="mt-auto p-2">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-center md:justify-start text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
          onClick={handleSignOut}
        >
          <LogOut size={20} className="md:mr-2" />
          <span className="hidden md:inline">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => {
  return (
    <Link to={to}>
      <Button
        variant="ghost"
        className={cn(
          "w-full flex items-center justify-center md:justify-start text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent",
          isActive && "bg-sidebar-accent text-sidebar-primary font-medium"
        )}
      >
        <span className="md:mr-2">{icon}</span>
        <span className="hidden md:inline">{label}</span>
      </Button>
    </Link>
  );
};

export default AppSidebar;
