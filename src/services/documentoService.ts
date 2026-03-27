import { v4 as uuid } from 'uuid';
import { DocumentoRequerido } from '@/types/matricula';
import { CATALOGO_DOCUMENTOS, DocumentoReqKey } from '@/types/nivelFormacion';
import { mockNivelesFormacion } from '@/data/mockData';

// Mapeo de claves legacy (usadas en matrículas) a nombres de nivel
const LEGACY_KEY_MAP: Record<string, string> = {
  'jefe_area': 'Jefe de Área',
  'trabajador_autorizado': 'Trabajador Autorizado',
  'reentrenamiento': 'Reentrenamiento',
  'coordinador_ta': 'Coordinador T.A.',
};

/**
 * Genera la lista dinámica de documentos requeridos según el nivel de formación.
 * Consulta la entidad NivelFormacion para obtener los requisitos configurados.
 */
export function getDocumentosRequeridos(
  nivelFormacionKey?: string
): DocumentoRequerido[] {
  // Buscar nivel en la entidad administrable
  const nivel = nivelFormacionKey
    ? mockNivelesFormacion.find(
        n => n.id === nivelFormacionKey ||
        n.nombreNivel === LEGACY_KEY_MAP[nivelFormacionKey] ||
        n.nombreNivel.toLowerCase() === nivelFormacionKey?.toLowerCase()
      )
    : null;

  // Fallback: solo cédula si no se encuentra el nivel
  if (!nivel) {
    return [
      {
        id: uuid(),
        tipo: 'cedula',
        nombre: 'Cédula de Ciudadanía',
        estado: 'pendiente',
      },
    ];
  }

  // Generar documentos dinámicamente a partir de la configuración del nivel
  return nivel.documentosRequeridos.map((key: DocumentoReqKey) => {
    const catalogo = CATALOGO_DOCUMENTOS.find(d => d.key === key);
    return {
      id: uuid(),
      tipo: key,
      nombre: catalogo?.label || key,
      estado: 'pendiente' as const,
      opcional: key === 'planilla_seguridad_social' ? true : undefined,
    };
  });
}

/**
 * Sincroniza los documentos de una matrícula con los requisitos vigentes del nivel.
 * Añade requisitos faltantes sin alterar los existentes (preserva archivos cargados).
 */
export function sincronizarDocumentos(
  documentosActuales: DocumentoRequerido[],
  nivelFormacionKey?: string
): { documentos: DocumentoRequerido[]; huboCambios: boolean } {
  const requisitosVigentes = getDocumentosRequeridos(nivelFormacionKey);

  const tiposExistentes = new Set(documentosActuales.map(d => d.tipo));

  const nuevos = requisitosVigentes.filter(r => !tiposExistentes.has(r.tipo));

  if (nuevos.length === 0) {
    return { documentos: documentosActuales, huboCambios: false };
  }

  return {
    documentos: [...documentosActuales, ...nuevos],
    huboCambios: true,
  };
}
