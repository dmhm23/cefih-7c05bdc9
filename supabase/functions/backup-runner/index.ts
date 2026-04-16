// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Orden topológico para insertar/borrar (reverso = borrar primero)
const TABLAS_BACKUP = [
  // Catálogos / sin dependencias
  "roles",
  "rol_permisos",
  "perfiles",
  "cargos",
  "personal",
  "personal_adjuntos",
  "personas",
  "empresas",
  "contactos_empresa",
  "responsables_pago",
  "niveles_formacion",
  "curso_consecutivos",
  "cursos",
  "cursos_fechas_mintrabajo",
  "cursos_mintrabajo_adjuntos",
  // Formatos / plantillas
  "formatos_formacion",
  "plantillas_certificado",
  "plantilla_certificado_versiones",
  "portal_config_documentos",
  // Negocio
  "matriculas",
  "documentos_matricula",
  "documentos_portal",
  "firmas_matricula",
  "formato_respuestas",
  "certificados",
  "excepciones_certificado",
  // Cartera
  "grupos_cartera",
  "grupo_cartera_matriculas",
  "facturas",
  "factura_matriculas",
  "pagos",
  "actividades_cartera",
  // Comentarios y auditoría
  "comentarios",
  "audit_logs",
];

const BUCKETS = [
  "firmas",
  "documentos-matricula",
  "adjuntos-personal",
  "facturas",
  "certificados",
  "logos-formatos",
  "adjuntos-mintrabajo",
];

const PAGE_SIZE = 1000;

async function fetchAllRows(supabase: any, tabla: string) {
  const rows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(tabla)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`[${tabla}] ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

async function listAllObjects(supabase: any, bucket: string, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw new Error(`storage list ${bucket}/${prefix}: ${error.message}`);
  if (!data) return out;
  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null || (item.metadata == null && !item.name.includes("."))) {
      // Carpeta
      const sub = await listAllObjects(supabase, bucket, fullPath);
      out.push(...sub);
    } else {
      out.push(fullPath);
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Validar JWT y rol superadmin
  const authHeader = req.headers.get("Authorization");
  let userId: string | null = null;
  let userEmail: string | null = null;
  let origen: "manual" | "programado" = "manual";

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    // Si es service_role (cron), permitir como programado
    if (token === SERVICE_KEY) {
      origen = "programado";
    } else {
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
      userId = claims.claims.sub as string;
      userEmail = (claims.claims.email as string) ?? null;

      // Verificar rol
      const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data: perfil } = await adminClient
        .from("perfiles")
        .select("rol_id, roles(nombre)")
        .eq("id", userId)
        .maybeSingle();
      const rol = (perfil as any)?.roles?.nombre;
      if (rol !== "superadministrador") {
        return new Response(JSON.stringify({ error: "Forbidden: requires superadministrador" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  } else {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const alcance: "db_only" | "completo" = body.alcance === "db_only" ? "db_only" : "completo";
  const scheduleId: string | null = body.schedule_id ?? null;

  // Crear fila inicial
  const { data: backupRow, error: insertErr } = await admin
    .from("system_backups")
    .insert({
      alcance,
      origen,
      estado: "en_progreso",
      schedule_id: scheduleId,
      created_by: userId,
      created_by_email: userEmail,
    })
    .select()
    .single();

  if (insertErr || !backupRow) {
    const msg = insertErr?.message ?? "No se pudo crear el backup";
    // Si fue por unique index (ya hay uno en progreso), responder claro
    return new Response(JSON.stringify({ error: msg }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const backupId = backupRow.id as string;

  // Procesar en background
  const task = (async () => {
    try {
      const zip = new JSZip();
      const tablasMeta: Array<{ nombre: string; conteo: number }> = [];
      let totalFilas = 0;
      let dbBytes = 0;

      for (const tabla of TABLAS_BACKUP) {
        try {
          const rows = await fetchAllRows(admin, tabla);
          const json = JSON.stringify(rows);
          zip.file(`data/${tabla}.json`, json);
          dbBytes += new Blob([json]).size;
          tablasMeta.push({ nombre: tabla, conteo: rows.length });
          totalFilas += rows.length;
        } catch (err) {
          tablasMeta.push({ nombre: tabla, conteo: -1 });
          console.error(`[backup] tabla ${tabla}:`, (err as Error).message);
        }
        // Pequeña pausa para no saturar
        await new Promise((r) => setTimeout(r, 30));
      }

      let archivosCount = 0;
      let filesBytes = 0;

      if (alcance === "completo") {
        for (const bucket of BUCKETS) {
          try {
            const paths = await listAllObjects(admin, bucket);
            for (const p of paths) {
              try {
                const { data: file, error: dlErr } = await admin.storage.from(bucket).download(p);
                if (dlErr || !file) continue;
                const buf = new Uint8Array(await file.arrayBuffer());
                zip.file(`files/${bucket}/${p}`, buf);
                filesBytes += buf.byteLength;
                archivosCount++;
              } catch (e) {
                console.warn(`[backup] file ${bucket}/${p}:`, (e as Error).message);
              }
            }
          } catch (e) {
            console.warn(`[backup] bucket ${bucket}:`, (e as Error).message);
          }
        }
      }

      const manifest = {
        version: 1,
        created_at: new Date().toISOString(),
        alcance,
        origen,
        tablas: tablasMeta,
        buckets_incluidos: alcance === "completo" ? BUCKETS : [],
        totales: {
          tablas: tablasMeta.length,
          filas: totalFilas,
          archivos: archivosCount,
          db_bytes: dbBytes,
          files_bytes: filesBytes,
        },
      };

      zip.file("manifest.json", JSON.stringify(manifest, null, 2));

      const zipBuf = await zip.generateAsync({
        type: "uint8array",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
      const fname = `backup_${now.toISOString().replace(/[:.]/g, "-")}_${backupId}.zip`;
      const storagePath = `${yyyy}/${mm}/${fname}`;

      const { error: upErr } = await admin.storage
        .from("system-backups")
        .upload(storagePath, zipBuf, {
          contentType: "application/zip",
          upsert: false,
        });

      if (upErr) throw new Error(`upload: ${upErr.message}`);

      await admin
        .from("system_backups")
        .update({
          estado: "completado",
          storage_path: storagePath,
          tamano_bytes: zipBuf.byteLength,
          tamano_db_bytes: dbBytes,
          tamano_files_bytes: filesBytes,
          tablas_count: tablasMeta.length,
          filas_count: totalFilas,
          archivos_count: archivosCount,
          manifest,
          completed_at: new Date().toISOString(),
        })
        .eq("id", backupId);
    } catch (err) {
      console.error("[backup] FAILED:", err);
      await admin
        .from("system_backups")
        .update({
          estado: "fallido",
          error_msg: (err as Error).message ?? "Error desconocido",
          completed_at: new Date().toISOString(),
        })
        .eq("id", backupId);
    }
  })();

  // Ejecutar en background sin bloquear la respuesta
  // @ts-ignore - EdgeRuntime existe en Supabase
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(task);
  } else {
    // Fallback: esperar
    await task;
  }

  return new Response(
    JSON.stringify({ backup_id: backupId, estado: "en_progreso" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 202 },
  );
});
