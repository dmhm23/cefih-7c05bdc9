import { PortalConfigGlobal, PortalDocumentoConfigAdmin } from '@/types/portalAdmin';
import { TipoFormacion } from '@/types/curso';
import { portalDocumentosCatalogo, portalActivoPorDefecto, setPortalActivoPorDefecto } from '@/data/portalAdminConfig';
import { delay } from './api';

export const portalAdminService = {
  async getConfigGlobal(): Promise<PortalConfigGlobal> {
    await delay(300);
    return {
      portalActivoPorDefecto,
      documentos: [...portalDocumentosCatalogo].sort((a, b) => a.orden - b.orden),
    };
  },

  async saveDocumentoConfig(doc: PortalDocumentoConfigAdmin): Promise<PortalDocumentoConfigAdmin> {
    await delay(400);
    const idx = portalDocumentosCatalogo.findIndex(d => d.key === doc.key);
    if (idx >= 0) {
      portalDocumentosCatalogo[idx] = { ...doc };
    } else {
      portalDocumentosCatalogo.push({ ...doc });
    }
    return doc;
  },

  async deleteDocumentoConfig(key: string): Promise<void> {
    await delay(400);
    const idx = portalDocumentosCatalogo.findIndex(d => d.key === key);
    if (idx >= 0) {
      portalDocumentosCatalogo.splice(idx, 1);
      // Remove from dependencies
      portalDocumentosCatalogo.forEach(d => {
        d.dependeDe = d.dependeDe.filter(k => k !== key);
      });
    }
  },

  async togglePortalGlobal(activo: boolean): Promise<boolean> {
    await delay(300);
    setPortalActivoPorDefecto(activo);
    return activo;
  },

  async updateOrdenDocumentos(keys: string[]): Promise<void> {
    await delay(300);
    keys.forEach((key, i) => {
      const doc = portalDocumentosCatalogo.find(d => d.key === key);
      if (doc) doc.orden = i + 1;
    });
  },

  async updateDependencias(key: string, dependeDe: string[]): Promise<void> {
    await delay(300);
    const doc = portalDocumentosCatalogo.find(d => d.key === key);
    if (doc) doc.dependeDe = dependeDe;
  },

  async updateHabilitacionNivel(key: string, nivel: TipoFormacion, activo: boolean): Promise<void> {
    await delay(200);
    const doc = portalDocumentosCatalogo.find(d => d.key === key);
    if (doc) doc.habilitadoPorNivel[nivel] = activo;
  },
};
