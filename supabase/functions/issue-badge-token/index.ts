import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const enc = new TextEncoder();

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(sig);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: uerr } = await supabase.auth.getUser();
    if (uerr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Only berger or responsable_service can issue
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
    const allowed = (roles ?? []).some((r: any) => r.role === "berger" || r.role === "responsable_service");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const memberId: string | undefined = body.member_id;
    let ttl: number = Number(body.ttl_seconds ?? 60 * 60 * 24 * 30); // default 30 days
    if (!memberId || !/^[0-9a-f-]{36}$/i.test(memberId)) {
      return new Response(JSON.stringify({ error: "member_id invalide" }), { status: 400, headers: corsHeaders });
    }
    ttl = Math.min(Math.max(ttl, 60), 60 * 60 * 24 * 365); // 1 min .. 1 year

    const secret = Deno.env.get("BADGE_SIGNING_SECRET");
    if (!secret) return new Response(JSON.stringify({ error: "Missing signing secret" }), { status: 500, headers: corsHeaders });

    const payload = {
      mid: memberId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + ttl,
      v: 1,
    };
    const payloadStr = b64url(enc.encode(JSON.stringify(payload)));
    const sig = await hmac(secret, payloadStr);
    const token = `BADGE.v1.${payloadStr}.${sig}`;

    return new Response(JSON.stringify({ token, exp: payload.exp }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
