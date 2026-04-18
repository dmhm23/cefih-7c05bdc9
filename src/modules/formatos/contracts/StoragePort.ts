/**
 * StoragePort — interfaz CRUD para persistencia de formatos y respuestas.
 * El core sólo conoce esta interfaz. Implementaciones concretas (Supabase,
 * REST, InMemory) viven en adapters/.
 */
import type { Formato, FormatoFormData, FormatoVersion, Respuesta } from '../core/types';

export interface StoragePort {
  // --- Formatos ---
  fetchAll(): Promise<Formato[]>;
  fetchById(id: string): Promise<Formato | undefined>;
  search(query: string): Promise<Formato[]>;
  persist(data: FormatoFormData): Promise<Formato>;
  update(id: string, data: Partial<FormatoFormData>): Promise<Formato>;
  remove(id: string): Promise<void>;
  archive(id: string): Promise<Formato>;
  duplicate(id: string): Promise<Formato>;
  toggleActivo(id: string): Promise<Formato>;

  // --- Versiones ---
  saveVersion(formatoId: string): Promise<FormatoVersion>;
  fetchVersions(formatoId: string): Promise<FormatoVersion[]>;
  restoreVersion(formatoId: string, versionId: string): Promise<Formato>;

  // --- Respuestas (subject = unidad transaccional, ej. matrícula) ---
  fetchRespuestas(subjectId: string): Promise<Respuesta[]>;
  fetchRespuesta(subjectId: string, formatoId: string): Promise<Respuesta | null>;
  upsertRespuesta(
    subjectId: string,
    formatoId: string,
    answers: Record<string, unknown>,
    estado?: 'pendiente' | 'completado',
  ): Promise<Respuesta>;
  reopenRespuesta(respuestaId: string, userId: string): Promise<Respuesta>;

  /**
   * Devuelve los formatos aplicables a un subject (matrícula u otro).
   * El cálculo (RPC, query, etc.) es responsabilidad del adapter.
   */
  fetchForSubject(subjectId: string): Promise<Formato[]>;
}
