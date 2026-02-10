import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

export type PeriodType = "7j" | "30j" | "90j" | "6m" | "12m";

const getPeriodRange = (period: PeriodType) => {
  const now = new Date();
  const end = format(now, "yyyy-MM-dd");
  let start: string;
  switch (period) {
    case "7j": start = format(subDays(now, 7), "yyyy-MM-dd"); break;
    case "30j": start = format(subDays(now, 30), "yyyy-MM-dd"); break;
    case "90j": start = format(subDays(now, 90), "yyyy-MM-dd"); break;
    case "6m": start = format(subMonths(now, 6), "yyyy-MM-dd"); break;
    case "12m": start = format(subMonths(now, 12), "yyyy-MM-dd"); break;
  }
  return { start, end };
};

export const useStatistics = (period: PeriodType, serviceId?: string) => {
  const { start, end } = getPeriodRange(period);

  // Attendance over time
  const { data: attendanceOverTime = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["stats", "attendance-over-time", period, serviceId],
    queryFn: async () => {
      let query = supabase
        .from("presences")
        .select("date_presence, est_present")
        .gte("date_presence", start)
        .lte("date_presence", end)
        .order("date_presence", { ascending: true });

      if (serviceId) query = query.eq("service_id", serviceId);

      const { data, error } = await query;
      if (error) throw error;

      const grouped: Record<string, { present: number; absent: number }> = {};
      data?.forEach((p) => {
        if (!grouped[p.date_presence]) grouped[p.date_presence] = { present: 0, absent: 0 };
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

  // Attendance rate by service
  const { data: rateByService = [], isLoading: loadingByService } = useQuery({
    queryKey: ["stats", "rate-by-service", period],
    queryFn: async () => {
      const [servicesRes, presencesRes] = await Promise.all([
        supabase.from("services").select("id, nom, couleur"),
        supabase
          .from("presences")
          .select("service_id, est_present")
          .gte("date_presence", start)
          .lte("date_presence", end),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (presencesRes.error) throw presencesRes.error;

      return (servicesRes.data || []).map((s) => {
        const servicePresences = presencesRes.data?.filter((p) => p.service_id === s.id) || [];
        const total = servicePresences.length;
        const present = servicePresences.filter((p) => p.est_present).length;
        return {
          id: s.id,
          name: s.nom,
          color: s.couleur || "#D97706",
          total,
          present,
          absent: total - present,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
        };
      });
    },
  });

  // Activity type breakdown
  const { data: byActivityType = [], isLoading: loadingByActivity } = useQuery({
    queryKey: ["stats", "by-activity-type", period, serviceId],
    queryFn: async () => {
      let query = supabase
        .from("presences")
        .select("type_activite, est_present")
        .gte("date_presence", start)
        .lte("date_presence", end);

      if (serviceId) query = query.eq("service_id", serviceId);

      const { data, error } = await query;
      if (error) throw error;

      const labels: Record<string, string> = {
        culte: "Culte",
        reunion: "Réunion",
        activite_speciale: "Activité spéciale",
      };

      const grouped: Record<string, { present: number; absent: number }> = {};
      data?.forEach((p) => {
        if (!grouped[p.type_activite]) grouped[p.type_activite] = { present: 0, absent: 0 };
        if (p.est_present) grouped[p.type_activite].present++;
        else grouped[p.type_activite].absent++;
      });

      return Object.entries(grouped).map(([type, counts]) => ({
        type,
        label: labels[type] || type,
        present: counts.present,
        absent: counts.absent,
        total: counts.present + counts.absent,
        rate: Math.round((counts.present / (counts.present + counts.absent)) * 100),
      }));
    },
  });

  // Top members by presence
  const { data: topMembers = [], isLoading: loadingTopMembers } = useQuery({
    queryKey: ["stats", "top-members", period, serviceId],
    queryFn: async () => {
      let query = supabase
        .from("presences")
        .select("membre_id, est_present")
        .gte("date_presence", start)
        .lte("date_presence", end);

      if (serviceId) query = query.eq("service_id", serviceId);

      const { data: presences, error: pErr } = await query;
      if (pErr) throw pErr;

      const memberStats: Record<string, { present: number; total: number }> = {};
      presences?.forEach((p) => {
        if (!memberStats[p.membre_id]) memberStats[p.membre_id] = { present: 0, total: 0 };
        memberStats[p.membre_id].total++;
        if (p.est_present) memberStats[p.membre_id].present++;
      });

      const memberIds = Object.keys(memberStats);
      if (memberIds.length === 0) return [];

      const { data: membres, error: mErr } = await supabase
        .from("membres")
        .select("id, nom_complet")
        .in("id", memberIds);
      if (mErr) throw mErr;

      const membersMap = new Map(membres?.map((m) => [m.id, m.nom_complet]));

      return Object.entries(memberStats)
        .map(([id, stats]) => ({
          id,
          name: membersMap.get(id) || "Inconnu",
          present: stats.present,
          total: stats.total,
          rate: Math.round((stats.present / stats.total) * 100),
        }))
        .sort((a, b) => b.rate - a.rate || b.present - a.present)
        .slice(0, 10);
    },
  });

  // Summary stats
  const summary = {
    totalPresences: attendanceOverTime.reduce((sum, d) => sum + d.total, 0),
    totalPresent: attendanceOverTime.reduce((sum, d) => sum + d.present, 0),
    avgRate: attendanceOverTime.length > 0
      ? Math.round(attendanceOverTime.reduce((sum, d) => sum + d.rate, 0) / attendanceOverTime.length)
      : 0,
    daysTracked: attendanceOverTime.length,
  };

  return {
    attendanceOverTime,
    rateByService,
    byActivityType,
    topMembers,
    summary,
    isLoading: loadingAttendance || loadingByService || loadingByActivity || loadingTopMembers,
  };
};
