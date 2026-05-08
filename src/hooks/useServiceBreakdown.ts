import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths } from "date-fns";
import type { PeriodType } from "@/hooks/useStatistics";

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

export interface ServiceBreakdownRow {
  id: string;
  name: string;
  color: string;
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  baptizedMembers: number;
  nonBaptizedMembers: number;
  presenceRate: number;
  fidelityRate: number; // % of members with ≥80% attendance
  totalPresences: number;
  totalPresent: number;
}

export const useServiceBreakdown = (period: PeriodType) => {
  const { start, end } = getPeriodRange(period);

  return useQuery({
    queryKey: ["stats", "service-breakdown", period],
    queryFn: async (): Promise<ServiceBreakdownRow[]> => {
      const [servicesRes, membresRes, presencesRes] = await Promise.all([
        supabase.from("services").select("id, nom, couleur"),
        supabase.from("membres").select("id, service_id, est_actif, statut_bapteme"),
        supabase
          .from("presences")
          .select("membre_id, service_id, est_present")
          .gte("date_presence", start)
          .lte("date_presence", end),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (membresRes.error) throw membresRes.error;
      if (presencesRes.error) throw presencesRes.error;

      const services = servicesRes.data || [];
      const membres = membresRes.data || [];
      const presences = presencesRes.data || [];

      return services.map((s) => {
        const serviceMembers = membres.filter((m) => m.service_id === s.id);
        const activeMembers = serviceMembers.filter((m) => m.est_actif).length;
        const baptized = serviceMembers.filter((m) => m.statut_bapteme === "baptise").length;

        const servicePresences = presences.filter((p) => p.service_id === s.id);
        const totalPresences = servicePresences.length;
        const totalPresent = servicePresences.filter((p) => p.est_present).length;
        const presenceRate = totalPresences > 0 ? Math.round((totalPresent / totalPresences) * 100) : 0;

        // Fidelity: per-member attendance rate ≥80%
        const perMember: Record<string, { p: number; t: number }> = {};
        servicePresences.forEach((pr) => {
          if (!perMember[pr.membre_id]) perMember[pr.membre_id] = { p: 0, t: 0 };
          perMember[pr.membre_id].t++;
          if (pr.est_present) perMember[pr.membre_id].p++;
        });
        const tracked = Object.values(perMember);
        const faithful = tracked.filter((m) => m.t > 0 && (m.p / m.t) >= 0.8).length;
        const fidelityRate = tracked.length > 0 ? Math.round((faithful / tracked.length) * 100) : 0;

        return {
          id: s.id,
          name: s.nom,
          color: s.couleur || "#D97706",
          totalMembers: serviceMembers.length,
          activeMembers,
          inactiveMembers: serviceMembers.length - activeMembers,
          baptizedMembers: baptized,
          nonBaptizedMembers: serviceMembers.length - baptized,
          presenceRate,
          fidelityRate,
          totalPresences,
          totalPresent,
        };
      });
    },
  });
};
