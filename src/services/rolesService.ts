import { supabase } from "@/integrations/supabase/client";
import type { Rol, RolPermiso } from "@/types/roles";

export const rolesService = {
  async getAll(): Promise<Rol[]> {
    const { data: roles, error } = await supabase
      .from("roles")
      .select("*")
      .order("es_sistema", { ascending: false })
      .order("nombre");

    if (error) throw error;

    // Get user counts per role
    const { data: perfiles } = await supabase
      .from("perfiles")
      .select("rol_id");

    const countMap: Record<string, number> = {};
    perfiles?.forEach((p: any) => {
      countMap[p.rol_id] = (countMap[p.rol_id] || 0) + 1;
    });

    return (roles as any[]).map((r) => ({
      ...r,
      usuarios_count: countMap[r.id] || 0,
    }));
  },

  async getPermisos(rolId: string): Promise<RolPermiso[]> {
    const { data, error } = await supabase
      .from("rol_permisos")
      .select("*")
      .eq("rol_id", rolId);

    if (error) throw error;
    return data as RolPermiso[];
  },

  async invokeGestionRoles(action: string, payload: any) {
    const { data, error } = await supabase.functions.invoke("admin-gestionar-roles", {
      body: { action, ...payload },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  },

  async createRol(nombre: string, descripcion: string, permisos: { modulo: string; accion: string }[]) {
    return this.invokeGestionRoles("create", { nombre, descripcion, permisos });
  },

  async updateRol(id: string, nombre: string, descripcion: string, permisos: { modulo: string; accion: string }[]) {
    return this.invokeGestionRoles("update", { id, nombre, descripcion, permisos });
  },

  async deleteRol(id: string) {
    return this.invokeGestionRoles("delete", { id });
  },

  async assignRoleToUser(userId: string, rolId: string) {
    return this.invokeGestionRoles("assign-role-to-user", { userId, rolId });
  },

  async getUsuarios() {
    const { data, error } = await supabase
      .from("perfiles")
      .select("id, email, nombres, rol_id, roles!inner(nombre)")
      .order("email");

    if (error) throw error;
    return (data as any[]).map((u) => ({
      id: u.id,
      email: u.email,
      nombres: u.nombres,
      rol_id: u.rol_id,
      rol_nombre: u.roles?.nombre || "",
    }));
  },
};
