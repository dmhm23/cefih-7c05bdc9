import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Role hierarchy: superadministrador > administrador > everything else
const ROLE_HIERARCHY: Record<string, number> = {
  superadministrador: 100,
  administrador: 50,
};

function getRoleLevel(roleName: string): number {
  return ROLE_HIERARCHY[roleName] ?? 0;
}

async function getTargetRole(supabaseAdmin: any, targetUserId: string) {
  const { data } = await supabaseAdmin
    .from("perfiles")
    .select("rol_id, roles!inner(nombre, es_sistema)")
    .eq("id", targetUserId)
    .single();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonRes({ error: "No autorizado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return jsonRes({ error: "Token inválido" }, 401);
    }

    const callerId = claimsData.user.id;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Get caller role
    const { data: perfil } = await supabaseAdmin
      .from("perfiles")
      .select("rol_id, roles!inner(nombre)")
      .eq("id", callerId)
      .single();

    const callerRoleName = (perfil as any)?.roles?.nombre;
    const callerLevel = getRoleLevel(callerRoleName);

    const body = await req.json();
    const { action } = body;

    // === ROLE MANAGEMENT ACTIONS (superadmin only) ===
    const roleManagementActions = ["create", "update", "delete"];
    if (roleManagementActions.includes(action)) {
      if (callerRoleName !== "superadministrador") {
        return jsonRes({ error: "Solo el superadministrador puede gestionar roles" }, 403);
      }
    }

    // === USER MANAGEMENT ACTIONS (superadmin + admin with hierarchy) ===
    const userManagementActions = ["assign-role-to-user", "update-user", "reset-password", "delete-user"];
    if (userManagementActions.includes(action)) {
      if (callerLevel < getRoleLevel("administrador")) {
        return jsonRes({ error: "No tiene permisos para gestionar usuarios" }, 403);
      }
    }

    // Helper: validate caller can operate on target user
    async function validateHierarchy(targetUserId: string) {
      if (targetUserId === callerId) {
        return "No puede realizar esta acción sobre su propia cuenta";
      }
      const targetData = await getTargetRole(supabaseAdmin, targetUserId);
      if (!targetData) return "Usuario objetivo no encontrado";
      const targetRoleName = (targetData as any)?.roles?.nombre;
      const targetLevel = getRoleLevel(targetRoleName);
      if (callerLevel <= targetLevel) {
        return `No tiene permisos para gestionar usuarios con rol "${targetRoleName}"`;
      }
      return null; // OK
    }

    // =================== CREATE ROLE ===================
    if (action === "create") {
      const { nombre, descripcion, permisos } = body;
      if (!nombre?.trim()) {
        return jsonRes({ error: "El nombre del rol es obligatorio" }, 400);
      }

      const { data: newRol, error: createError } = await supabaseAdmin
        .from("roles")
        .insert({ nombre: nombre.trim(), descripcion: descripcion || "" })
        .select()
        .single();

      if (createError) {
        const msg = createError.message.includes("duplicate")
          ? "Ya existe un rol con ese nombre"
          : createError.message;
        return jsonRes({ error: msg }, 400);
      }

      if (permisos?.length > 0) {
        const rows = permisos.map((p: any) => ({
          rol_id: newRol.id,
          modulo: p.modulo,
          accion: p.accion,
        }));
        await supabaseAdmin.from("rol_permisos").insert(rows);
      }

      return jsonRes({ id: newRol.id, message: "Rol creado exitosamente" });
    }

    // =================== UPDATE ROLE ===================
    if (action === "update") {
      const { id, nombre, descripcion, permisos } = body;
      if (!id) return jsonRes({ error: "ID del rol es obligatorio" }, 400);

      const { data: existingRol } = await supabaseAdmin
        .from("roles")
        .select("es_sistema, nombre")
        .eq("id", id)
        .single();

      if (existingRol?.es_sistema && nombre && nombre !== existingRol.nombre) {
        return jsonRes({ error: "No se puede renombrar un rol del sistema" }, 400);
      }

      const updateData: any = {};
      if (nombre && !existingRol?.es_sistema) updateData.nombre = nombre.trim();
      if (descripcion !== undefined) updateData.descripcion = descripcion;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from("roles")
          .update(updateData)
          .eq("id", id);
        if (updateError) return jsonRes({ error: updateError.message }, 400);
      }

      if (permisos !== undefined && existingRol?.nombre !== "superadministrador") {
        await supabaseAdmin.from("rol_permisos").delete().eq("rol_id", id);
        if (permisos.length > 0) {
          const rows = permisos.map((p: any) => ({
            rol_id: id,
            modulo: p.modulo,
            accion: p.accion,
          }));
          await supabaseAdmin.from("rol_permisos").insert(rows);
        }
      }

      return jsonRes({ message: "Rol actualizado exitosamente" });
    }

    // =================== DELETE ROLE ===================
    if (action === "delete") {
      const { id } = body;

      const { data: rol } = await supabaseAdmin
        .from("roles")
        .select("es_sistema, nombre")
        .eq("id", id)
        .single();

      if (rol?.es_sistema) {
        return jsonRes({ error: "No se puede eliminar un rol del sistema" }, 400);
      }

      const { count } = await supabaseAdmin
        .from("perfiles")
        .select("id", { count: "exact", head: true })
        .eq("rol_id", id);

      if (count && count > 0) {
        return jsonRes({
          error: `No se puede eliminar: hay ${count} usuario(s) asignado(s) a este rol. Reasígnelos primero.`,
        }, 400);
      }

      const { error: deleteError } = await supabaseAdmin
        .from("roles")
        .delete()
        .eq("id", id);

      if (deleteError) return jsonRes({ error: deleteError.message }, 400);
      return jsonRes({ message: "Rol eliminado exitosamente" });
    }

    // =================== ASSIGN ROLE TO USER ===================
    if (action === "assign-role-to-user") {
      const { userId: targetUserId, rolId } = body;

      const hierarchyError = await validateHierarchy(targetUserId);
      if (hierarchyError) return jsonRes({ error: hierarchyError }, 403);

      const { data: rol } = await supabaseAdmin
        .from("roles")
        .select("id, nombre")
        .eq("id", rolId)
        .single();

      if (!rol) return jsonRes({ error: "El rol especificado no existe" }, 400);

      // Admin cannot assign superadministrador or administrador roles
      if (callerRoleName === "administrador" && getRoleLevel(rol.nombre) >= callerLevel) {
        return jsonRes({ error: "No puede asignar un rol de nivel igual o superior al suyo" }, 403);
      }

      const { error: assignError } = await supabaseAdmin
        .from("perfiles")
        .update({ rol_id: rolId })
        .eq("id", targetUserId);

      if (assignError) return jsonRes({ error: assignError.message }, 400);
      return jsonRes({ message: "Rol asignado exitosamente" });
    }

    // =================== UPDATE USER ===================
    if (action === "update-user") {
      const { userId: targetUserId, nombres } = body;
      if (!targetUserId) return jsonRes({ error: "ID del usuario es obligatorio" }, 400);

      const hierarchyError = await validateHierarchy(targetUserId);
      if (hierarchyError) return jsonRes({ error: hierarchyError }, 403);

      const updateData: any = {};
      if (nombres !== undefined) updateData.nombres = nombres.trim();

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabaseAdmin
          .from("perfiles")
          .update(updateData)
          .eq("id", targetUserId);
        if (error) return jsonRes({ error: error.message }, 400);
      }

      return jsonRes({ message: "Usuario actualizado exitosamente" });
    }

    // =================== RESET PASSWORD ===================
    if (action === "reset-password") {
      const { userId: targetUserId } = body;
      if (!targetUserId) return jsonRes({ error: "ID del usuario es obligatorio" }, 400);

      const hierarchyError = await validateHierarchy(targetUserId);
      if (hierarchyError) return jsonRes({ error: hierarchyError }, 403);

      // Generate a temporary password
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
      let tempPassword = "";
      for (let i = 0; i < 12; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: tempPassword,
      });

      if (error) return jsonRes({ error: error.message }, 400);
      return jsonRes({ message: "Contraseña reiniciada exitosamente", tempPassword });
    }

    // =================== DELETE USER ===================
    if (action === "delete-user") {
      const { userId: targetUserId } = body;
      if (!targetUserId) return jsonRes({ error: "ID del usuario es obligatorio" }, 400);

      if (targetUserId === callerId) {
        return jsonRes({ error: "No puede eliminar su propia cuenta" }, 403);
      }

      const hierarchyError = await validateHierarchy(targetUserId);
      if (hierarchyError) return jsonRes({ error: hierarchyError }, 403);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (error) return jsonRes({ error: error.message }, 400);

      return jsonRes({ message: "Usuario eliminado exitosamente" });
    }

    return jsonRes({ error: "Acción no reconocida" }, 400);
  } catch (err) {
    const e = err as Error;
    console.error("[admin-gestionar-roles] Unhandled error:", e.message, e.stack);
    return jsonRes({ error: e.message || "Error interno", stack: e.stack }, 500);
  }
});
