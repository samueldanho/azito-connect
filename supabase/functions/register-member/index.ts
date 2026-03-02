import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nom_complet, telephone, lieu_habitation, service_id, statut_bapteme } = await req.json();

    // Validation
    if (!nom_complet || typeof nom_complet !== "string" || nom_complet.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Le nom complet est requis (min 2 caractères)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (nom_complet.trim().length > 100) {
      return new Response(JSON.stringify({ error: "Le nom complet ne doit pas dépasser 100 caractères" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validStatuts = ["baptise", "non_baptise"];
    const statut = validStatuts.includes(statut_bapteme) ? statut_bapteme : "non_baptise";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate service_id if provided
    if (service_id) {
      const { data: service } = await supabaseAdmin
        .from("services")
        .select("id")
        .eq("id", service_id)
        .maybeSingle();

      if (!service) {
        return new Response(JSON.stringify({ error: "Service invalide" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data, error } = await supabaseAdmin.from("membres").insert({
      nom_complet: nom_complet.trim(),
      telephone: telephone?.trim() || null,
      lieu_habitation: lieu_habitation?.trim() || null,
      service_id: service_id || null,
      statut_bapteme: statut,
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, member: data }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erreur lors de l'inscription" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
