/**
 * EventBus síncrono para uso intra-aplicación.
 */
import type { EventBusPort, EventHandler, FormatoEventType } from '../../contracts/EventBusPort';

export function createEventBus(): EventBusPort {
  const handlers = new Map<FormatoEventType, Set<EventHandler>>();

  return {
    on(type, handler) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type)!.add(handler as EventHandler);
      return () => handlers.get(type)?.delete(handler as EventHandler);
    },
    off(type, handler) {
      handlers.get(type)?.delete(handler);
    },
    emit(type, payload) {
      const set = handlers.get(type);
      if (!set) return;
      const event = { type, payload, timestamp: Date.now() };
      set.forEach((h) => {
        try {
          void h(event);
        } catch (e) {
          console.warn(`[formatos] handler error for ${type}:`, e);
        }
      });
    },
  };
}
