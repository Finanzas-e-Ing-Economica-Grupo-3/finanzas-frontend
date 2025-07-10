import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  BarChart3, 
  Settings, 
  User, 
  LogOut, 
  TrendingUp, 
  ShoppingCart, 
  Wallet,
  FileText,
  Plus,
  Bell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Componente del logo BondFlow (versión más grande)
const BondFlowLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg viewBox="0 0 280 80" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor:"#1e40af", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#3b82f6", stopOpacity:1}} />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor:"#059669", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#10b981", stopOpacity:1}} />
        </linearGradient>
      </defs>
      
      {/* Símbolo principal: Gráfico de barras más grande */}
      <g transform="translate(5, 10)">
        <rect x="0" y="50" width="70" height="3" fill="url(#primaryGradient)" opacity="0.3"/>
        
        <rect x="5" y="30" width="10" height="20" fill="url(#primaryGradient)" rx="2">
          <animate attributeName="height" values="20;25;20" dur="3s" repeatCount="indefinite"/>
        </rect>
        <rect x="20" y="25" width="10" height="25" fill="url(#primaryGradient)" rx="2">
          <animate attributeName="height" values="25;30;25" dur="3s" repeatCount="indefinite" begin="0.5s"/>
        </rect>
        <rect x="35" y="20" width="10" height="30" fill="url(#accentGradient)" rx="2">
          <animate attributeName="height" values="30;35;30" dur="3s" repeatCount="indefinite" begin="1s"/>
        </rect>
        <rect x="50" y="15" width="10" height="35" fill="url(#accentGradient)" rx="2">
          <animate attributeName="height" values="35;40;35" dur="3s" repeatCount="indefinite" begin="1.5s"/>
        </rect>
        
        <path d="M65 20 L70 15 L75 20 M70 15 L70 35" stroke="url(#accentGradient)" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M10 45 Q25 40 40 35 Q55 30 70 20" stroke="url(#primaryGradient)" strokeWidth="2" fill="none" opacity="0.7" strokeDasharray="4,3"/>
      </g>
      
      {/* Texto BondFlow más grande */}
      <g transform="translate(85, 8)">
        <text x="0" y="28" fontFamily="'Arial', sans-serif" fontSize="28" fontWeight="bold" fill="url(#primaryGradient)">Bond</text>
        <text x="0" y="55" fontFamily="'Arial', sans-serif" fontSize="28" fontWeight="300" fill="url(#accentGradient)">Flow</text>
      </g>
      
      {/* Puntos decorativos más visibles */}
      <circle cx="240" cy="20" r="2" fill="url(#accentGradient)" opacity="0.7">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="250" cy="25" r="1.5" fill="url(#primaryGradient)" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="235" cy="30" r="1.8" fill="url(#accentGradient)" opacity="0.6">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
};

// Versión del icono más grande para móviles
const BondFlowIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg viewBox="0 0 80 80" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="iconPrimaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor:"#1e40af", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#3b82f6", stopOpacity:1}} />
        </linearGradient>
        <linearGradient id="iconAccentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor:"#059669", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#10b981", stopOpacity:1}} />
        </linearGradient>
      </defs>
      
      <g transform="translate(10, 20)">
        <rect x="0" y="45" width="60" height="3" fill="url(#iconPrimaryGradient)" opacity="0.3"/>
        
        <rect x="5" y="30" width="8" height="15" fill="url(#iconPrimaryGradient)" rx="2">
          <animate attributeName="height" values="15;20;15" dur="3s" repeatCount="indefinite"/>
        </rect>
        <rect x="17" y="25" width="8" height="20" fill="url(#iconPrimaryGradient)" rx="2">
          <animate attributeName="height" values="20;25;20" dur="3s" repeatCount="indefinite" begin="0.5s"/>
        </rect>
        <rect x="29" y="20" width="8" height="25" fill="url(#iconAccentGradient)" rx="2">
          <animate attributeName="height" values="25;30;25" dur="3s" repeatCount="indefinite" begin="1s"/>
        </rect>
        <rect x="41" y="15" width="8" height="30" fill="url(#iconAccentGradient)" rx="2">
          <animate attributeName="height" values="30;35;30" dur="3s" repeatCount="indefinite" begin="1.5s"/>
        </rect>
        
        <path d="M53 20 L57 16 L61 20 M57 16 L57 30" stroke="url(#iconAccentGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </g>
    </svg>
  );
};

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  roles: string[]; // Roles que pueden ver este item
}

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchNotificationCount();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserRole(data?.role || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('read', false);

      if (error) throw error;
      setNotificationCount(count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

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
    if (path === "/marketplace" && location.pathname !== "/marketplace") {
      return location.pathname.startsWith("/marketplace/");
    }
    if (path === "/portfolio" && location.pathname !== "/portfolio") {
      return location.pathname.startsWith("/portfolio/");
    }
    return location.pathname === path;
  };

  // Configuración de navegación por rol
  const getNavigationItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      {
        to: "/profile",
        icon: <User size={20} />,
        label: "Perfil",
        roles: ["investor", "issuer", "admin"]
      }
    ];

    const roleSpecificItems: NavItem[] = [];

    if (userRole === "issuer") {
      roleSpecificItems.push(
        {
          to: "/bonds",
          icon: <FileText size={20} />,
          label: "Mis Bonos",
          roles: ["issuer"]
        },
        {
          to: "/bonds/new",
          icon: <Plus size={20} />,
          label: "Crear Bono",
          roles: ["issuer"]
        },
      );
    }

    if (userRole === "investor") {
      roleSpecificItems.push(
        {
          to: "/marketplace",
          icon: <ShoppingCart size={20} />,
          label: "Marketplace",
          roles: ["investor"]
        },
        {
          to: "/portfolio",
          icon: <Wallet size={20} />,
          label: "Mi Portfolio",
          roles: ["investor"]
        },
        {
          to: "/notifications",
          icon: <Bell size={20} />,
          label: "Notificaciones",
          roles: ["investor"]
        }
      );
    }

    if (userRole === "admin") {
      roleSpecificItems.push(
        {
          to: "/admin/bonds",
          icon: <FileText size={20} />,
          label: "Todos los Bonos",
          roles: ["admin"]
        },
        {
          to: "/admin/users",
          icon: <User size={20} />,
          label: "Usuarios",
          roles: ["admin"]
        },
        {
          to: "/admin/marketplace",
          icon: <TrendingUp size={20} />,
          label: "Marketplace",
          roles: ["admin"]
        }
      );
    }

    return [...roleSpecificItems, ...baseItems];
  };

  const navigationItems = getNavigationItems();

  if (loading) {
    return (
      <div className="min-h-screen w-16 md:w-64 bg-sidebar-background border-r border-sidebar-border flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-bond-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-16 md:w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      <div className="p-4 flex items-center justify-center md:justify-start">
        <div className="hidden md:block w-full">
          <BondFlowLogo className="h-16 w-full max-w-[240px]" />
        </div>
        
        <div className="block md:hidden">
          <BondFlowIcon className="h-12 w-12" />
        </div>
      </div>

      {/* Role Badge */}
      {userRole && (
        <div className="px-4 mb-4">
          <div className="hidden md:block">
            <Badge 
              variant="secondary" 
              className={cn(
                "w-full justify-center text-xs font-medium",
                userRole === "investor" && "bg-blue-100 text-blue-800",
                userRole === "issuer" && "bg-green-100 text-green-800",
                userRole === "admin" && "bg-purple-100 text-purple-800"
              )}
            >
              {userRole === "investor" && "🔍 Inversionista"}
              {userRole === "issuer" && "🏢 Emisor"}
              {userRole === "admin" && "👑 Administrador"}
            </Badge>
          </div>
          <div className="md:hidden flex justify-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs",
              userRole === "investor" && "bg-blue-100 text-blue-800",
              userRole === "issuer" && "bg-green-100 text-green-800",
              userRole === "admin" && "bg-purple-100 text-purple-800"
            )}>
              {userRole === "investor" && "🔍"}
              {userRole === "issuer" && "🏢"}
              {userRole === "admin" && "👑"}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-2 space-y-1 px-2 flex-1">
        {navigationItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            isActive={isLinkActive(item.to)}
          />
        ))}
      </div>

      {/* Quick Actions for specific roles */}
      {userRole === "issuer" && (
        <div className="px-2 mb-4">
          <div className="hidden md:block">
            <div className="text-xs text-muted-foreground px-3 mb-2">Acciones Rápidas</div>
            <Link to="/bonds/new">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs bg-bond-green/10 hover:bg-bond-green/20 border-bond-green/20"
              >
                <Plus size={16} className="mr-2" />
                Nuevo Bono
              </Button>
            </Link>
          </div>
        </div>
      )}

      {userRole === "investor" && (
        <div className="px-2 mb-4">
          <div className="hidden md:block">
            <div className="text-xs text-muted-foreground px-3 mb-2">Acciones Rápidas</div>
            <Link to="/marketplace">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs bg-bond-blue/10 hover:bg-bond-blue/20 border-bond-blue/20"
              >
                <TrendingUp size={16} className="mr-2" />
                Explorar Bonos
              </Button>
            </Link>
          </div>
        </div>
      )}

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
  badge?: number;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge, isActive }) => {
  return (
    <Link to={to}>
      <Button
        variant="ghost"
        className={cn(
          "w-full flex items-center justify-center md:justify-start text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent",
          isActive && "bg-sidebar-accent text-sidebar-primary font-medium"
        )}
      >
        <span className="md:mr-2 relative">
          {icon}
          {badge && badge > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
            >
              {badge > 99 ? '99+' : badge}
            </Badge>
          )}
        </span>
        <span className="hidden md:inline flex-1 text-left">{label}</span>
        {badge && badge > 0 && (
          <Badge 
            variant="destructive" 
            className="hidden md:flex h-5 w-5 p-0 text-xs items-center justify-center ml-auto"
          >
            {badge > 99 ? '99+' : badge}
          </Badge>
        )}
      </Button>
    </Link>
  );
};

export default AppSidebar;