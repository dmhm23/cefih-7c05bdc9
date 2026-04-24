/**
 * Listener SAFA: cascada de firmas (DEPRECADO).
 *
 * ⚠️ A partir de la Fase 1 del refactor de sincronización de estados,
 * la cascada de firmas se ejecuta server-side mediante el trigger
 * `trg_cascade_firma` sobre `public.formato_respuestas`, que invoca a la
 * función `public.cascade_firma_to_targets()`.
 *
 * Razones del cambio:
 *  - El listener cliente solo procesaba formatos con `es_automatico = TRUE`,
 *    dejando casos válidos como "PARTICIPACIÓN PTA - ATS" en estado pendiente.
 *  - Dependía de que el navegador del estudiante mantuviera la sesión abierta
 *    durante toda la cadena de operaciones asincrónicas.
 *  - No persistía firmas de matrículas que se completaban desde otros canales
 *    (importaciones, edge functions, panel admin).
 *
 * Este archivo se conserva como no-op para mantener compatibilidad con los
 * imports existentes y evitar romper la inicialización del plugin SAFA.
 * Puede eliminarse en una fase posterior cuando se limpie el grafo de imports.
 */

export function registerFirmaCascadeListener(): void {
  // No-op: la cascada ahora vive en el trigger server-side
  // `trg_cascade_firma` → `public.cascade_firma_to_targets()`.
}
