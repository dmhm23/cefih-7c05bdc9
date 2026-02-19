import { v4 as uuid } from 'uuid';
import { DocumentoRequerido, NivelFormacionEmpresa } from '@/types/matricula';

/**
 * Genera la lista dinámica de documentos requeridos según el nivel de formación.
 */
export function getDocumentosRequeridos(
  nivelFormacion?: NivelFormacionEmpresa
): DocumentoRequerido[] {
  const docs: DocumentoRequerido[] = [
    {
      id: uuid(),
      tipo: 'cedula',
      nombre: 'Cédula de Ciudadanía',
      estado: 'pendiente',
    },
  ];

  // Jefe de área: Cédula, ARL, EPS, Planilla (opcional)
  if (nivelFormacion === 'jefe_area') {
    docs.push(
      {
        id: uuid(),
        tipo: 'arl',
        nombre: 'Afiliación ARL',
        estado: 'pendiente',
      },
      {
        id: uuid(),
        tipo: 'certificado_eps',
        nombre: 'Certificado EPS',
        estado: 'pendiente',
      },
      {
        id: uuid(),
        tipo: 'planilla_seguridad_social',
        nombre: 'Planilla de Seguridad Social',
        estado: 'pendiente',
        opcional: true,
      }
    );
    return docs;
  }

  // Trabajador autorizado / Reentrenamiento: Cédula, Examen médico, ARL, EPS, Planilla (opcional)
  docs.push(
    {
      id: uuid(),
      tipo: 'examen_medico',
      nombre: 'Examen Médico Ocupacional',
      estado: 'pendiente',
    },
    {
      id: uuid(),
      tipo: 'arl',
      nombre: 'Afiliación ARL',
      estado: 'pendiente',
    },
    {
      id: uuid(),
      tipo: 'certificado_eps',
      nombre: 'Certificado EPS',
      estado: 'pendiente',
    },
    {
      id: uuid(),
      tipo: 'planilla_seguridad_social',
      nombre: 'Planilla de Seguridad Social',
      estado: 'pendiente',
      opcional: true,
    }
  );

  // Coordinador T.A.: todo lo anterior + Curso previo
  if (nivelFormacion === 'coordinador_ta') {
    docs.push({
      id: uuid(),
      tipo: 'curso_previo',
      nombre: 'Certificado de Curso Previo',
      estado: 'pendiente',
    });
  }

  return docs;
}
