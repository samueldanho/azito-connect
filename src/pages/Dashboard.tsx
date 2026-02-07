import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { ServiceDistributionChart } from "@/components/dashboard/ServiceDistributionChart";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Users, UserCheck, Church, TrendingUp, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    membersCount,
    membersByService,
    todayPresence,
    servicesCount,
    attendanceEvolution,
    monthlyTrend,
    recentActivity,
    isLoading,
  } = useDashboardStats();

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
              Tableau de bord 👋
            </h1>
            <p className="text-muted-foreground">
              Voici un aperçu de votre église aujourd'hui
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[140px] rounded-xl" />
              ))
            ) : (
              <>
                <StatsCard
                  title="Total Membres"
                  value={membersCount}
                  icon={Users}
                  variant="primary"
                  trend={
                    monthlyTrend.membersTrend !== 0
                      ? { value: Math.abs(monthlyTrend.membersTrend), isPositive: monthlyTrend.membersTrend > 0 }
                      : undefined
                  }
                  subtitle="Membres actifs"
                />
                <StatsCard
                  title="Présents Aujourd'hui"
                  value={todayPresence.present}
                  icon={UserCheck}
                  variant="success"
                  subtitle={todayPresence.total > 0 ? `${todayPresence.rate}% de présence` : "Pas encore de présences"}
                />
                <StatsCard
                  title="Services Actifs"
                  value={servicesCount}
                  icon={Church}
                  variant="accent"
                />
                <StatsCard
                  title="Taux de Présence"
                  value={todayPresence.total > 0 ? `${todayPresence.rate}%` : "—"}
                  icon={TrendingUp}
                  trend={
                    monthlyTrend.presenceTrend !== 0
                      ? { value: Math.abs(monthlyTrend.presenceTrend), isPositive: monthlyTrend.presenceTrend > 0 }
                      : undefined
                  }
                  subtitle="vs mois dernier"
                />
              </>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {isLoading ? (
              <>
                <Skeleton className="h-[320px] rounded-xl" />
                <Skeleton className="h-[320px] rounded-xl" />
              </>
            ) : (
              <>
                <AttendanceChart data={attendanceEvolution} />
                <ServiceDistributionChart data={membersByService} />
              </>
            )}
          </div>

          {/* Activity + Quick Actions */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <RecentActivity activities={recentActivity} />
            </div>

            <div className="xl:col-span-1">
              <div className="glass-card p-6">
                <h3 className="font-display text-lg text-foreground mb-4">
                  Actions rapides
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickAction icon={Users} label="Ajouter membre" color="bg-primary/10 text-primary" />
                  <QuickAction icon={Calendar} label="Marquer présence" color="bg-success/10 text-success" />
                  <QuickAction icon={Church} label="Nouveau service" color="bg-accent/10 text-accent" />
                  <QuickAction icon={TrendingUp} label="Voir rapports" color="bg-muted text-muted-foreground" />
                </div>
              </div>
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
