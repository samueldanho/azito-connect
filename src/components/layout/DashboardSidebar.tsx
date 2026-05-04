import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChurchLogo } from "@/components/icons/ChurchLogo";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Layers,
  Settings,
  LogOut,
  UserCog,
  FileText,
  ChevronLeft,
  Bus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole, AppRole } from "@/hooks/useUserRole";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const menuItems: { icon: any; label: string; path: string; roles: AppRole[] }[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard", roles: ["berger", "responsable_service"] },
  { icon: Users, label: "Membres", path: "/dashboard/membres", roles: ["berger", "responsable_service"] },
  { icon: Calendar, label: "Présences", path: "/dashboard/presences", roles: ["berger", "responsable_service"] },
  { icon: Layers, label: "Services", path: "/dashboard/services", roles: ["berger"] },
  { icon: BarChart3, label: "Statistiques", path: "/dashboard/statistiques", roles: ["berger", "responsable_service"] },
  { icon: UserCog, label: "Responsables", path: "/dashboard/responsables", roles: ["berger"] },
  { icon: Bus, label: "Bus-Center", path: "/dashboard/bus-center", roles: ["berger", "responsable_service"] },
  { icon: FileText, label: "Logs CRM", path: "/dashboard/logs", roles: ["berger"] },
  { icon: Settings, label: "Paramètres", path: "/dashboard/parametres", roles: ["berger", "responsable_service"] },
];

export const DashboardSidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { hasRole } = useUserRole();
  const visibleItems = menuItems.filter((item) => hasRole(item.roles));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen gradient-sidebar border-r border-sidebar-border z-50 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            <ChurchLogo size="sm" />
            {!isCollapsed && (
              <div className="animate-fade-in">
                <h1 className="font-display text-lg text-sidebar-foreground leading-tight">
                  Mon Église
                </h1>
                <span className="text-xs text-sidebar-primary font-medium">
                  Connect
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                  isCollapsed && "justify-center",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <Button
            variant="ghost"
            onClick={onToggle}
            className={cn(
              "w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              isCollapsed && "px-0"
            )}
          >
            <ChevronLeft
              className={cn(
                "w-5 h-5 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
            {!isCollapsed && <span className="ml-2">Réduire</span>}
          </Button>
          
          <Button
            variant="ghost"
            className={cn(
              "w-full text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive",
              isCollapsed && "px-0"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="ml-2">Déconnexion</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};
