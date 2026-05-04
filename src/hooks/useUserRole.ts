import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "berger" | "responsable_service";

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: roles, isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  const userRoles = roles ?? [];
  const isBerger = userRoles.includes("berger");
  const isResponsable = userRoles.includes("responsable_service");

  const hasRole = (allowed: AppRole[]) =>
    userRoles.some((r) => allowed.includes(r));

  return { roles: userRoles, isBerger, isResponsable, hasRole, isLoading };
};
