import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller is superadministrador
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check superadmin role
    const { data: perfil } = await supabaseAdmin
      .from("perfiles")
      .select("rol_id, roles!inner(nombre)")
      .eq("id", userId)
      .single();

    const rolNombre = (perfil as any)?.roles?.nombre;
    if (rolNombre !== "superadministrador") {
      return new Response(
        JSON.stringify({ error: "Solo el superadministrador puede gestionar roles" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action } = body;

    // =================== CREATE ===================
    if (action === "create") {
      const { nombre, descripcion, permisos } = body;
      if (!nombre?.trim()) {
        return new Response(
          JSON.stringify({ error: "El nombre del rol es obligatorio" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
        return new Response(
          JSON.stringify({ error: msg }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert permissions
      if (permisos?.length > 0) {
        const rows = permisos.map((p: any) => ({
          rol_id: newRol.id,
          modulo: p.modulo,
          accion: p.accion,
        }));
        await supabaseAdmin.from("rol_permisos").insert(rows);
      }

      return new Response(
        JSON.stringify({ id: newRol.id, message: "Rol creado exitosamente" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =================== UPDATE ===================
    if (action === "update") {
      const { id, nombre, descripcion, permisos } = body;
      if (!id) {
        return new Response(
          JSON.stringify({ error: "ID del rol es obligatorio" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if system role - can't rename
      const { data: existingRol } = await supabaseAdmin
        .from("roles")
        .select("es_sistema, nombre")
        .eq("id", id)
        .single();

      if (existingRol?.es_sistema && nombre && nombre !== existingRol.nombre) {
        return new Response(
          JSON.stringify({ error: "No se puede renombrar un rol del sistema" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update role details
      const updateData: any = {};
      if (nombre && !existingRol?.es_sistema) updateData.nombre = nombre.trim();
      if (descripcion !== undefined) updateData.descripcion = descripcion;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from("roles")
          .update(updateData)
          .eq("id", id);
        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Replace permissions (not for superadministrador which has implicit all)
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

      return new Response(
        JSON.stringify({ message: "Rol actualizado exitosamente" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =================== DELETE ===================
    if (action === "delete") {
      const { id } = body;

      const { data: rol } = await supabaseAdmin
        .from("roles")
        .select("es_sistema, nombre")
        .eq("id", id)
        .single();

      if (rol?.es_sistema) {
        return new Response(
          JSON.stringify({ error: "No se puede eliminar un rol del sistema" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if users are assigned
      const { count } = await supabaseAdmin
        .from("perfiles")
        .select("id", { count: "exact", head: true })
        .eq("rol_id", id);

      if (count && count > 0) {
        return new Response(
          JSON.stringify({ error: `No se puede eliminar: hay ${count} usuario(s) asignado(s) a este rol. Reasígnelos primero.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: deleteError } = await supabaseAdmin
        .from("roles")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Rol eliminado exitosamente" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =================== ASSIGN ROLE TO USER ===================
    if (action === "assign-role-to-user") {
      const { userId: targetUserId, rolId } = body;

      // Validate role exists
      const { data: rol } = await supabaseAdmin
        .from("roles")
        .select("id")
        .eq("id", rolId)
        .single();

      if (!rol) {
        return new Response(
          JSON.stringify({ error: "El rol especificado no existe" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: assignError } = await supabaseAdmin
        .from("perfiles")
        .update({ rol_id: rolId })
        .eq("id", targetUserId);

      if (assignError) {
        return new Response(
          JSON.stringify({ error: assignError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Rol asignado exitosamente" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Acción no reconocida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
