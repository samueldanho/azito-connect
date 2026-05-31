import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const KEEP_USER_ID = "REPLACED_AT_RUNTIME";
  const NEW_EMAIL = "admin@gmail.com";
  const NEW_PASSWORD = "admin123";

  // List all users
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) return new Response(JSON.stringify({ error: listErr.message }), { status: 500 });

  // Find berger
  const { data: bergerRows } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role", "berger");
  const bergerIds = new Set((bergerRows ?? []).map((r) => r.user_id));
  if (bergerIds.size === 0) {
    return new Response(JSON.stringify({ error: "Aucun berger trouvé" }), { status: 400 });
  }
  const bergerId = [...bergerIds][0];

  const deleted: string[] = [];
  for (const u of list.users) {
    if (bergerIds.has(u.id)) continue;
    await admin.from("user_roles").delete().eq("user_id", u.id);
    await admin.from("profiles").delete().eq("id", u.id);
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (!error) deleted.push(u.email ?? u.id);
  }

  // Update berger
  const { error: updErr } = await admin.auth.admin.updateUserById(bergerId, {
    email: NEW_EMAIL,
    password: NEW_PASSWORD,
    email_confirm: true,
  });
  if (updErr) return new Response(JSON.stringify({ error: updErr.message, deleted }), { status: 500 });

  await admin.from("profiles").update({ email: NEW_EMAIL }).eq("id", bergerId);

  return new Response(
    JSON.stringify({ ok: true, berger_id: bergerId, new_email: NEW_EMAIL, deleted }),
    { headers: { "Content-Type": "application/json" } }
  );
});
