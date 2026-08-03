import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Presence = Tables<"presences">;
export type PresenceInsert = TablesInsert<"presences">;
export type TypeActivite = Enums<"type_activite">;

export interface PresenceWithMember extends Presence {
  membres: {
    id: string;
    nom_complet: string;
    photo_url: string | null;
    service_id: string | null;
  } | null;
}

export const usePresences = (date: string, typeActivite: TypeActivite, serviceId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: presences = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["presences", date, typeActivite, serviceId],
    queryFn: async () => {
      let query = supabase
        .from("presences")
        .select(`
          *,
          membres:membre_id (
            id,
            nom_complet,
            photo_url,
            service_id
          )
        `)
        .eq("date_presence", date)
        .eq("type_activite", typeActivite);

      if (serviceId && serviceId !== "all") {
        query = query.eq("service_id", serviceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PresenceWithMember[];
    },
    enabled: !!date && !!typeActivite,
  });

  const markPresence = useMutation({
    mutationFn: async (presence: PresenceInsert) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      // Check if presence already exists for this member/date/activity
      const { data: existing } = await supabase
        .from("presences")
        .select("id")
        .eq("membre_id", presence.membre_id)
        .eq("date_presence", presence.date_presence)
        .eq("type_activite", presence.type_activite)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("presences")
          .update({ est_present: presence.est_present, marked_by: userId })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("presences")
          .insert({ ...presence, marked_by: presence.marked_by ?? userId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presences"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkMarkPresence = useMutation({
    mutationFn: async (presences: PresenceInsert[]) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      // Use upsert with conflict resolution
      const { data, error } = await supabase
        .from("presences")
        .upsert(
          presences.map((p) => ({ ...p, marked_by: p.marked_by ?? userId })),
          {
            onConflict: "membre_id,date_presence,type_activite",
            ignoreDuplicates: false,
          }
        )
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["presences"] });
      const presentCount = variables.filter(p => p.est_present).length;
      toast({
        title: "Présences enregistrées",
        description: `${presentCount} membre${presentCount > 1 ? "s" : ""} marqué${presentCount > 1 ? "s" : ""} présent${presentCount > 1 ? "s" : ""}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    presences,
    isLoading,
    error,
    markPresence,
    bulkMarkPresence,
  };
};

// Get presence history for a member
export const useMemberPresenceHistory = (memberId: string) => {
  return useQuery({
    queryKey: ["presences", "member", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presences")
        .select("*")
        .eq("membre_id", memberId)
        .order("date_presence", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });
};

// Get presence stats for a date range
export const usePresenceStats = (startDate: string, endDate: string, serviceId?: string) => {
  return useQuery({
    queryKey: ["presences", "stats", startDate, endDate, serviceId],
    queryFn: async () => {
      let query = supabase
        .from("presences")
        .select("*")
        .gte("date_presence", startDate)
        .lte("date_presence", endDate);

      if (serviceId && serviceId !== "all") {
        query = query.eq("service_id", serviceId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const total = data.length;
      const present = data.filter((p) => p.est_present).length;
      const absent = total - present;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        total,
        present,
        absent,
        rate,
        byType: {
          culte: data.filter((p) => p.type_activite === "culte"),
          reunion: data.filter((p) => p.type_activite === "reunion"),
          activite_speciale: data.filter((p) => p.type_activite === "activite_speciale"),
        },
      };
    },
    enabled: !!startDate && !!endDate,
  });
};
