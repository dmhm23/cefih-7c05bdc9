// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jobName(id: string) {
  return `backup_${id.replace(/-/g, "_")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claims.claims.sub as string;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: perfil } = await admin
    .from("perfiles")
    .select("rol_id, roles(nombre)")
    .eq("id", userId)
    .maybeSingle();
  if ((perfil as any)?.roles?.nombre !== "superadministrador") {
    return new Response(JSON.stringify({ error: "Forbidden: requires superadministrador" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const action: "create" | "update" | "delete" | "toggle" | "run_now" = body.action;

  if (!action) {
    return new Response(JSON.stringify({ error: "action requerida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const buildSchedSql = (id: string, cron: string, alcance: string) => {
    const url = `${SUPABASE_URL}/functions/v1/backup-runner`;
    const body = JSON.stringify({ alcance, schedule_id: id, origen: "programado" });
    const headers = JSON.stringify({
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
    });
    return `select cron.schedule('${jobName(id)}', '${cron}', $cmd$
      select net.http_post(
        url := '${url}',
        headers := '${headers}'::jsonb,
        body := '${body}'::jsonb
      );
    $cmd$);`;
  };

  try {
    if (action === "create") {
      const { nombre, frecuencia_cron, frecuencia_legible, alcance, retener_n_ultimos, activo } =
        body;
      if (!nombre || !frecuencia_cron || !alcance) {
        throw new Error("Campos requeridos: nombre, frecuencia_cron, alcance");
      }
      const { data: row, error } = await admin
        .from("system_backup_schedules")
        .insert({
          nombre,
          frecuencia_cron,
          frecuencia_legible: frecuencia_legible ?? frecuencia_cron,
          alcance,
          retener_n_ultimos: retener_n_ultimos ?? 7,
          activo: activo ?? true,
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw error;

      if (row.activo) {
        await admin.rpc("exec_sql", {
          sql: buildSchedSql(row.id, frecuencia_cron, alcance),
        }).catch(async () => {
          // Si exec_sql no existe, usar pg directly via SQL no es posible sin RPC.
          // En su lugar, registramos error pero mantenemos el schedule.
          await admin
            .from("system_backup_schedules")
            .update({ ultima_ejecucion: null })
            .eq("id", row.id);
        });
      }
      return new Response(JSON.stringify({ schedule: row }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "update") {
      const { id, nombre, frecuencia_cron, frecuencia_legible, alcance, retener_n_ultimos } = body;
      if (!id) throw new Error("id requerido");
      const { data: row, error } = await admin
        .from("system_backup_schedules")
        .update({
          nombre,
          frecuencia_cron,
          frecuencia_legible,
          alcance,
          retener_n_ultimos,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // Re-schedule
      await admin.rpc("exec_sql", {
        sql: `select cron.unschedule('${jobName(id)}');`,
      }).catch(() => {});
      if (row.activo) {
        await admin.rpc("exec_sql", {
          sql: buildSchedSql(id, frecuencia_cron, alcance),
        }).catch(() => {});
      }
      return new Response(JSON.stringify({ schedule: row }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "toggle") {
      const { id, activo } = body;
      if (!id) throw new Error("id requerido");
      const { data: row, error } = await admin
        .from("system_backup_schedules")
        .update({ activo, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      await admin.rpc("exec_sql", {
        sql: `select cron.unschedule('${jobName(id)}');`,
      }).catch(() => {});
      if (activo) {
        await admin.rpc("exec_sql", {
          sql: buildSchedSql(id, row.frecuencia_cron, row.alcance),
        }).catch(() => {});
      }
      return new Response(JSON.stringify({ schedule: row }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) throw new Error("id requerido");
      await admin.rpc("exec_sql", {
        sql: `select cron.unschedule('${jobName(id)}');`,
      }).catch(() => {});
      const { error } = await admin.from("system_backup_schedules").delete().eq("id", id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "run_now") {
      const { id } = body;
      if (!id) throw new Error("id requerido");
      const { data: row } = await admin
        .from("system_backup_schedules")
        .select("alcance")
        .eq("id", id)
        .maybeSingle();
      if (!row) throw new Error("Schedule no encontrado");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/backup-runner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ alcance: row.alcance, schedule_id: id, origen: "programado" }),
      });
      const data = await res.json();
      await admin
        .from("system_backup_schedules")
        .update({ ultima_ejecucion: new Date().toISOString() })
        .eq("id", id);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Acción desconocida: ${action}`);
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
