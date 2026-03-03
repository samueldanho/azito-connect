import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting per IP (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max requests per window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Sanitize string: trim, collapse whitespace, remove control chars
function sanitize(val: unknown, maxLen: number): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val !== "string") return null;
  return val.trim().replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ").slice(0, maxLen) || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez plus tard." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const nom_complet = sanitize(body.nom_complet, 100);
    const telephone = sanitize(body.telephone, 20);
    const lieu_habitation = sanitize(body.lieu_habitation, 100);
    const service_id = typeof body.service_id === "string" ? body.service_id.trim() : null;
    const statut_bapteme = body.statut_bapteme;

    // Validate nom_complet
    if (!nom_complet || nom_complet.length < 2) {
      return new Response(JSON.stringify({ error: "Le nom complet est requis (min 2 caractères)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate telephone format if provided
    if (telephone && !/^[+\d\s\-().]{4,20}$/.test(telephone)) {
      return new Response(JSON.stringify({ error: "Format de téléphone invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate UUID format for service_id
    if (service_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(service_id)) {
      return new Response(JSON.stringify({ error: "Service invalide" }), {
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
