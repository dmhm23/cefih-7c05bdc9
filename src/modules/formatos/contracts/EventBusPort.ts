/**
 * EventBusPort — emisor/suscriptor para que el host reaccione a hechos del
 * módulo sin que el módulo conozca al host.
 *
 * Eventos canónicos del módulo:
 *  - formato.created            { formato }
 *  - formato.updated            { formato, changes }
 *  - formato.visibilityChanged  { formato, visibleEnPortal, activo }
 *  - formato.archived           { formatoId }
 *  - formato.deleted            { formatoId }
 *  - respuesta.upserted         { subjectId, formatoId, estado }
 *  - respuesta.completed        { subjectId, formatoId, answers }
 *  - respuesta.reopened         { subjectId, formatoId, by }
 *  - signature.captured         { subjectId, formatoId, tipo, base64 }
 *
 * El host se suscribe a los que le interesan (p. ej. `formato.visibilityChanged`
 * para sincronizar `portal_config_documentos`, o `signature.captured` para
 * propagar la firma a otros formatos).
 */

export type FormatoEventType =
  | 'formato.created'
  | 'formato.updated'
  | 'formato.visibilityChanged'
  | 'formato.archived'
  | 'formato.deleted'
  | 'respuesta.upserted'
  | 'respuesta.completed'
  | 'respuesta.reopened'
  | 'signature.captured';

export interface FormatoEvent<P = unknown> {
  type: FormatoEventType;
  payload: P;
  timestamp: number;
}

export type EventHandler<P = unknown> = (event: FormatoEvent<P>) => void | Promise<void>;

export interface EventBusPort {
  on<P = unknown>(type: FormatoEventType, handler: EventHandler<P>): () => void;
  emit<P = unknown>(type: FormatoEventType, payload: P): void;
  off(type: FormatoEventType, handler: EventHandler): void;
}
