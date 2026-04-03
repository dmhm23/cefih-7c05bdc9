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
        JSON.stringify({ error: "No tienes permisos de superadministrador" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, nombres, rol_id } = await req.json();
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email y contraseña son obligatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate rol_id exists if provided
    const targetRolId = rol_id || "a0000000-0000-0000-0000-000000000002"; // default: administrador
    const { data: rolCheck } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("id", targetRolId)
      .single();

    if (!rolCheck) {
      return new Response(
        JSON.stringify({ error: "El rol especificado no existe" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombres: nombres || "", rol_id: targetRolId },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update perfil with correct rol_id and nombres
    if (newUser.user) {
      const updates: any = { rol_id: targetRolId };
      if (nombres) updates.nombres = nombres;
      await supabaseAdmin
        .from("perfiles")
        .update(updates)
        .eq("id", newUser.user.id);
    }

    return new Response(
      JSON.stringify({ id: newUser.user?.id, message: "Usuario creado exitosamente" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
