/**
 * Implementación del TokenResolverPort basada en namespaces.
 *
 * Convención: el primer segmento del token (separado por `.` o `:`) selecciona
 * el resolver. Ejemplos:
 *   "persona.nombreCompleto"   -> resolver "persona"
 *   "firma:aprendiz"           -> resolver "firma"
 *   "formato_prev:<id>:<key>"  -> resolver "formato_prev"
 */
import type { TokenContext, TokenResolverFn, TokenResolverPort } from '../../contracts/TokenResolverPort';

export function createTokenResolverRegistry(): TokenResolverPort {
  const map = new Map<string, TokenResolverFn>();

  return {
    register(namespace, resolver) {
      map.set(namespace, resolver);
    },
    resolve(token, ctx: TokenContext) {
      if (!token) return null;
      // Detectar namespace: parte antes del primer `.` o `:`
      const sepIdx = (() => {
        const dot = token.indexOf('.');
        const col = token.indexOf(':');
        if (dot === -1) return col;
        if (col === -1) return dot;
        return Math.min(dot, col);
      })();
      const namespace = sepIdx === -1 ? token : token.slice(0, sepIdx);
      const resolver = map.get(namespace);
      if (!resolver) {
        // fallback: probar resolver "default" o "_legacy" si está registrado
        const fallback = map.get('_legacy') ?? map.get('default');
        if (!fallback) return null;
        return fallback(token, ctx);
      }
      return resolver(token, ctx);
    },
    namespaces() {
      return Array.from(map.keys());
    },
  };
}
