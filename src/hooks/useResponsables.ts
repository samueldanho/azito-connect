import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useResponsables = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all profiles with their roles and service info
  const { data: responsables = [], isLoading } = useQuery({
    queryKey: ["responsables"],
    queryFn: async () => {
      const [profilesRes, rolesRes, servicesRes] = await Promise.all([
        supabase.from("profiles").select("id, nom_complet, email, telephone, service_id"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("services").select("id, nom, couleur"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (servicesRes.error) throw servicesRes.error;

      const rolesMap = new Map<string, string[]>();
      rolesRes.data?.forEach((r) => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      const servicesMap = new Map(servicesRes.data?.map((s) => [s.id, s]) || []);

      return (profilesRes.data || []).map((p) => ({
        id: p.id,
        nom_complet: p.nom_complet,
        email: p.email,
        telephone: p.telephone,
        service_id: p.service_id,
        service: p.service_id ? servicesMap.get(p.service_id) : null,
        roles: rolesMap.get(p.id) || [],
        isBerger: (rolesMap.get(p.id) || []).includes("berger"),
        isResponsable: (rolesMap.get(p.id) || []).includes("responsable_service"),
      }));
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "berger" | "responsable_service" }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsables"] });
      toast({ title: "Rôle assigné", description: "Le rôle a été assigné avec succès." });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "berger" | "responsable_service" }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsables"] });
      toast({ title: "Rôle retiré", description: "Le rôle a été retiré avec succès." });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const assignService = useMutation({
    mutationFn: async ({ userId, serviceId }: { userId: string; serviceId: string | null }) => {
      const { error } = await supabase.from("profiles").update({ service_id: serviceId }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsables"] });
      toast({ title: "Service assigné", description: "Le service a été mis à jour." });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  return { responsables, isLoading, assignRole, removeRole, assignService };
};
