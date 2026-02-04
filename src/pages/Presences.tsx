import { useState, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PresenceFilters } from "@/components/presences/PresenceFilters";
import { PresenceList } from "@/components/presences/PresenceList";
import { PresenceStats } from "@/components/presences/PresenceStats";
import { useMembers, useServices } from "@/hooks/useMembers";
import { usePresences, TypeActivite } from "@/hooks/usePresences";
import { CalendarCheck } from "lucide-react";

const Presences = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters state
  const [date, setDate] = useState<Date>(new Date());
  const [typeActivite, setTypeActivite] = useState<TypeActivite>("culte");
  const [serviceFilter, setServiceFilter] = useState("all");

  // Data hooks
  const { members, isLoading: membersLoading } = useMembers();
  const { data: services = [] } = useServices();
  
  const dateStr = format(date, "yyyy-MM-dd");
  const { presences, isLoading: presencesLoading, bulkMarkPresence } = usePresences(
    dateStr,
    typeActivite,
    serviceFilter
  );

  // Calculate stats
  const stats = useMemo(() => {
    const filteredMembers = members.filter((m) => {
      if (!m.est_actif) return false;
      if (serviceFilter && serviceFilter !== "all") {
        return m.service_id === serviceFilter;
      }
      return true;
    });

    const presentCount = presences.filter((p) => p.est_present).length;
    const rate = filteredMembers.length > 0 
      ? Math.round((presentCount / filteredMembers.length) * 100) 
      : 0;

    return {
      totalMembers: filteredMembers.length,
      presentCount,
      absentCount: filteredMembers.length - presentCount,
      rate,
    };
  }, [members, presences, serviceFilter]);

  const isLoading = membersLoading || presencesLoading;

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

        <main className="p-4 lg:p-6 space-y-6">
          {/* Header */}
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarCheck className="h-6 w-6 text-primary" />
              </div>
              <h1 className="font-display text-2xl lg:text-3xl text-foreground">
                Gestion des présences
              </h1>
            </div>
            <p className="text-muted-foreground">
              Marquez la présence des membres aux cultes, réunions et activités
            </p>
          </div>

          {/* Filters */}
          <PresenceFilters
            date={date}
            onDateChange={setDate}
            typeActivite={typeActivite}
            onTypeActiviteChange={setTypeActivite}
            serviceFilter={serviceFilter}
            onServiceFilterChange={setServiceFilter}
            services={services}
          />

          {/* Stats */}
          <PresenceStats
            totalMembers={stats.totalMembers}
            presentCount={stats.presentCount}
            absentCount={stats.absentCount}
            rate={stats.rate}
          />

          {/* Presence List */}
          <PresenceList
            members={members}
            presences={presences}
            services={services}
            date={date}
            typeActivite={typeActivite}
            serviceFilter={serviceFilter}
            isLoading={isLoading}
            isSaving={bulkMarkPresence.isPending}
            onSave={(data) => bulkMarkPresence.mutate(data)}
          />
        </main>
      </div>
    </div>
  );
};

export default Presences;
