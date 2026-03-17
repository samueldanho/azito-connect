import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

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

function sanitize(val: unknown, maxLen: number): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val !== "string") return null;
  return val.trim().replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ").slice(0, maxLen) || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // Return zones list
    if (body.action === "get_zones") {
      const { data: zones } = await supabaseAdmin
        .from("bus_center_zones")
        .select("id, nom")
        .order("nom");
      return new Response(JSON.stringify({ zones: zones || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit for submissions
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez plus tard." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nom = sanitize(body.nom, 100);
    const prenom = sanitize(body.prenom, 100);
    const heure_depart = sanitize(body.heure_depart, 10);
    const zone_id = sanitize(body.zone_id, 36);
    const nombre_anciens = typeof body.nombre_anciens === "number" ? Math.max(0, Math.floor(body.nombre_anciens)) : 0;
    const nombre_nouveaux = typeof body.nombre_nouveaux === "number" ? Math.max(0, Math.floor(body.nombre_nouveaux)) : 0;

    if (!nom || nom.length < 2) {
      return new Response(JSON.stringify({ error: "Le nom est requis (min 2 caractères)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!prenom || prenom.length < 2) {
      return new Response(JSON.stringify({ error: "Le prénom est requis (min 2 caractères)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!heure_depart || !/^\d{2}:\d{2}$/.test(heure_depart)) {
      return new Response(JSON.stringify({ error: "L'heure de départ est requise (format HH:MM)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const insertData: any = { nom, prenom, heure_depart, nombre_anciens, nombre_nouveaux };
    if (zone_id) insertData.zone_id = zone_id;

    const { data, error } = await supabaseAdmin.from("bus_center").insert(insertData).select().single();
    if (error) throw error;

    // Notify berger users
    const { data: bergerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "berger");

    if (bergerRoles && bergerRoles.length > 0) {
      const notifications = bergerRoles.map((r: { user_id: string }) => ({
        user_id: r.user_id,
        title: "Nouveau Bus-Center enregistré",
        message: `${prenom} ${nom} — Départ: ${heure_depart}, Anciens: ${nombre_anciens}, Nouveaux: ${nombre_nouveaux}`,
        metadata: { bus_center_id: data.id },
      }));
      await supabaseAdmin.from("notifications").insert(notifications);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erreur lors de l'enregistrement" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
