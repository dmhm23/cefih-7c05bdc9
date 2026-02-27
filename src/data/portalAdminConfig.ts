import { PortalDocumentoConfigAdmin, PortalConfigGlobal } from '@/types/portalAdmin';

export let portalActivoPorDefecto = true;

export const portalDocumentosCatalogo: PortalDocumentoConfigAdmin[] = [
  {
    key: 'info_aprendiz',
    nombre: 'Información del Aprendiz',
    tipo: 'firma_autorizacion',
    requiereFirma: true,
    dependeDe: [],
    orden: 1,
    habilitadoPorNivel: {
      reentrenamiento: true,
      jefe_area: true,
      trabajador_autorizado: true,
      coordinador_ta: true,
    },
  },
  {
    key: 'evaluacion',
    nombre: 'Evaluación y Encuesta',
    tipo: 'evaluacion',
    requiereFirma: false,
    dependeDe: ['info_aprendiz'],
    orden: 2,
    habilitadoPorNivel: {
      reentrenamiento: true,
      jefe_area: true,
      trabajador_autorizado: true,
      coordinador_ta: true,
    },
  },
];

export function setPortalActivoPorDefecto(activo: boolean) {
  portalActivoPorDefecto = activo;
}
