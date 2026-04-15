import { z } from 'zod';

const bloqueBaseSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  label: z.string(),
  required: z.boolean().optional(),
});

const row1Schema = z.object({
  id: z.string().min(1),
  type: z.literal('row1'),
  col: z.array(bloqueBaseSchema),
});

const row2Schema = z.object({
  id: z.string().min(1),
  type: z.literal('row2'),
  cols: z.tuple([
    z.array(bloqueBaseSchema),
    z.array(bloqueBaseSchema),
  ]),
});

const editorItemSchema = z.union([row1Schema, row2Schema, bloqueBaseSchema]);

export const formatoConfigSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string(),
  codigo: z.string(),
  version: z.string(),
  categoria: z.enum(['formacion', 'evaluacion', 'asistencia', 'pta_ats', 'personalizado']),
  asignacionScope: z.enum(['todos', 'nivel_formacion']),
  nivelFormacionIds: z.array(z.string()),
  visibleEnMatricula: z.boolean(),
  visibleEnCurso: z.boolean(),
  visibleEnPortalEstudiante: z.boolean(),
  activo: z.boolean(),
  modoDiligenciamiento: z.enum(['manual_estudiante', 'manual_admin', 'automatico_sistema']),
  requiereFirmaAprendiz: z.boolean(),
  requiereFirmaEntrenador: z.boolean(),
  requiereFirmaSupervisor: z.boolean(),
  usaEncabezadoInstitucional: z.boolean(),
});

export const formatoEditorSchema = z.object({
  config: formatoConfigSchema,
  items: z.array(editorItemSchema),
  docTitle: z.string(),
});

export type FormatoEditorValidation = z.infer<typeof formatoEditorSchema>;

export function validateFormato(data: unknown) {
  return formatoEditorSchema.safeParse(data);
}
