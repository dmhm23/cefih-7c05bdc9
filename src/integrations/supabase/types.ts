export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          accion: Database["public"]["Enums"]["tipo_accion_audit"]
          campos_modificados: string[] | null
          created_at: string
          entidad_id: string
          entidad_tipo: Database["public"]["Enums"]["tipo_entidad_audit"]
          id: string
          metadata: Json | null
          usuario_id: string | null
          usuario_nombre: string | null
          valor_anterior: Json | null
          valor_nuevo: Json | null
        }
        Insert: {
          accion: Database["public"]["Enums"]["tipo_accion_audit"]
          campos_modificados?: string[] | null
          created_at?: string
          entidad_id: string
          entidad_tipo: Database["public"]["Enums"]["tipo_entidad_audit"]
          id?: string
          metadata?: Json | null
          usuario_id?: string | null
          usuario_nombre?: string | null
          valor_anterior?: Json | null
          valor_nuevo?: Json | null
        }
        Update: {
          accion?: Database["public"]["Enums"]["tipo_accion_audit"]
          campos_modificados?: string[] | null
          created_at?: string
          entidad_id?: string
          entidad_tipo?: Database["public"]["Enums"]["tipo_entidad_audit"]
          id?: string
          metadata?: Json | null
          usuario_id?: string | null
          usuario_nombre?: string | null
          valor_anterior?: Json | null
          valor_nuevo?: Json | null
        }
        Relationships: []
      }
      cargos: {
        Row: {
          activo: boolean
          created_at: string
          deleted_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_cargo"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_cargo"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["tipo_cargo"]
          updated_at?: string
        }
        Relationships: []
      }
      cursos: {
        Row: {
          activo: boolean
          capacidad_maxima: number
          created_at: string
          deleted_at: string | null
          entrenador_id: string | null
          estado: Database["public"]["Enums"]["estado_curso"]
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          lugar: string | null
          nivel_formacion_id: string | null
          nombre: string
          observaciones: string | null
          supervisor_id: string | null
          tipo_formacion: Database["public"]["Enums"]["tipo_formacion"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          capacidad_maxima?: number
          created_at?: string
          deleted_at?: string | null
          entrenador_id?: string | null
          estado?: Database["public"]["Enums"]["estado_curso"]
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          lugar?: string | null
          nivel_formacion_id?: string | null
          nombre?: string
          observaciones?: string | null
          supervisor_id?: string | null
          tipo_formacion: Database["public"]["Enums"]["tipo_formacion"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          capacidad_maxima?: number
          created_at?: string
          deleted_at?: string | null
          entrenador_id?: string | null
          estado?: Database["public"]["Enums"]["estado_curso"]
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          lugar?: string | null
          nivel_formacion_id?: string | null
          nombre?: string
          observaciones?: string | null
          supervisor_id?: string | null
          tipo_formacion?: Database["public"]["Enums"]["tipo_formacion"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_entrenador_id_fkey"
            columns: ["entrenador_id"]
            isOneToOne: false
            referencedRelation: "personal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_nivel_formacion_id_fkey"
            columns: ["nivel_formacion_id"]
            isOneToOne: false
            referencedRelation: "niveles_formacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "personal"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos_fechas_mintrabajo: {
        Row: {
          created_at: string
          created_by: string | null
          curso_id: string
          fecha: string
          id: string
          motivo: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          curso_id: string
          fecha: string
          id?: string
          motivo?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          curso_id?: string
          fecha?: string
          id?: string
          motivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_fechas_mintrabajo_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          activo: boolean
          arl: Database["public"]["Enums"]["arl_enum"] | null
          ciudad: string | null
          created_at: string
          deleted_at: string | null
          departamento: string | null
          direccion: string | null
          email_contacto: string
          id: string
          nit: string
          nombre_empresa: string
          observaciones: string | null
          persona_contacto: string
          sector_economico:
            | Database["public"]["Enums"]["sector_economico"]
            | null
          telefono_contacto: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          arl?: Database["public"]["Enums"]["arl_enum"] | null
          ciudad?: string | null
          created_at?: string
          deleted_at?: string | null
          departamento?: string | null
          direccion?: string | null
          email_contacto?: string
          id?: string
          nit: string
          nombre_empresa: string
          observaciones?: string | null
          persona_contacto?: string
          sector_economico?:
            | Database["public"]["Enums"]["sector_economico"]
            | null
          telefono_contacto?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          arl?: Database["public"]["Enums"]["arl_enum"] | null
          ciudad?: string | null
          created_at?: string
          deleted_at?: string | null
          departamento?: string | null
          direccion?: string | null
          email_contacto?: string
          id?: string
          nit?: string
          nombre_empresa?: string
          observaciones?: string | null
          persona_contacto?: string
          sector_economico?:
            | Database["public"]["Enums"]["sector_economico"]
            | null
          telefono_contacto?: string
          updated_at?: string
        }
        Relationships: []
      }
      niveles_formacion: {
        Row: {
          activo: boolean
          campos_adicionales: Json | null
          config_codigo_estudiante: Json | null
          created_at: string
          deleted_at: string | null
          descripcion: string | null
          documentos_requeridos: string[] | null
          duracion_horas: number
          id: string
          nombre: string
          tipo_formacion: Database["public"]["Enums"]["tipo_formacion"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          campos_adicionales?: Json | null
          config_codigo_estudiante?: Json | null
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          documentos_requeridos?: string[] | null
          duracion_horas?: number
          id?: string
          nombre: string
          tipo_formacion: Database["public"]["Enums"]["tipo_formacion"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          campos_adicionales?: Json | null
          config_codigo_estudiante?: Json | null
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          documentos_requeridos?: string[] | null
          duracion_horas?: number
          id?: string
          nombre?: string
          tipo_formacion?: Database["public"]["Enums"]["tipo_formacion"]
          updated_at?: string
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nombres: string | null
          rol: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nombres?: string | null
          rol?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nombres?: string | null
          rol?: string
        }
        Relationships: []
      }
      personal: {
        Row: {
          activo: boolean
          apellidos: string
          cargo_id: string
          created_at: string
          deleted_at: string | null
          email: string | null
          firma_storage_path: string | null
          id: string
          nombres: string
          numero_documento: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellidos: string
          cargo_id: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          firma_storage_path?: string | null
          id?: string
          nombres: string
          numero_documento: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellidos?: string
          cargo_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          firma_storage_path?: string | null
          id?: string
          nombres?: string
          numero_documento?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_adjuntos: {
        Row: {
          created_at: string
          fecha_carga: string
          id: string
          nombre: string
          personal_id: string
          storage_path: string
          tamano: number | null
          tipo_mime: string | null
        }
        Insert: {
          created_at?: string
          fecha_carga?: string
          id?: string
          nombre: string
          personal_id: string
          storage_path: string
          tamano?: number | null
          tipo_mime?: string | null
        }
        Update: {
          created_at?: string
          fecha_carga?: string
          id?: string
          nombre?: string
          personal_id?: string
          storage_path?: string
          tamano?: number | null
          tipo_mime?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_adjuntos_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "personal"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          activo: boolean
          apellidos: string
          contacto_emergencia: Json | null
          created_at: string
          deleted_at: string | null
          email: string
          fecha_nacimiento: string | null
          firma_storage_path: string | null
          genero: Database["public"]["Enums"]["genero"] | null
          id: string
          nivel_educativo: Database["public"]["Enums"]["nivel_educativo"] | null
          nombres: string
          numero_documento: string
          observaciones: string | null
          telefono: string
          tipo_documento: Database["public"]["Enums"]["tipo_documento_identidad"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellidos: string
          contacto_emergencia?: Json | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          fecha_nacimiento?: string | null
          firma_storage_path?: string | null
          genero?: Database["public"]["Enums"]["genero"] | null
          id?: string
          nivel_educativo?:
            | Database["public"]["Enums"]["nivel_educativo"]
            | null
          nombres: string
          numero_documento: string
          observaciones?: string | null
          telefono?: string
          tipo_documento?: Database["public"]["Enums"]["tipo_documento_identidad"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellidos?: string
          contacto_emergencia?: Json | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          fecha_nacimiento?: string | null
          firma_storage_path?: string | null
          genero?: Database["public"]["Enums"]["genero"] | null
          id?: string
          nivel_educativo?:
            | Database["public"]["Enums"]["nivel_educativo"]
            | null
          nombres?: string
          numero_documento?: string
          observaciones?: string | null
          telefono?: string
          tipo_documento?: Database["public"]["Enums"]["tipo_documento_identidad"]
          updated_at?: string
        }
        Relationships: []
      }
      tarifas_empresa: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          nivel_formacion_id: string
          observaciones: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          nivel_formacion_id: string
          observaciones?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          nivel_formacion_id?: string
          observaciones?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_tarifas_nivel_formacion"
            columns: ["nivel_formacion_id"]
            isOneToOne: false
            referencedRelation: "niveles_formacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarifas_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_rol: { Args: never; Returns: string }
    }
    Enums: {
      arl_enum:
        | "sura"
        | "positiva"
        | "colmena"
        | "bolivar"
        | "axa_colpatria"
        | "liberty"
        | "equidad"
        | "alfa"
        | "aurora"
        | "otra"
      categoria_formato:
        | "formacion"
        | "evaluacion"
        | "asistencia"
        | "pta_ats"
        | "personalizado"
      estado_certificado: "elegible" | "generado" | "bloqueado" | "revocado"
      estado_curso: "programado" | "en_curso" | "cerrado" | "cancelado"
      estado_documento_matricula: "pendiente" | "cargado"
      estado_excepcion_certificado: "pendiente" | "aprobada" | "rechazada"
      estado_factura: "pendiente" | "parcial" | "pagada"
      estado_formato: "borrador" | "activo" | "archivado"
      estado_grupo_cartera:
        | "pendiente"
        | "parcial"
        | "pagado"
        | "vencido"
        | "anulado"
      estado_matricula:
        | "creada"
        | "pendiente"
        | "completa"
        | "certificada"
        | "cerrada"
      genero: "masculino" | "femenino" | "otro"
      metodo_pago:
        | "transferencia_bancaria"
        | "efectivo"
        | "consignacion"
        | "nequi"
        | "daviplata"
        | "bre_b"
        | "corresponsal_bancario"
        | "otro"
      nivel_educativo:
        | "primaria"
        | "secundaria"
        | "tecnico"
        | "tecnologo"
        | "profesional"
        | "especializacion"
        | "maestria"
        | "doctorado"
        | "ninguno"
        | "otro"
      scope_formato: "nivel_formacion" | "tipo_curso"
      seccion_comentario: "cartera" | "observaciones" | "curso_observaciones"
      sector_economico:
        | "construccion"
        | "telecomunicaciones"
        | "energia"
        | "petroleo_gas"
        | "manufactura"
        | "mineria"
        | "servicios"
        | "otro"
      tipo_accion_audit: "crear" | "editar" | "eliminar" | "cambio_estado"
      tipo_actividad_cartera: "nota" | "llamada" | "correo" | "sistema"
      tipo_cargo:
        | "entrenador"
        | "supervisor"
        | "administrativo"
        | "instructor"
        | "otro"
      tipo_documento_identidad:
        | "cedula_ciudadania"
        | "cedula_extranjeria"
        | "pasaporte"
        | "tarjeta_identidad"
        | "pep"
      tipo_documento_matricula:
        | "cedula"
        | "certificado_eps"
        | "certificado_arl"
        | "certificado_pension"
        | "examen_medico"
        | "certificado_alturas"
        | "carta_autorizacion"
        | "otro"
      tipo_entidad_audit:
        | "persona"
        | "empresa"
        | "tarifa_empresa"
        | "curso"
        | "nivel_formacion"
        | "matricula"
        | "documento_matricula"
        | "personal"
        | "cargo"
        | "formato"
        | "version_formato"
        | "certificado"
        | "grupo_cartera"
        | "factura"
        | "pago"
        | "comentario"
      tipo_formacion:
        | "formacion_inicial"
        | "reentrenamiento"
        | "jefe_area"
        | "coordinador_alturas"
      tipo_vinculacion: "empresa" | "independiente" | "arl"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      arl_enum: [
        "sura",
        "positiva",
        "colmena",
        "bolivar",
        "axa_colpatria",
        "liberty",
        "equidad",
        "alfa",
        "aurora",
        "otra",
      ],
      categoria_formato: [
        "formacion",
        "evaluacion",
        "asistencia",
        "pta_ats",
        "personalizado",
      ],
      estado_certificado: ["elegible", "generado", "bloqueado", "revocado"],
      estado_curso: ["programado", "en_curso", "cerrado", "cancelado"],
      estado_documento_matricula: ["pendiente", "cargado"],
      estado_excepcion_certificado: ["pendiente", "aprobada", "rechazada"],
      estado_factura: ["pendiente", "parcial", "pagada"],
      estado_formato: ["borrador", "activo", "archivado"],
      estado_grupo_cartera: [
        "pendiente",
        "parcial",
        "pagado",
        "vencido",
        "anulado",
      ],
      estado_matricula: [
        "creada",
        "pendiente",
        "completa",
        "certificada",
        "cerrada",
      ],
      genero: ["masculino", "femenino", "otro"],
      metodo_pago: [
        "transferencia_bancaria",
        "efectivo",
        "consignacion",
        "nequi",
        "daviplata",
        "bre_b",
        "corresponsal_bancario",
        "otro",
      ],
      nivel_educativo: [
        "primaria",
        "secundaria",
        "tecnico",
        "tecnologo",
        "profesional",
        "especializacion",
        "maestria",
        "doctorado",
        "ninguno",
        "otro",
      ],
      scope_formato: ["nivel_formacion", "tipo_curso"],
      seccion_comentario: ["cartera", "observaciones", "curso_observaciones"],
      sector_economico: [
        "construccion",
        "telecomunicaciones",
        "energia",
        "petroleo_gas",
        "manufactura",
        "mineria",
        "servicios",
        "otro",
      ],
      tipo_accion_audit: ["crear", "editar", "eliminar", "cambio_estado"],
      tipo_actividad_cartera: ["nota", "llamada", "correo", "sistema"],
      tipo_cargo: [
        "entrenador",
        "supervisor",
        "administrativo",
        "instructor",
        "otro",
      ],
      tipo_documento_identidad: [
        "cedula_ciudadania",
        "cedula_extranjeria",
        "pasaporte",
        "tarjeta_identidad",
        "pep",
      ],
      tipo_documento_matricula: [
        "cedula",
        "certificado_eps",
        "certificado_arl",
        "certificado_pension",
        "examen_medico",
        "certificado_alturas",
        "carta_autorizacion",
        "otro",
      ],
      tipo_entidad_audit: [
        "persona",
        "empresa",
        "tarifa_empresa",
        "curso",
        "nivel_formacion",
        "matricula",
        "documento_matricula",
        "personal",
        "cargo",
        "formato",
        "version_formato",
        "certificado",
        "grupo_cartera",
        "factura",
        "pago",
        "comentario",
      ],
      tipo_formacion: [
        "formacion_inicial",
        "reentrenamiento",
        "jefe_area",
        "coordinador_alturas",
      ],
      tipo_vinculacion: ["empresa", "independiente", "arl"],
    },
  },
} as const
