/**
 * FormatoGateway — fachada pública del módulo. Lo único que el host debería
 * importar.
 */
import type { StoragePort } from '../contracts/StoragePort';
import type { BlockRegistryPort } from '../contracts/BlockRegistryPort';
import type { TokenResolverPort, TokenContext } from '../contracts/TokenResolverPort';
import type { EventBusPort } from '../contracts/EventBusPort';
import { createBlockRegistry, createTokenResolverRegistry, createEventBus } from '../core/registry';
import { renderTemplate as renderTpl } from '../core/engine/renderTemplate';
import type { Formato, FormatoFormData, FormatoVersion, Respuesta } from '../core/types';

export interface FormatoGatewayConfig {
  storage: StoragePort;
  blockRegistry?: BlockRegistryPort;
  tokenRegistry?: TokenResolverPort;
  events?: EventBusPort;
}

export interface FormatoGateway {
  // Registries (host puede registrar plugins)
  blockRegistry: BlockRegistryPort;
  tokenRegistry: TokenResolverPort;
  events: EventBusPort;

  // Formatos
  getFormatos(): Promise<Formato[]>;
  getFormatoById(id: string): Promise<Formato | undefined>;
  searchFormatos(q: string): Promise<Formato[]>;
  saveFormato(data: FormatoFormData): Promise<Formato>;
  updateFormato(id: string, data: Partial<FormatoFormData>): Promise<Formato>;
  deleteFormato(id: string): Promise<void>;
  archiveFormato(id: string): Promise<Formato>;
  duplicateFormato(id: string): Promise<Formato>;
  toggleActivo(id: string): Promise<Formato>;

  // Versiones
  saveVersion(formatoId: string): Promise<FormatoVersion>;
  getVersions(formatoId: string): Promise<FormatoVersion[]>;
  restoreVersion(formatoId: string, versionId: string): Promise<Formato>;

  // Respuestas
  getRespuestasForSubject(subjectId: string): Promise<Respuesta[]>;
  getRespuesta(subjectId: string, formatoId: string): Promise<Respuesta | null>;
  submitRespuesta(
    subjectId: string,
    formatoId: string,
    answers: Record<string, unknown>,
    estado?: 'pendiente' | 'completado',
  ): Promise<Respuesta>;
  reopenRespuesta(respuestaId: string, userId: string): Promise<Respuesta>;
  getFormatosForSubject(subjectId: string): Promise<Formato[]>;

  // Render
  renderTemplate(template: string, ctx: TokenContext): string;
}

export function createFormatoGateway(config: FormatoGatewayConfig): FormatoGateway {
  const storage = config.storage;
  const blockRegistry = config.blockRegistry ?? createBlockRegistry();
  const tokenRegistry = config.tokenRegistry ?? createTokenResolverRegistry();
  const events = config.events ?? createEventBus();

  return {
    blockRegistry,
    tokenRegistry,
    events,

    getFormatos: () => storage.fetchAll(),
    getFormatoById: (id) => storage.fetchById(id),
    searchFormatos: (q) => storage.search(q),

    async saveFormato(data) {
      const f = await storage.persist(data);
      events.emit('formato.created', { formato: f });
      events.emit('formato.visibilityChanged', {
        formato: f,
        visibleEnPortal: f.visibleEnPortalEstudiante,
        activo: f.activo,
      });
      return f;
    },

    async updateFormato(id, data) {
      const f = await storage.update(id, data);
      events.emit('formato.updated', { formato: f, changes: data });
      events.emit('formato.visibilityChanged', {
        formato: f,
        visibleEnPortal: f.visibleEnPortalEstudiante,
        activo: f.activo,
      });
      return f;
    },

    async deleteFormato(id) {
      await storage.remove(id);
      events.emit('formato.deleted', { formatoId: id });
    },

    async archiveFormato(id) {
      const f = await storage.archive(id);
      events.emit('formato.archived', { formatoId: id });
      return f;
    },

    duplicateFormato: (id) => storage.duplicate(id),
    toggleActivo: (id) => storage.toggleActivo(id),

    saveVersion: (id) => storage.saveVersion(id),
    getVersions: (id) => storage.fetchVersions(id),
    restoreVersion: (id, vid) => storage.restoreVersion(id, vid),

    getRespuestasForSubject: (sid) => storage.fetchRespuestas(sid),
    getRespuesta: (sid, fid) => storage.fetchRespuesta(sid, fid),

    async submitRespuesta(sid, fid, answers, estado = 'pendiente') {
      const r = await storage.upsertRespuesta(sid, fid, answers, estado);
      events.emit('respuesta.upserted', { subjectId: sid, formatoId: fid, estado });
      if (estado === 'completado') {
        events.emit('respuesta.completed', { subjectId: sid, formatoId: fid, answers });
      }
      return r;
    },

    async reopenRespuesta(rid, uid) {
      const r = await storage.reopenRespuesta(rid, uid);
      events.emit('respuesta.reopened', { respuestaId: rid, by: uid });
      return r;
    },

    getFormatosForSubject: (sid) => storage.fetchForSubject(sid),

    renderTemplate: (tpl, ctx) => renderTpl(tpl, tokenRegistry, ctx),
  };
}
