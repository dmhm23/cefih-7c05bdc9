import { DocumentoPortalConfig } from '@/types/portalEstudiante';

export const PORTAL_DOCUMENTOS_CONFIG: DocumentoPortalConfig[] = [
  {
    key: 'info_aprendiz',
    nombre: 'Información del Aprendiz',
    tipo: 'firma_autorizacion',
    requiereFirma: true,
    dependeDe: [],
    orden: 1,
  },
  {
    key: 'evaluacion',
    nombre: 'Evaluación y Encuesta',
    tipo: 'evaluacion',
    requiereFirma: false,
    dependeDe: ['info_aprendiz'],
    orden: 2,
  },
];
