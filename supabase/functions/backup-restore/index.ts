// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mismo orden topológico del runner (para insertar). Borrado = orden inverso.
const TABLAS_ORDEN = [
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
  "formatos_formacion",
  "plantillas_certificado",
  "plantilla_certificado_versiones",
  "portal_config_documentos",
  "matriculas",
  "documentos_matricula",
  "documentos_portal",
  "firmas_matricula",
  "formato_respuestas",
  "certificados",
  "excepciones_certificado",
  "grupos_cartera",
  "grupo_cartera_matriculas",
  "facturas",
  "factura_matriculas",
  "pagos",
  "actividades_cartera",
  "comentarios",
  "audit_logs",
];

// Tablas críticas: si faltan en el manifest (vs el proyecto actual), bloquear restauración
const TABLAS_CRITICAS = ["personas", "matriculas", "cursos", "niveles_formacion"];

// Tablas de Supabase Auth/sistema que NO debemos tocar nunca
const TABLAS_PROTEGIDAS = new Set(["roles", "perfiles"]);

const BUCKETS_VALIDOS = new Set([
  "firmas",
  "documentos-matricula",
  "adjuntos-personal",
  "facturas",
  "certificados",
  "logos-formatos",
  "adjuntos-mintrabajo",
]);

async function getColumnsByTable(admin: any): Promise<Record<string, Set<string>>> {
  // Trae 0 filas pero devuelve metadata vía select. Usamos un workaround: head + range 0..-1.
  const out: Record<string, Set<string>> = {};
  for (const t of TABLAS_ORDEN) {
    try {
      const { data, error } = await admin.from(t).select("*").limit(1);
      if (error) {
        out[t] = new Set();
        continue;
      }
      if (data && data.length > 0) {
        out[t] = new Set(Object.keys(data[0]));
      } else {
        // Tabla vacía: insertamos uno y lo borramos para descubrir columnas — no factible.
        // En su lugar, usaremos las claves del primer registro al insertar.
        out[t] = new Set();
      }
    } catch {
      out[t] = new Set();
    }
  }
  return out;
}

function sanitizeRow(row: any, allowedCols: Set<string>): any {
  if (!allowedCols || allowedCols.size === 0) return row; // sin info → confiar
  const clean: any = {};
  for (const k of Object.keys(row)) {
    if (allowedCols.has(k)) clean[k] = row[k];
  }
  return clean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
  const userEmail = (claims.claims.email as string) ?? null;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: perfil } = await admin
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

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const backupId: string = body.backup_id;
  const modo: "reemplazar" | "enriquecer" =
    body.modo === "reemplazar" ? "reemplazar" : "enriquecer";
  const incluirArchivos: boolean = body.incluir_archivos === true;
  const confirmacion: string = body.confirmacion_texto ?? "";
  const dryRun: boolean = body.dry_run === true;

  if (!backupId) {
    return new Response(JSON.stringify({ error: "backup_id requerido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!dryRun && modo === "reemplazar" && confirmacion !== "RESTAURAR") {
    return new Response(
      JSON.stringify({ error: 'Confirmación inválida. Escribe "RESTAURAR" para continuar.' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Cargar backup
  const { data: backupRow, error: bErr } = await admin
    .from("system_backups")
    .select("*")
    .eq("id", backupId)
    .maybeSingle();
  if (bErr || !backupRow || !backupRow.storage_path) {
    return new Response(JSON.stringify({ error: "Backup no encontrado o incompleto" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Descargar ZIP
  const { data: zipBlob, error: dlErr } = await admin.storage
    .from("system-backups")
    .download(backupRow.storage_path);
  if (dlErr || !zipBlob) {
    return new Response(JSON.stringify({ error: "No se pudo descargar el backup" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());

  // Manifest
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) {
    return new Response(JSON.stringify({ error: "manifest.json no encontrado en el backup" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const manifest = JSON.parse(await manifestFile.async("string"));

  // Schema diff
  const colsActual = await getColumnsByTable(admin);
  const tablasEnManifest = new Set<string>((manifest.tablas ?? []).map((t: any) => t.nombre));
  const tablasFaltantes: string[] = []; // en manifest pero no en proyecto actual
  const tablasExtras: string[] = []; // en proyecto actual pero no en manifest
  for (const t of tablasEnManifest) {
    if (!Object.prototype.hasOwnProperty.call(colsActual, t)) tablasFaltantes.push(t);
  }
  for (const t of TABLAS_ORDEN) {
    if (!tablasEnManifest.has(t)) tablasExtras.push(t);
  }
  const criticasFaltantes = tablasFaltantes.filter((t) => TABLAS_CRITICAS.includes(t));

  if (dryRun) {
    return new Response(
      JSON.stringify({
        backup_id: backupId,
        manifest_version: manifest.version ?? null,
        tablas_faltantes: tablasFaltantes,
        tablas_extras: tablasExtras,
        criticas_faltantes: criticasFaltantes,
        bloqueado: criticasFaltantes.length > 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  if (criticasFaltantes.length > 0) {
    return new Response(
      JSON.stringify({
        error: "Esquema incompatible: faltan tablas críticas",
        criticas_faltantes: criticasFaltantes,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Crear log de restauración
  const { data: logRow } = await admin
    .from("system_backup_restore_logs")
    .insert({
      backup_id: backupId,
      modo,
      estado: "en_progreso",
      incluyo_archivos: incluirArchivos,
      ejecutado_por: userId,
      ejecutado_por_email: userEmail,
    })
    .select()
    .single();
  const logId = logRow?.id;

  const tablasAfectadas: any[] = [];
  const errores: any[] = [];
  let filasInsertadas = 0;
  let filasOmitidas = 0;
  let archivosRestaurados = 0;

  // Procesar tablas
  // En modo reemplazar: borrar primero en orden inverso
  if (modo === "reemplazar") {
    for (const tabla of [...TABLAS_ORDEN].reverse()) {
      if (TABLAS_PROTEGIDAS.has(tabla)) continue;
      if (!Object.prototype.hasOwnProperty.call(colsActual, tabla)) continue;
      try {
        const { error } = await admin
          .from(tabla)
          .delete()
          .not("ctid", "is", null); // borrar todo
        // Algunos drivers no aceptan ctid; usar fallback con neq id
        if (error) {
          await admin.from(tabla).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        }
      } catch (e) {
        errores.push({ tabla, fase: "delete", error: (e as Error).message });
      }
    }
  }

  // Insertar en orden topológico
  for (const tabla of TABLAS_ORDEN) {
    if (TABLAS_PROTEGIDAS.has(tabla) && modo === "reemplazar") {
      // Para perfiles/roles: solo enriquecer (nunca reemplazar)
      // Continuamos con upsert ignoreDuplicates
    }
    const file = zip.file(`data/${tabla}.json`);
    if (!file) continue;
    let rows: any[] = [];
    try {
      rows = JSON.parse(await file.async("string"));
    } catch {
      errores.push({ tabla, fase: "parse", error: "JSON inválido" });
      continue;
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      tablasAfectadas.push({ tabla, filas: 0 });
      continue;
    }

    const allowed = colsActual[tabla] ?? new Set<string>();
    const cleanRows = rows.map((r) => sanitizeRow(r, allowed));

    // Insertar por lotes de 500
    let insertados = 0;
    let omitidos = 0;
    const BATCH = 500;
    for (let i = 0; i < cleanRows.length; i += BATCH) {
      const batch = cleanRows.slice(i, i + BATCH);
      try {
        if (modo === "enriquecer" || TABLAS_PROTEGIDAS.has(tabla)) {
          const { error, count } = await admin
            .from(tabla)
            .upsert(batch, { onConflict: "id", ignoreDuplicates: true, count: "exact" });
          if (error) {
            // Fallback fila a fila
            for (const row of batch) {
              const { error: e2 } = await admin
                .from(tabla)
                .upsert([row], { onConflict: "id", ignoreDuplicates: true });
              if (e2) {
                omitidos++;
                errores.push({ tabla, fase: "upsert", error: e2.message });
              } else {
                insertados++;
              }
            }
          } else {
            insertados += count ?? batch.length;
          }
        } else {
          // reemplazar: insert directo
          const { error } = await admin.from(tabla).insert(batch);
          if (error) {
            for (const row of batch) {
              const { error: e2 } = await admin.from(tabla).insert([row]);
              if (e2) {
                omitidos++;
                errores.push({ tabla, fase: "insert", error: e2.message });
              } else {
                insertados++;
              }
            }
          } else {
            insertados += batch.length;
          }
        }
      } catch (e) {
        omitidos += batch.length;
        errores.push({ tabla, fase: "batch", error: (e as Error).message });
      }
      await new Promise((r) => setTimeout(r, 20));
    }

    filasInsertadas += insertados;
    filasOmitidas += omitidos;
    tablasAfectadas.push({ tabla, insertadas: insertados, omitidas: omitidos });
  }

  // Restaurar archivos
  if (incluirArchivos) {
    const filesFolder = zip.folder("files");
    if (filesFolder) {
      const allFiles: { path: string; bucket: string; objectPath: string }[] = [];
      filesFolder.forEach((relativePath, fileEntry) => {
        if (fileEntry.dir) return;
        const parts = relativePath.split("/");
        const bucket = parts[0];
        const objectPath = parts.slice(1).join("/");
        if (!BUCKETS_VALIDOS.has(bucket)) return;
        allFiles.push({ path: `files/${relativePath}`, bucket, objectPath });
      });

      for (const f of allFiles) {
        try {
          const entry = zip.file(f.path);
          if (!entry) continue;
          const buf = new Uint8Array(await entry.async("uint8array"));
          const upsert = modo === "reemplazar";
          const { error } = await admin.storage
            .from(f.bucket)
            .upload(f.objectPath, buf, { upsert });
          if (error && !error.message?.includes("already exists")) {
            errores.push({ tabla: `storage:${f.bucket}`, fase: "upload", error: error.message });
          } else {
            archivosRestaurados++;
          }
        } catch (e) {
          errores.push({ tabla: `storage:${f.bucket}`, fase: "upload", error: (e as Error).message });
        }
      }
    }
  }

  const estadoFinal = errores.length === 0 ? "completado" : "parcial";

  if (logId) {
    await admin
      .from("system_backup_restore_logs")
      .update({
        estado: estadoFinal,
        tablas_afectadas: tablasAfectadas,
        filas_insertadas: filasInsertadas,
        filas_omitidas: filasOmitidas,
        archivos_restaurados: archivosRestaurados,
        errores: errores.slice(0, 200),
        completado_at: new Date().toISOString(),
      })
      .eq("id", logId);
  }

  return new Response(
    JSON.stringify({
      restore_log_id: logId,
      estado: estadoFinal,
      tablas_afectadas: tablasAfectadas.length,
      filas_insertadas: filasInsertadas,
      filas_omitidas: filasOmitidas,
      archivos_restaurados: archivosRestaurados,
      errores_count: errores.length,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
