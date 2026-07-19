import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const enc = new TextEncoder();

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacVerify(secret: string, data: string, sig: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const expected = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const a = new Uint8Array(expected);
  const b = b64urlDecode(sig);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ valid: false, reason: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ valid: false, reason: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const token: string = String(body.token ?? "");
    const parts = token.split(".");
    if (parts.length !== 4 || parts[0] !== "BADGE" || parts[1] !== "v1") {
      return new Response(JSON.stringify({ valid: false, reason: "Format invalide (badge non signé ou obsolète)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secret = Deno.env.get("BADGE_SIGNING_SECRET");
    if (!secret) return new Response(JSON.stringify({ valid: false, reason: "Config manquante" }), { status: 500, headers: corsHeaders });

    const [, , payloadStr, sig] = parts;
    const ok = await hmacVerify(secret, payloadStr, sig);
    if (!ok) {
      return new Response(JSON.stringify({ valid: false, reason: "Signature invalide" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: any;
    try {
      payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadStr)));
    } catch {
      return new Response(JSON.stringify({ valid: false, reason: "Payload illisible" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = Math.floor(Date.now() / 1000);
    if (!payload?.exp || payload.exp < now) {
      return new Response(JSON.stringify({ valid: false, reason: "Badge expiré" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!payload?.mid || !/^[0-9a-f-]{36}$/i.test(payload.mid)) {
      return new Response(JSON.stringify({ valid: false, reason: "Identifiant invalide" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ valid: true, member_id: payload.mid, exp: payload.exp }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ valid: false, reason: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
