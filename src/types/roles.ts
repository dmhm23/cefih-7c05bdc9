export interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  es_sistema: boolean;
  created_at: string;
  updated_at: string;
  usuarios_count?: number;
}

export interface RolPermiso {
  rol_id: string;
  modulo: string;
  accion: string;
}

export const MODULOS_CATALOGO = [
  { key: "dashboard", label: "Dashboard", acciones: ["ver"] },
  { key: "matriculas", label: "Matrículas", acciones: ["ver", "crear", "editar", "eliminar"] },
  { key: "cursos", label: "Cursos", acciones: ["ver", "crear", "editar", "eliminar"] },
  { key: "cartera", label: "Cartera", acciones: ["ver", "crear", "editar", "eliminar"] },
  { key: "personal", label: "Gestión de Personal", acciones: ["ver", "crear", "editar", "eliminar"] },
  { key: "formatos", label: "Gestión de Formatos", acciones: ["ver", "crear", "editar", "eliminar"] },
  { key: "niveles", label: "Niveles de Formación", acciones: ["ver", "crear", "editar", "eliminar"] },
  { key: "portal_estudiante", label: "Portal Estudiante", acciones: ["ver", "editar"] },
  { key: "personas", label: "Personas", acciones: ["ver", "crear", "editar", "eliminar"] },
  { key: "empresas", label: "Empresas", acciones: ["ver", "crear", "editar", "eliminar"] },
  { key: "certificacion", label: "Certificación", acciones: ["ver", "crear", "editar", "eliminar"] },
] as const;

export type ModuloKey = typeof MODULOS_CATALOGO[number]["key"];
export type AccionKey = "ver" | "crear" | "editar" | "eliminar";
