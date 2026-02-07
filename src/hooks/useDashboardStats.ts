import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

export const useDashboardStats = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

  // Total members count
  const { data: membersCount = 0, isLoading: loadingMembers } = useQuery({
    queryKey: ["dashboard", "members-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("membres")
        .select("*", { count: "exact", head: true })
        .eq("est_actif", true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Members by service
  const { data: membersByService = [], isLoading: loadingServices } = useQuery({
    queryKey: ["dashboard", "members-by-service"],
    queryFn: async () => {
      const { data: services, error: sErr } = await supabase
        .from("services")
        .select("id, nom, couleur");
      if (sErr) throw sErr;

      const { data: membres, error: mErr } = await supabase
        .from("membres")
        .select("service_id")
        .eq("est_actif", true);
      if (mErr) throw mErr;

      return (services || []).map((s) => ({
        id: s.id,
        name: s.nom,
        color: s.couleur || "#D97706",
        memberCount: membres?.filter((m) => m.service_id === s.id).length ?? 0,
      }));
    },
  });

  // Today's presence stats
  const { data: todayPresence, isLoading: loadingPresence } = useQuery({
    queryKey: ["dashboard", "today-presence", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presences")
        .select("est_present")
        .eq("date_presence", today);
      if (error) throw error;
      const total = data?.length ?? 0;
      const present = data?.filter((p) => p.est_present).length ?? 0;
      return { total, present, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
    },
  });

  // Attendance evolution over last 30 days (grouped by date)
  const { data: attendanceEvolution = [], isLoading: loadingEvolution } = useQuery({
    queryKey: ["dashboard", "attendance-evolution", thirtyDaysAgo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presences")
        .select("date_presence, est_present")
        .gte("date_presence", thirtyDaysAgo)
        .lte("date_presence", today)
        .order("date_presence", { ascending: true });
      if (error) throw error;

      const grouped: Record<string, { present: number; absent: number }> = {};
      data?.forEach((p) => {
        if (!grouped[p.date_presence]) {
          grouped[p.date_presence] = { present: 0, absent: 0 };
        }
        if (p.est_present) grouped[p.date_presence].present++;
        else grouped[p.date_presence].absent++;
      });

      return Object.entries(grouped).map(([date, counts]) => ({
        date,
        present: counts.present,
        absent: counts.absent,
        total: counts.present + counts.absent,
        rate: Math.round((counts.present / (counts.present + counts.absent)) * 100),
      }));
    },
  });

  // Monthly comparison (this month vs last month)
  const { data: monthlyTrend } = useQuery({
    queryKey: ["dashboard", "monthly-trend"],
    queryFn: async () => {
      const now = new Date();
      const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const thisMonthEnd = format(endOfMonth(now), "yyyy-MM-dd");
      const lastMonth = subMonths(now, 1);
      const lastMonthStart = format(startOfMonth(lastMonth), "yyyy-MM-dd");
      const lastMonthEnd = format(endOfMonth(lastMonth), "yyyy-MM-dd");

      const [thisRes, lastRes, membersThisMonth, membersLastMonth] = await Promise.all([
        supabase.from("presences").select("est_present").gte("date_presence", thisMonthStart).lte("date_presence", thisMonthEnd),
        supabase.from("presences").select("est_present").gte("date_presence", lastMonthStart).lte("date_presence", lastMonthEnd),
        supabase.from("membres").select("*", { count: "exact", head: true }).lte("created_at", thisMonthEnd),
        supabase.from("membres").select("*", { count: "exact", head: true }).lte("created_at", lastMonthEnd),
      ]);

      const thisPresent = thisRes.data?.filter((p) => p.est_present).length ?? 0;
      const lastPresent = lastRes.data?.filter((p) => p.est_present).length ?? 0;
      const presenceTrend = lastPresent > 0 ? Math.round(((thisPresent - lastPresent) / lastPresent) * 100) : 0;

      const currentMembers = membersThisMonth.count ?? 0;
      const previousMembers = membersLastMonth.count ?? 0;
      const membersTrend = previousMembers > 0 ? Math.round(((currentMembers - previousMembers) / previousMembers) * 100) : 0;

      return { presenceTrend, membersTrend };
    },
  });

  // Recent activity logs
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Services count
  const servicesCount = membersByService.length;

  return {
    membersCount,
    membersByService,
    todayPresence: todayPresence ?? { total: 0, present: 0, rate: 0 },
    servicesCount,
    attendanceEvolution,
    monthlyTrend: monthlyTrend ?? { presenceTrend: 0, membersTrend: 0 },
    recentActivity,
    isLoading: loadingMembers || loadingServices || loadingPresence || loadingEvolution,
  };
};
