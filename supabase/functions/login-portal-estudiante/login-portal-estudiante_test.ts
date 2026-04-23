// Tests para el RPC `login_portal_estudiante`.
//
// Verifica el fix del bug donde estudiantes con `nivel_formacion_id` asignado
// pero sin `curso_id` recibían `'sin_matricula'` en lugar de `'ok'`.
//
// Ejecutar desde Lovable con la herramienta supabase--test_edge_functions.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { assertEquals, assert, assertNotEquals } from "jsr:@std/assert@1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno de pruebas.",
  );
}

const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const RUN_ID = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const CEDULA_NIVEL_SIN_CURSO = `TPNC-${RUN_ID}`;
const CEDULA_SIN_NIVEL = `TPSN-${RUN_ID}`;
const CEDULA_INEXISTENTE = `NOEXISTE-${RUN_ID}`;

interface CreatedIds {
  personaConNivelId?: string;
  personaSinNivelId?: string;
  matriculaConNivelId?: string;
  matriculaSinNivelId?: string;
}

const created: CreatedIds = {};

async function getAlgunNivelId(): Promise<string | null> {
  const { data, error } = await admin
    .from("niveles_formacion")
    .select("id")
    .is("deleted_at", null)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function setup() {
  const nivelId = await getAlgunNivelId();
  if (!nivelId) {
    throw new Error(
      "No hay niveles_formacion activos en la BD. Crea al menos uno antes de correr este test.",
    );
  }

  // Persona A: con matrícula con nivel_formacion_id pero sin curso_id (caso del bug).
  const { data: pA, error: ePA } = await admin
    .from("personas")
    .insert({
      nombres: "Test Portal",
      apellidos: "Sin Curso",
      numero_documento: CEDULA_NIVEL_SIN_CURSO,
      tipo_documento: "cedula_ciudadania",
      email: `${CEDULA_NIVEL_SIN_CURSO.toLowerCase()}@test.local`,
      telefono: "0000000000",
      activo: true,
    })
    .select("id")
    .single();
  if (ePA) throw ePA;
  created.personaConNivelId = pA.id;

  const { data: mA, error: eMA } = await admin
    .from("matriculas")
    .insert({
      persona_id: pA.id,
      nivel_formacion_id: nivelId,
      curso_id: null,
      activo: true,
    })
    .select("id")
    .single();
  if (eMA) throw eMA;
  created.matriculaConNivelId = mA.id;

  // Persona B: con matrícula activa pero SIN nivel_formacion_id (regresión).
  const { data: pB, error: ePB } = await admin
    .from("personas")
    .insert({
      nombres: "Test Portal",
      apellidos: "Sin Nivel",
      numero_documento: CEDULA_SIN_NIVEL,
      tipo_documento: "cedula_ciudadania",
      email: `${CEDULA_SIN_NIVEL.toLowerCase()}@test.local`,
      telefono: "0000000000",
      activo: true,
    })
    .select("id")
    .single();
  if (ePB) throw ePB;
  created.personaSinNivelId = pB.id;

  const { data: mB, error: eMB } = await admin
    .from("matriculas")
    .insert({
      persona_id: pB.id,
      nivel_formacion_id: null,
      curso_id: null,
      activo: true,
    })
    .select("id")
    .single();
  if (eMB) throw eMB;
  created.matriculaSinNivelId = mB.id;
}

async function teardown() {
  // Hard-delete en orden inverso. Service role bypassa RLS.
  if (created.matriculaConNivelId) {
    await admin.from("matriculas").delete().eq("id", created.matriculaConNivelId);
  }
  if (created.matriculaSinNivelId) {
    await admin.from("matriculas").delete().eq("id", created.matriculaSinNivelId);
  }
  if (created.personaConNivelId) {
    await admin.from("personas").delete().eq("id", created.personaConNivelId);
  }
  if (created.personaSinNivelId) {
    await admin.from("personas").delete().eq("id", created.personaSinNivelId);
  }
}

Deno.test({
  name: "login_portal_estudiante: matrícula con nivel y sin curso retorna 'ok' (fix FOUND)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    await setup();
    try {
      await t.step("nivel sin curso → ok", async () => {
        const { data, error } = await admin.rpc("login_portal_estudiante", {
          p_cedula: CEDULA_NIVEL_SIN_CURSO,
        });
        assertEquals(error, null, `RPC error: ${JSON.stringify(error)}`);
        assert(Array.isArray(data) && data.length === 1, "Debe retornar exactamente 1 fila");
        const row = data[0];
        assertEquals(row.resultado, "ok", `Esperaba 'ok', recibí '${row.resultado}'`);
        assertNotEquals(row.matricula_id, null, "matricula_id no debe ser null");
        assertEquals(row.curso_id, null, "curso_id debe ser null en este caso");
        assert(
          typeof row.curso_nombre === "string" && row.curso_nombre.length > 0,
          "curso_nombre debe traer fallback (nivel o 'Portal del Estudiante')",
        );
        assertEquals(row.portal_habilitado, true);
      });

      await t.step("cédula inexistente → persona_no_encontrada", async () => {
        const { data, error } = await admin.rpc("login_portal_estudiante", {
          p_cedula: CEDULA_INEXISTENTE,
        });
        assertEquals(error, null);
        assertEquals(data?.[0]?.resultado, "persona_no_encontrada");
      });

      await t.step("matrícula activa sin nivel → sin_matricula", async () => {
        const { data, error } = await admin.rpc("login_portal_estudiante", {
          p_cedula: CEDULA_SIN_NIVEL,
        });
        assertEquals(error, null);
        assertEquals(data?.[0]?.resultado, "sin_matricula");
      });
    } finally {
      await teardown();
    }
  },
});
