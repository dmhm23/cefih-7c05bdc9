/**
 * TokenResolverPort — resuelve un token (`namespace.field` o `namespace:arg`)
 * a su valor textual. Sin tipos de dominio.
 *
 * El TokenContext es un mapa opaco que el host construye y entrega; el core
 * no inspecciona su forma.
 */
export type TokenContext = Record<string, unknown>;

export type TokenResolverFn = (token: string, ctx: TokenContext) => string | null;

export interface TokenResolverPort {
  /**
   * Registra un resolver para un namespace dado, p.ej. "persona", "curso", "firma".
   * El primer segmento del token (antes del primer `.` o `:`) selecciona el resolver.
   */
  register(namespace: string, resolver: TokenResolverFn): void;
  /**
   * Resuelve un token completo. Si ningún resolver matchea el namespace
   * devuelve `null`.
   */
  resolve(token: string, ctx: TokenContext): string | null;
  /** Lista los namespaces actualmente registrados. */
  namespaces(): string[];
}
