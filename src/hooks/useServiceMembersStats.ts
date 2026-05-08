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

export type FidelityStatus = "fidele" | "regulier" | "irregulier" | "absent" | "non_suivi";

export interface ServiceMemberStat {
  id: string;
  nom_complet: string;
  est_actif: boolean;
  statut_bapteme: string;
  photo_url: string | null;
  present: number;
  total: number;
  rate: number;
  status: FidelityStatus;
}

export const useServiceMembersStats = (serviceId: string | null, period: PeriodType) => {
  const { start, end } = getPeriodRange(period);

  return useQuery({
    enabled: !!serviceId,
    queryKey: ["stats", "service-members", serviceId, period],
    queryFn: async (): Promise<ServiceMemberStat[]> => {
      if (!serviceId) return [];

      const [membresRes, presencesRes] = await Promise.all([
        supabase
          .from("membres")
          .select("id, nom_complet, est_actif, statut_bapteme, photo_url")
          .eq("service_id", serviceId)
          .order("nom_complet"),
        supabase
          .from("presences")
          .select("membre_id, est_present")
          .eq("service_id", serviceId)
          .gte("date_presence", start)
          .lte("date_presence", end),
      ]);

      if (membresRes.error) throw membresRes.error;
      if (presencesRes.error) throw presencesRes.error;

      const counts: Record<string, { p: number; t: number }> = {};
      (presencesRes.data || []).forEach((pr) => {
        if (!counts[pr.membre_id]) counts[pr.membre_id] = { p: 0, t: 0 };
        counts[pr.membre_id].t++;
        if (pr.est_present) counts[pr.membre_id].p++;
      });

      return (membresRes.data || []).map((m) => {
        const c = counts[m.id] || { p: 0, t: 0 };
        const rate = c.t > 0 ? Math.round((c.p / c.t) * 100) : 0;
        let status: FidelityStatus;
        if (c.t === 0) status = "non_suivi";
        else if (rate >= 80) status = "fidele";
        else if (rate >= 50) status = "regulier";
        else if (rate > 0) status = "irregulier";
        else status = "absent";
        return {
          id: m.id,
          nom_complet: m.nom_complet,
          est_actif: m.est_actif,
          statut_bapteme: m.statut_bapteme,
          photo_url: m.photo_url,
          present: c.p,
          total: c.t,
          rate,
          status,
        };
      });
    },
  });
};
