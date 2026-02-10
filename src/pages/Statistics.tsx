import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useStatistics, PeriodType } from "@/hooks/useStatistics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { BarChart3, TrendingUp, Users, Calendar, Award, Percent } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";

const periods: { value: PeriodType; label: string }[] = [
  { value: "7j", label: "7 jours" },
  { value: "30j", label: "30 jours" },
  { value: "90j", label: "90 jours" },
  { value: "6m", label: "6 mois" },
  { value: "12m", label: "12 mois" },
];

const COLORS = ["#D97706", "#2563EB", "#059669", "#DC2626", "#7C3AED", "#EC4899", "#0891B2", "#84CC16"];

const Statistics = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodType>("30j");
  const [serviceId, setServiceId] = useState<string>("all");

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id, nom").order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useStatistics(period, serviceId === "all" ? undefined : serviceId);

  const activityChartConfig: ChartConfig = {
    present: { label: "Présents", color: "hsl(145, 50%, 35%)" },
    absent: { label: "Absents", color: "hsl(0, 72%, 51%)" },
  };

  const serviceChartConfig: ChartConfig = stats.rateByService.reduce((acc, s) => {
    acc[s.name] = { label: s.name, color: s.color };
    return acc;
  }, {} as ChartConfig);

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <DashboardSidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <DashboardSidebar isCollapsed={false} onToggle={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:ml-20" : "lg:ml-64")}>
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="p-4 lg:p-6">
          {/* Header + Filters */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-foreground mb-1">Statistiques</h1>
              <p className="text-muted-foreground text-sm">Analyse détaillée des présences par service et période</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les services</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                <TabsList>
                  {periods.map((p) => (
                    <TabsTrigger key={p.value} value={p.value} className="text-xs px-2.5">{p.label}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {stats.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <SummaryCard icon={Calendar} label="Jours suivis" value={stats.summary.daysTracked} color="text-primary" />
                <SummaryCard icon={Users} label="Présences totales" value={stats.summary.totalPresences} color="text-accent" />
                <SummaryCard icon={TrendingUp} label="Total présents" value={stats.summary.totalPresent} color="text-success" />
                <SummaryCard icon={Percent} label="Taux moyen" value={`${stats.summary.avgRate}%`} color="text-primary" />
              </div>

              {/* Attendance Evolution */}
              <div className="mb-8">
                <AttendanceChart data={stats.attendanceOverTime} />
              </div>

              {/* Rate by Service + Activity Type */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                {/* Rate by Service */}
                <div className="glass-card p-6">
                  <h3 className="font-display text-lg text-foreground mb-4">Taux de présence par service</h3>
                  {stats.rateByService.length === 0 ? (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">Aucune donnée</div>
                  ) : (
                    <ChartContainer config={serviceChartConfig} className="h-[280px] w-full">
                      <BarChart data={stats.rateByService} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} angle={-25} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="rate" radius={[6, 6, 0, 0]} name="Taux (%)">
                          {stats.rateByService.map((entry, i) => (
                            <Cell key={entry.id} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  )}
                </div>

                {/* By Activity Type */}
                <div className="glass-card p-6">
                  <h3 className="font-display text-lg text-foreground mb-4">Présences par type d'activité</h3>
                  {stats.byActivityType.length === 0 ? (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">Aucune donnée</div>
                  ) : (
                    <ChartContainer config={activityChartConfig} className="h-[280px] w-full">
                      <BarChart data={stats.byActivityType} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="present" stackId="a" fill="var(--color-present)" radius={[0, 0, 0, 0]} name="Présents" />
                        <Bar dataKey="absent" stackId="a" fill="var(--color-absent)" radius={[6, 6, 0, 0]} name="Absents" />
                      </BarChart>
                    </ChartContainer>
                  )}
                </div>
              </div>

              {/* Top Members */}
              <div className="glass-card p-6">
                <h3 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Top 10 membres les plus assidus
                </h3>
                {stats.topMembers.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Aucune donnée de présence pour cette période</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 px-3 font-medium">#</th>
                          <th className="text-left py-2 px-3 font-medium">Membre</th>
                          <th className="text-center py-2 px-3 font-medium">Présences</th>
                          <th className="text-center py-2 px-3 font-medium">Total</th>
                          <th className="text-right py-2 px-3 font-medium">Taux</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topMembers.map((m, i) => (
                          <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-muted-foreground">{i + 1}</td>
                            <td className="py-2.5 px-3 font-medium text-foreground">{m.name}</td>
                            <td className="py-2.5 px-3 text-center text-success font-medium">{m.present}</td>
                            <td className="py-2.5 px-3 text-center text-muted-foreground">{m.total}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={cn(
                                "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold",
                                m.rate >= 80 ? "bg-success/10 text-success" :
                                m.rate >= 50 ? "bg-primary/10 text-primary" :
                                "bg-destructive/10 text-destructive"
                              )}>
                                {m.rate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string | number; color: string }) => (
  <div className="glass-card p-4 flex items-center gap-3">
    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-muted", color)}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

export default Statistics;
