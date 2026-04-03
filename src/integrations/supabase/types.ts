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
      actividades_cartera: {
        Row: {
          created_at: string
          descripcion: string
          factura_id: string | null
          fecha: string
          grupo_cartera_id: string
          id: string
          tipo: Database["public"]["Enums"]["tipo_actividad_cartera"]
          usuario: string | null
        }
        Insert: {
          created_at?: string
          descripcion?: string
          factura_id?: string | null
          fecha?: string
          grupo_cartera_id: string
          id?: string
          tipo: Database["public"]["Enums"]["tipo_actividad_cartera"]
          usuario?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          factura_id?: string | null
          fecha?: string
          grupo_cartera_id?: string
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_actividad_cartera"]
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actividades_cartera_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_cartera_grupo_cartera_id_fkey"
            columns: ["grupo_cartera_id"]
            isOneToOne: false
            referencedRelation: "grupos_cartera"
            referencedColumns: ["id"]
          },
        ]
      }
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
      certificados: {
        Row: {
          autorizado_excepcional: boolean
          codigo: string
          created_at: string
          curso_id: string
          estado: Database["public"]["Enums"]["estado_certificado"]
          fecha_generacion: string | null
          fecha_revocacion: string | null
          id: string
          matricula_id: string
          motivo_revocacion: string | null
          persona_id: string
          plantilla_id: string
          revocado_por: string | null
          snapshot_datos: Json
          svg_final: string
          updated_at: string
          version: number
        }
        Insert: {
          autorizado_excepcional?: boolean
          codigo: string
          created_at?: string
          curso_id: string
          estado?: Database["public"]["Enums"]["estado_certificado"]
          fecha_generacion?: string | null
          fecha_revocacion?: string | null
          id?: string
          matricula_id: string
          motivo_revocacion?: string | null
          persona_id: string
          plantilla_id: string
          revocado_por?: string | null
          snapshot_datos?: Json
          svg_final?: string
          updated_at?: string
          version?: number
        }
        Update: {
          autorizado_excepcional?: boolean
          codigo?: string
          created_at?: string
          curso_id?: string
          estado?: Database["public"]["Enums"]["estado_certificado"]
          fecha_generacion?: string | null
          fecha_revocacion?: string | null
          id?: string
          matricula_id?: string
          motivo_revocacion?: string | null
          persona_id?: string
          plantilla_id?: string
          revocado_por?: string | null
          snapshot_datos?: Json
          svg_final?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "certificados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_certificado"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          created_at: string
          editado_en: string | null
          entidad_id: string
          entidad_tipo: string
          id: string
          seccion: Database["public"]["Enums"]["seccion_comentario"]
          texto: string
          usuario_id: string | null
          usuario_nombre: string
        }
        Insert: {
          created_at?: string
          editado_en?: string | null
          entidad_id: string
          entidad_tipo: string
          id?: string
          seccion: Database["public"]["Enums"]["seccion_comentario"]
          texto: string
          usuario_id?: string | null
          usuario_nombre?: string
        }
        Update: {
          created_at?: string
          editado_en?: string | null
          entidad_id?: string
          entidad_tipo?: string
          id?: string
          seccion?: Database["public"]["Enums"]["seccion_comentario"]
          texto?: string
          usuario_id?: string | null
          usuario_nombre?: string
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
      documentos_matricula: {
        Row: {
          archivo_nombre: string | null
          archivo_tamano: number | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_documento_matricula"]
          fecha_carga: string | null
          fecha_documento: string | null
          fecha_inicio_cobertura: string | null
          id: string
          matricula_id: string
          nombre: string
          opcional: boolean
          storage_path: string | null
          tipo: Database["public"]["Enums"]["tipo_documento_matricula"]
        }
        Insert: {
          archivo_nombre?: string | null
          archivo_tamano?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_documento_matricula"]
          fecha_carga?: string | null
          fecha_documento?: string | null
          fecha_inicio_cobertura?: string | null
          id?: string
          matricula_id: string
          nombre: string
          opcional?: boolean
          storage_path?: string | null
          tipo?: Database["public"]["Enums"]["tipo_documento_matricula"]
        }
        Update: {
          archivo_nombre?: string | null
          archivo_tamano?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_documento_matricula"]
          fecha_carga?: string | null
          fecha_documento?: string | null
          fecha_inicio_cobertura?: string | null
          id?: string
          matricula_id?: string
          nombre?: string
          opcional?: boolean
          storage_path?: string | null
          tipo?: Database["public"]["Enums"]["tipo_documento_matricula"]
        }
        Relationships: [
          {
            foreignKeyName: "documentos_matricula_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_portal: {
        Row: {
          created_at: string
          documento_key: string
          enviado_en: string | null
          estado: Database["public"]["Enums"]["estado_doc_portal"]
          firma_data: string | null
          id: string
          intentos: Json
          matricula_id: string
          metadata: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          documento_key: string
          enviado_en?: string | null
          estado?: Database["public"]["Enums"]["estado_doc_portal"]
          firma_data?: string | null
          id?: string
          intentos?: Json
          matricula_id: string
          metadata?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          documento_key?: string
          enviado_en?: string | null
          estado?: Database["public"]["Enums"]["estado_doc_portal"]
          firma_data?: string | null
          id?: string
          intentos?: Json
          matricula_id?: string
          metadata?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_portal_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
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
      excepciones_certificado: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_excepcion_certificado"]
          fecha_resolucion: string | null
          fecha_solicitud: string
          id: string
          matricula_id: string
          motivo: string
          resuelto_por: string | null
          solicitado_por: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_excepcion_certificado"]
          fecha_resolucion?: string | null
          fecha_solicitud?: string
          id?: string
          matricula_id: string
          motivo: string
          resuelto_por?: string | null
          solicitado_por: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_excepcion_certificado"]
          fecha_resolucion?: string | null
          fecha_solicitud?: string
          id?: string
          matricula_id?: string
          motivo?: string
          resuelto_por?: string | null
          solicitado_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "excepciones_certificado_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      factura_matriculas: {
        Row: {
          factura_id: string
          matricula_id: string
          valor_asignado: number
        }
        Insert: {
          factura_id: string
          matricula_id: string
          valor_asignado?: number
        }
        Update: {
          factura_id?: string
          matricula_id?: string
          valor_asignado?: number
        }
        Relationships: [
          {
            foreignKeyName: "factura_matriculas_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factura_matriculas_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          archivo_factura: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_factura"]
          fecha_emision: string
          fecha_vencimiento: string | null
          grupo_cartera_id: string
          id: string
          numero_factura: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          archivo_factura?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          grupo_cartera_id: string
          id?: string
          numero_factura?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          archivo_factura?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_factura"]
          fecha_emision?: string
          fecha_vencimiento?: string | null
          grupo_cartera_id?: string
          id?: string
          numero_factura?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturas_grupo_cartera_id_fkey"
            columns: ["grupo_cartera_id"]
            isOneToOne: false
            referencedRelation: "grupos_cartera"
            referencedColumns: ["id"]
          },
        ]
      }
      formato_respuestas: {
        Row: {
          answers: Json
          completado_at: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_formato_respuesta"]
          formato_id: string
          id: string
          matricula_id: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          completado_at?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_formato_respuesta"]
          formato_id: string
          id?: string
          matricula_id: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          completado_at?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_formato_respuesta"]
          formato_id?: string
          id?: string
          matricula_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formato_respuestas_formato_id_fkey"
            columns: ["formato_id"]
            isOneToOne: false
            referencedRelation: "formatos_formacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formato_respuestas_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      formatos_formacion: {
        Row: {
          activo: boolean
          asignacion_scope: Database["public"]["Enums"]["scope_formato"]
          bloques: Json
          categoria: Database["public"]["Enums"]["categoria_formato"]
          codigo: string
          created_at: string
          css_template: string | null
          deleted_at: string | null
          descripcion: string
          document_meta: Json | null
          encabezado_config: Json | null
          es_automatico: boolean
          estado: Database["public"]["Enums"]["estado_formato"]
          html_template: string | null
          id: string
          legacy_component_id: string | null
          modo_diligenciamiento: string
          motor_render: Database["public"]["Enums"]["motor_render"]
          niveles_asignados: string[] | null
          nombre: string
          plantilla_base_id: string | null
          requiere_firma_aprendiz: boolean
          requiere_firma_entrenador: boolean
          requiere_firma_supervisor: boolean
          tipos_curso: Database["public"]["Enums"]["tipo_formacion"][] | null
          tokens_usados: string[] | null
          updated_at: string
          usa_encabezado_institucional: boolean
          version: string
          visible_en_curso: boolean
          visible_en_matricula: boolean
          visible_en_portal_estudiante: boolean
        }
        Insert: {
          activo?: boolean
          asignacion_scope?: Database["public"]["Enums"]["scope_formato"]
          bloques?: Json
          categoria?: Database["public"]["Enums"]["categoria_formato"]
          codigo?: string
          created_at?: string
          css_template?: string | null
          deleted_at?: string | null
          descripcion?: string
          document_meta?: Json | null
          encabezado_config?: Json | null
          es_automatico?: boolean
          estado?: Database["public"]["Enums"]["estado_formato"]
          html_template?: string | null
          id?: string
          legacy_component_id?: string | null
          modo_diligenciamiento?: string
          motor_render?: Database["public"]["Enums"]["motor_render"]
          niveles_asignados?: string[] | null
          nombre: string
          plantilla_base_id?: string | null
          requiere_firma_aprendiz?: boolean
          requiere_firma_entrenador?: boolean
          requiere_firma_supervisor?: boolean
          tipos_curso?: Database["public"]["Enums"]["tipo_formacion"][] | null
          tokens_usados?: string[] | null
          updated_at?: string
          usa_encabezado_institucional?: boolean
          version?: string
          visible_en_curso?: boolean
          visible_en_matricula?: boolean
          visible_en_portal_estudiante?: boolean
        }
        Update: {
          activo?: boolean
          asignacion_scope?: Database["public"]["Enums"]["scope_formato"]
          bloques?: Json
          categoria?: Database["public"]["Enums"]["categoria_formato"]
          codigo?: string
          created_at?: string
          css_template?: string | null
          deleted_at?: string | null
          descripcion?: string
          document_meta?: Json | null
          encabezado_config?: Json | null
          es_automatico?: boolean
          estado?: Database["public"]["Enums"]["estado_formato"]
          html_template?: string | null
          id?: string
          legacy_component_id?: string | null
          modo_diligenciamiento?: string
          motor_render?: Database["public"]["Enums"]["motor_render"]
          niveles_asignados?: string[] | null
          nombre?: string
          plantilla_base_id?: string | null
          requiere_firma_aprendiz?: boolean
          requiere_firma_entrenador?: boolean
          requiere_firma_supervisor?: boolean
          tipos_curso?: Database["public"]["Enums"]["tipo_formacion"][] | null
          tokens_usados?: string[] | null
          updated_at?: string
          usa_encabezado_institucional?: boolean
          version?: string
          visible_en_curso?: boolean
          visible_en_matricula?: boolean
          visible_en_portal_estudiante?: boolean
        }
        Relationships: []
      }
      grupo_cartera_matriculas: {
        Row: {
          created_at: string
          grupo_cartera_id: string
          matricula_id: string
        }
        Insert: {
          created_at?: string
          grupo_cartera_id: string
          matricula_id: string
        }
        Update: {
          created_at?: string
          grupo_cartera_id?: string
          matricula_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupo_cartera_matriculas_grupo_cartera_id_fkey"
            columns: ["grupo_cartera_id"]
            isOneToOne: false
            referencedRelation: "grupos_cartera"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupo_cartera_matriculas_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_cartera: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_grupo_cartera"]
          id: string
          observaciones: string | null
          responsable_pago_id: string
          saldo: number
          total_abonos: number
          total_valor: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_grupo_cartera"]
          id?: string
          observaciones?: string | null
          responsable_pago_id: string
          saldo?: number
          total_abonos?: number
          total_valor?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_grupo_cartera"]
          id?: string
          observaciones?: string | null
          responsable_pago_id?: string
          saldo?: number
          total_abonos?: number
          total_valor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_cartera_responsable_pago_id_fkey"
            columns: ["responsable_pago_id"]
            isOneToOne: false
            referencedRelation: "responsables_pago"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          abono: number
          activo: boolean
          alergias: boolean
          alergias_detalle: string | null
          area_trabajo: string | null
          arl: string | null
          arl_otra: string | null
          autoevaluacion_respuestas: Json | null
          autorizacion_datos: boolean
          centro_formacion_previo: string | null
          cobro_contacto_celular: string | null
          cobro_contacto_nombre: string | null
          consentimiento_salud: boolean
          consumo_medicamentos: boolean
          consumo_medicamentos_detalle: string | null
          created_at: string
          cta_fact_numero: string | null
          cta_fact_titular: string | null
          curso_id: string | null
          deleted_at: string | null
          embarazo: boolean | null
          empresa_cargo: string | null
          empresa_contacto_nombre: string | null
          empresa_contacto_telefono: string | null
          empresa_id: string | null
          empresa_nit: string | null
          empresa_nivel_formacion: string | null
          empresa_nombre: string | null
          empresa_representante_legal: string | null
          encuesta_completada: boolean
          encuesta_respuestas: Json | null
          eps: string | null
          eps_otra: string | null
          estado: Database["public"]["Enums"]["estado_matricula"]
          evaluacion_competencias_respuestas: Json | null
          evaluacion_completada: boolean
          evaluacion_puntaje: number | null
          evaluacion_respuestas: Json | null
          factura_numero: string | null
          fecha_certificacion_previa: string | null
          fecha_entrega_certificado: string | null
          fecha_facturacion: string | null
          fecha_fin: string | null
          fecha_generacion_certificado: string | null
          fecha_inicio: string | null
          fecha_pago: string | null
          firma_capturada: boolean
          firma_storage_path: string | null
          forma_pago: Database["public"]["Enums"]["metodo_pago"] | null
          id: string
          nivel_lectoescritura: boolean
          nivel_previo: Database["public"]["Enums"]["nivel_previo"] | null
          observaciones: string | null
          pagado: boolean
          persona_id: string
          portal_estudiante: Json | null
          restriccion_medica: boolean
          restriccion_medica_detalle: string | null
          sector_economico: string | null
          sector_economico_otro: string | null
          tipo_vinculacion:
            | Database["public"]["Enums"]["tipo_vinculacion"]
            | null
          updated_at: string
          valor_cupo: number
        }
        Insert: {
          abono?: number
          activo?: boolean
          alergias?: boolean
          alergias_detalle?: string | null
          area_trabajo?: string | null
          arl?: string | null
          arl_otra?: string | null
          autoevaluacion_respuestas?: Json | null
          autorizacion_datos?: boolean
          centro_formacion_previo?: string | null
          cobro_contacto_celular?: string | null
          cobro_contacto_nombre?: string | null
          consentimiento_salud?: boolean
          consumo_medicamentos?: boolean
          consumo_medicamentos_detalle?: string | null
          created_at?: string
          cta_fact_numero?: string | null
          cta_fact_titular?: string | null
          curso_id?: string | null
          deleted_at?: string | null
          embarazo?: boolean | null
          empresa_cargo?: string | null
          empresa_contacto_nombre?: string | null
          empresa_contacto_telefono?: string | null
          empresa_id?: string | null
          empresa_nit?: string | null
          empresa_nivel_formacion?: string | null
          empresa_nombre?: string | null
          empresa_representante_legal?: string | null
          encuesta_completada?: boolean
          encuesta_respuestas?: Json | null
          eps?: string | null
          eps_otra?: string | null
          estado?: Database["public"]["Enums"]["estado_matricula"]
          evaluacion_competencias_respuestas?: Json | null
          evaluacion_completada?: boolean
          evaluacion_puntaje?: number | null
          evaluacion_respuestas?: Json | null
          factura_numero?: string | null
          fecha_certificacion_previa?: string | null
          fecha_entrega_certificado?: string | null
          fecha_facturacion?: string | null
          fecha_fin?: string | null
          fecha_generacion_certificado?: string | null
          fecha_inicio?: string | null
          fecha_pago?: string | null
          firma_capturada?: boolean
          firma_storage_path?: string | null
          forma_pago?: Database["public"]["Enums"]["metodo_pago"] | null
          id?: string
          nivel_lectoescritura?: boolean
          nivel_previo?: Database["public"]["Enums"]["nivel_previo"] | null
          observaciones?: string | null
          pagado?: boolean
          persona_id: string
          portal_estudiante?: Json | null
          restriccion_medica?: boolean
          restriccion_medica_detalle?: string | null
          sector_economico?: string | null
          sector_economico_otro?: string | null
          tipo_vinculacion?:
            | Database["public"]["Enums"]["tipo_vinculacion"]
            | null
          updated_at?: string
          valor_cupo?: number
        }
        Update: {
          abono?: number
          activo?: boolean
          alergias?: boolean
          alergias_detalle?: string | null
          area_trabajo?: string | null
          arl?: string | null
          arl_otra?: string | null
          autoevaluacion_respuestas?: Json | null
          autorizacion_datos?: boolean
          centro_formacion_previo?: string | null
          cobro_contacto_celular?: string | null
          cobro_contacto_nombre?: string | null
          consentimiento_salud?: boolean
          consumo_medicamentos?: boolean
          consumo_medicamentos_detalle?: string | null
          created_at?: string
          cta_fact_numero?: string | null
          cta_fact_titular?: string | null
          curso_id?: string | null
          deleted_at?: string | null
          embarazo?: boolean | null
          empresa_cargo?: string | null
          empresa_contacto_nombre?: string | null
          empresa_contacto_telefono?: string | null
          empresa_id?: string | null
          empresa_nit?: string | null
          empresa_nivel_formacion?: string | null
          empresa_nombre?: string | null
          empresa_representante_legal?: string | null
          encuesta_completada?: boolean
          encuesta_respuestas?: Json | null
          eps?: string | null
          eps_otra?: string | null
          estado?: Database["public"]["Enums"]["estado_matricula"]
          evaluacion_competencias_respuestas?: Json | null
          evaluacion_completada?: boolean
          evaluacion_puntaje?: number | null
          evaluacion_respuestas?: Json | null
          factura_numero?: string | null
          fecha_certificacion_previa?: string | null
          fecha_entrega_certificado?: string | null
          fecha_facturacion?: string | null
          fecha_fin?: string | null
          fecha_generacion_certificado?: string | null
          fecha_inicio?: string | null
          fecha_pago?: string | null
          firma_capturada?: boolean
          firma_storage_path?: string | null
          forma_pago?: Database["public"]["Enums"]["metodo_pago"] | null
          id?: string
          nivel_lectoescritura?: boolean
          nivel_previo?: Database["public"]["Enums"]["nivel_previo"] | null
          observaciones?: string | null
          pagado?: boolean
          persona_id?: string
          portal_estudiante?: Json | null
          restriccion_medica?: boolean
          restriccion_medica_detalle?: string | null
          sector_economico?: string | null
          sector_economico_otro?: string | null
          tipo_vinculacion?:
            | Database["public"]["Enums"]["tipo_vinculacion"]
            | null
          updated_at?: string
          valor_cupo?: number
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
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
      pagos: {
        Row: {
          created_at: string
          factura_id: string
          fecha_pago: string
          id: string
          metodo_pago: Database["public"]["Enums"]["metodo_pago"]
          observaciones: string | null
          soporte_pago: string | null
          updated_at: string
          valor_pago: number
        }
        Insert: {
          created_at?: string
          factura_id: string
          fecha_pago?: string
          id?: string
          metodo_pago: Database["public"]["Enums"]["metodo_pago"]
          observaciones?: string | null
          soporte_pago?: string | null
          updated_at?: string
          valor_pago: number
        }
        Update: {
          created_at?: string
          factura_id?: string
          fecha_pago?: string
          id?: string
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"]
          observaciones?: string | null
          soporte_pago?: string | null
          updated_at?: string
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagos_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nombres: string | null
          rol_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nombres?: string | null
          rol_id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nombres?: string | null
          rol_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
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
      plantilla_certificado_versiones: {
        Row: {
          created_at: string
          id: string
          modificado_por: string | null
          plantilla_id: string
          svg_raw: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          modificado_por?: string | null
          plantilla_id: string
          svg_raw?: string
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          modificado_por?: string | null
          plantilla_id?: string
          svg_raw?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "plantilla_certificado_versiones_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_certificado"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_certificado: {
        Row: {
          activa: boolean
          created_at: string
          deleted_at: string | null
          id: string
          niveles_asignados: string[]
          nombre: string
          regla_codigo: string
          reglas: Json
          svg_raw: string
          tipo_formacion: Database["public"]["Enums"]["tipo_formacion"]
          token_mappings: Json
          tokens_detectados: string[]
          updated_at: string
          version: number
        }
        Insert: {
          activa?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          niveles_asignados?: string[]
          nombre: string
          regla_codigo?: string
          reglas?: Json
          svg_raw?: string
          tipo_formacion: Database["public"]["Enums"]["tipo_formacion"]
          token_mappings?: Json
          tokens_detectados?: string[]
          updated_at?: string
          version?: number
        }
        Update: {
          activa?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          niveles_asignados?: string[]
          nombre?: string
          regla_codigo?: string
          reglas?: Json
          svg_raw?: string
          tipo_formacion?: Database["public"]["Enums"]["tipo_formacion"]
          token_mappings?: Json
          tokens_detectados?: string[]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      portal_config_documentos: {
        Row: {
          activo: boolean
          created_at: string
          depende_de: string[]
          descripcion: string
          habilitado_por_nivel: Json
          icono: string
          id: string
          key: string
          label: string
          obligatorio: boolean
          orden: number
          tipo: Database["public"]["Enums"]["tipo_doc_portal"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          depende_de?: string[]
          descripcion?: string
          habilitado_por_nivel?: Json
          icono?: string
          id?: string
          key: string
          label: string
          obligatorio?: boolean
          orden?: number
          tipo?: Database["public"]["Enums"]["tipo_doc_portal"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          depende_de?: string[]
          descripcion?: string
          habilitado_por_nivel?: Json
          icono?: string
          id?: string
          key?: string
          label?: string
          obligatorio?: boolean
          orden?: number
          tipo?: Database["public"]["Enums"]["tipo_doc_portal"]
          updated_at?: string
        }
        Relationships: []
      }
      responsables_pago: {
        Row: {
          activo: boolean
          contacto_email: string | null
          contacto_nombre: string | null
          contacto_telefono: string | null
          created_at: string
          deleted_at: string | null
          direccion_facturacion: string | null
          empresa_id: string | null
          id: string
          nit: string
          nombre: string
          observaciones: string | null
          tipo: Database["public"]["Enums"]["tipo_responsable"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          deleted_at?: string | null
          direccion_facturacion?: string | null
          empresa_id?: string | null
          id?: string
          nit?: string
          nombre: string
          observaciones?: string | null
          tipo: Database["public"]["Enums"]["tipo_responsable"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          deleted_at?: string | null
          direccion_facturacion?: string | null
          empresa_id?: string | null
          id?: string
          nit?: string
          nombre?: string
          observaciones?: string | null
          tipo?: Database["public"]["Enums"]["tipo_responsable"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsables_pago_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      rol_permisos: {
        Row: {
          accion: string
          created_at: string
          modulo: string
          rol_id: string
        }
        Insert: {
          accion: string
          created_at?: string
          modulo: string
          rol_id: string
        }
        Update: {
          accion?: string
          created_at?: string
          modulo?: string
          rol_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rol_permisos_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          descripcion: string | null
          es_sistema: boolean
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          es_sistema?: boolean
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          es_sistema?: boolean
          id?: string
          nombre?: string
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
      versiones_formato: {
        Row: {
          creado_por: string | null
          created_at: string
          css_template: string | null
          formato_id: string
          html_template: string
          id: string
          version: number
        }
        Insert: {
          creado_por?: string | null
          created_at?: string
          css_template?: string | null
          formato_id: string
          html_template?: string
          id?: string
          version?: number
        }
        Update: {
          creado_por?: string | null
          created_at?: string
          css_template?: string | null
          formato_id?: string
          html_template?: string
          id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "versiones_formato_formato_id_fkey"
            columns: ["formato_id"]
            isOneToOne: false
            referencedRelation: "formatos_formacion"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      duplicar_formato: { Args: { _formato_id: string }; Returns: string }
      get_dashboard_charts_data: { Args: { p_periodo?: string }; Returns: Json }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_documentos_portal: {
        Args: { p_matricula_id: string }
        Returns: {
          depende_de: string[]
          descripcion: string
          documento_key: string
          enviado_en: string
          estado: Database["public"]["Enums"]["estado_doc_portal"]
          firma_data: string
          icono: string
          intentos: Json
          label: string
          metadata: Json
          obligatorio: boolean
          orden: number
          tipo: Database["public"]["Enums"]["tipo_doc_portal"]
        }[]
      }
      get_formatos_for_matricula: {
        Args: { _matricula_id: string }
        Returns: {
          activo: boolean
          asignacion_scope: Database["public"]["Enums"]["scope_formato"]
          bloques: Json
          categoria: Database["public"]["Enums"]["categoria_formato"]
          codigo: string
          created_at: string
          css_template: string | null
          deleted_at: string | null
          descripcion: string
          document_meta: Json | null
          encabezado_config: Json | null
          es_automatico: boolean
          estado: Database["public"]["Enums"]["estado_formato"]
          html_template: string | null
          id: string
          legacy_component_id: string | null
          modo_diligenciamiento: string
          motor_render: Database["public"]["Enums"]["motor_render"]
          niveles_asignados: string[] | null
          nombre: string
          plantilla_base_id: string | null
          requiere_firma_aprendiz: boolean
          requiere_firma_entrenador: boolean
          requiere_firma_supervisor: boolean
          tipos_curso: Database["public"]["Enums"]["tipo_formacion"][] | null
          tokens_usados: string[] | null
          updated_at: string
          usa_encabezado_institucional: boolean
          version: string
          visible_en_curso: boolean
          visible_en_matricula: boolean
          visible_en_portal_estudiante: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "formatos_formacion"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_rol: { Args: never; Returns: string }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          accion: string
          modulo: string
        }[]
      }
      has_permission: {
        Args: { p_accion: string; p_modulo: string; p_user_id: string }
        Returns: boolean
      }
      login_portal_estudiante: {
        Args: { p_cedula: string }
        Returns: {
          curso_id: string
          curso_nombre: string
          curso_tipo_formacion: Database["public"]["Enums"]["tipo_formacion"]
          matricula_id: string
          persona_apellidos: string
          persona_id: string
          persona_nombres: string
          persona_numero_documento: string
          portal_habilitado: boolean
        }[]
      }
      recalcular_grupo_cartera: {
        Args: { p_grupo_id: string }
        Returns: undefined
      }
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
      estado_doc_portal: "bloqueado" | "pendiente" | "completado"
      estado_documento_matricula: "pendiente" | "cargado"
      estado_excepcion_certificado: "pendiente" | "aprobada" | "rechazada"
      estado_factura: "por_pagar" | "parcial" | "pagada"
      estado_formato: "borrador" | "activo" | "archivado"
      estado_formato_respuesta: "pendiente" | "completado" | "firmado"
      estado_grupo_cartera:
        | "sin_facturar"
        | "facturado"
        | "abonado"
        | "pagado"
        | "vencido"
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
      motor_render: "bloques" | "plantilla_html"
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
      nivel_previo: "trabajador_autorizado" | "avanzado"
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
      tipo_actividad_cartera:
        | "llamada"
        | "promesa_pago"
        | "comentario"
        | "sistema"
      tipo_cargo:
        | "entrenador"
        | "supervisor"
        | "administrativo"
        | "instructor"
        | "otro"
      tipo_doc_portal:
        | "firma_autorizacion"
        | "evaluacion"
        | "formulario"
        | "solo_lectura"
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
        | "plantilla_certificado"
        | "excepcion_certificado"
        | "responsable_pago"
        | "actividad_cartera"
        | "rol"
        | "rol_permiso"
      tipo_formacion:
        | "formacion_inicial"
        | "reentrenamiento"
        | "jefe_area"
        | "coordinador_alturas"
      tipo_responsable: "empresa" | "independiente" | "arl"
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
      estado_doc_portal: ["bloqueado", "pendiente", "completado"],
      estado_documento_matricula: ["pendiente", "cargado"],
      estado_excepcion_certificado: ["pendiente", "aprobada", "rechazada"],
      estado_factura: ["por_pagar", "parcial", "pagada"],
      estado_formato: ["borrador", "activo", "archivado"],
      estado_formato_respuesta: ["pendiente", "completado", "firmado"],
      estado_grupo_cartera: [
        "sin_facturar",
        "facturado",
        "abonado",
        "pagado",
        "vencido",
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
      motor_render: ["bloques", "plantilla_html"],
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
      nivel_previo: ["trabajador_autorizado", "avanzado"],
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
      tipo_actividad_cartera: [
        "llamada",
        "promesa_pago",
        "comentario",
        "sistema",
      ],
      tipo_cargo: [
        "entrenador",
        "supervisor",
        "administrativo",
        "instructor",
        "otro",
      ],
      tipo_doc_portal: [
        "firma_autorizacion",
        "evaluacion",
        "formulario",
        "solo_lectura",
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
        "plantilla_certificado",
        "excepcion_certificado",
        "responsable_pago",
        "actividad_cartera",
        "rol",
        "rol_permiso",
      ],
      tipo_formacion: [
        "formacion_inicial",
        "reentrenamiento",
        "jefe_area",
        "coordinador_alturas",
      ],
      tipo_responsable: ["empresa", "independiente", "arl"],
      tipo_vinculacion: ["empresa", "independiente", "arl"],
    },
  },
} as const
