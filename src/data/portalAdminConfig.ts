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
      nf1: true,
      nf2: true,
      nf3: true,
      nf5: true,
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
      nf1: true,
      nf2: true,
      nf3: true,
      nf5: true,
    },
  },
];

export function setPortalActivoPorDefecto(activo: boolean) {
  portalActivoPorDefecto = activo;
}
