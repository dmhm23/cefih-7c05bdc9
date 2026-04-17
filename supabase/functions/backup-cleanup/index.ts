// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Sin auth: este endpoint solo se invoca desde pg_cron con service role.
  // Validamos que viene con service role para evitar abuso público.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.includes(SERVICE_KEY)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resumen: any[] = [];

  // Schedules activos con retención
  const { data: schedules } = await admin
    .from("system_backup_schedules")
    .select("id, nombre, retener_n_ultimos")
    .eq("activo", true)
    .gt("retener_n_ultimos", 0);

  for (const s of schedules ?? []) {
    const { data: backups } = await admin
      .from("system_backups")
      .select("id, storage_path, created_at")
      .eq("schedule_id", s.id)
      .eq("estado", "completado")
      .order("created_at", { ascending: false });

    const sobrantes = (backups ?? []).slice(s.retener_n_ultimos);
    let eliminados = 0;
    for (const b of sobrantes) {
      try {
        if (b.storage_path) {
          await admin.storage.from("system-backups").remove([b.storage_path]);
        }
        await admin.from("system_backups").delete().eq("id", b.id);
        eliminados++;
      } catch (e) {
        console.warn(`[cleanup] backup ${b.id}:`, (e as Error).message);
      }
    }
    resumen.push({ schedule: s.nombre, eliminados, retenidos: s.retener_n_ultimos });
  }

  return new Response(JSON.stringify({ ok: true, resumen }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
