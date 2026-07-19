import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Member = Tables<"membres">;
export type MemberInsert = TablesInsert<"membres">;
export type MemberUpdate = TablesUpdate<"membres">;

const friendlyError = (message: string) => {
  if (/row-level security|violates row-level|permission denied/i.test(message)) {
    return "Vous n'avez pas les droits pour cette action. Vérifiez que le membre est bien assigné à votre service.";
  }
  return message;
};

export const useMembers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel("membres-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "membres" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["membres"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);


  const {
    data: members = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["membres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membres")
        .select(`
          *,
          services:service_id (
            id,
            nom,
            couleur
          )
        `)
        .order("nom_complet", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const createMember = useMutation({
    mutationFn: async (member: MemberInsert) => {
      const { data, error } = await supabase
        .from("membres")
        .insert(member)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membres"] });
      toast({
        title: "Membre ajouté",
        description: "Le membre a été créé avec succès.",
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

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: MemberUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("membres")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membres"] });
      toast({
        title: "Membre modifié",
        description: "Les informations ont été mises à jour.",
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

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("membres").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membres"] });
      toast({
        title: "Membre supprimé",
        description: "Le membre a été supprimé avec succès.",
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
    members,
    isLoading,
    error,
    createMember,
    updateMember,
    deleteMember,
  };
};

export const useServices = () => {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("nom", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};
