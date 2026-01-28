import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ServiceCard } from "@/components/dashboard/ServiceCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Users, UserCheck, Church, TrendingUp, Calendar } from "lucide-react";

const mockServices = [
  { name: "Louange & Adoration", memberCount: 45, presentCount: 38, responsable: "Marie Diallo", color: "#D97706" },
  { name: "Accueil", memberCount: 32, presentCount: 28, responsable: "Paul Mensah", color: "#059669" },
  { name: "Intercession", memberCount: 28, presentCount: 25, responsable: "Sarah Ouedraogo", color: "#DC2626" },
  { name: "Jeunesse", memberCount: 65, presentCount: 52, responsable: "David Koné", color: "#7C3AED" },
  { name: "Enfants", memberCount: 40, presentCount: 35, responsable: "Ruth Bamba", color: "#2563EB" },
  { name: "Protocole", memberCount: 20, presentCount: 18, responsable: "Jean Koffi", color: "#0891B2" },
];

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <DashboardSidebar
            isCollapsed={false}
            onToggle={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="p-4 lg:p-6">
          {/* Welcome Section */}
          <div className="mb-8 animate-fade-in">
            <h1 className="font-display text-3xl text-foreground mb-2">
              Bonjour, Pasteur Jean 👋
            </h1>
            <p className="text-muted-foreground">
              Voici un aperçu de votre église aujourd'hui
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Total Membres"
              value={230}
              icon={Users}
              variant="primary"
              trend={{ value: 12, isPositive: true }}
              subtitle="Ce mois"
            />
            <StatsCard
              title="Présents Aujourd'hui"
              value={196}
              icon={UserCheck}
              variant="success"
              subtitle="85% de présence"
            />
            <StatsCard
              title="Services Actifs"
              value={6}
              icon={Church}
              variant="accent"
            />
            <StatsCard
              title="Taux de Fidélité"
              value="92%"
              icon={TrendingUp}
              trend={{ value: 5, isPositive: true }}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Services Section */}
            <div className="xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-foreground">
                  Services
                </h2>
                <button className="text-sm text-primary hover:underline font-medium">
                  Voir tout
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockServices.map((service) => (
                  <ServiceCard key={service.name} {...service} />
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="xl:col-span-1">
              <RecentActivity />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 glass-card p-6">
            <h2 className="font-display text-xl text-foreground mb-4">
              Actions rapides
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickAction
                icon={Users}
                label="Ajouter membre"
                color="bg-primary/10 text-primary"
              />
              <QuickAction
                icon={Calendar}
                label="Marquer présence"
                color="bg-success/10 text-success"
              />
              <QuickAction
                icon={Church}
                label="Nouveau service"
                color="bg-accent/10 text-accent"
              />
              <QuickAction
                icon={TrendingUp}
                label="Voir rapports"
                color="bg-muted text-muted-foreground"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const QuickAction = ({
  icon: Icon,
  label,
  color,
}: {
  icon: typeof Users;
  label: string;
  color: string;
}) => (
  <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-200 group">
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
      <Icon className="w-6 h-6" />
    </div>
    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
      {label}
    </span>
  </button>
);

export default Dashboard;
