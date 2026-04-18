/**
 * Resolución de tokens en plantillas HTML.
 *
 * Soporta el patrón `{{ namespace.field }}` o `{{ namespace:arg }}` y delega
 * la resolución al TokenResolverPort.
 */
import type { TokenContext, TokenResolverPort } from '../../contracts/TokenResolverPort';

const TOKEN_REGEX = /\{\{\s*([^}]+?)\s*\}\}/g;

export function renderTemplate(
  template: string,
  resolver: TokenResolverPort,
  ctx: TokenContext,
): string {
  if (!template) return '';
  return template.replace(TOKEN_REGEX, (full, raw) => {
    const token = String(raw).trim();
    const value = resolver.resolve(token, ctx);
    return value ?? '';
  });
}

export function extractTokens(template: string): string[] {
  if (!template) return [];
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(TOKEN_REGEX.source, 'g');
  while ((m = re.exec(template))) {
    out.push(m[1].trim());
  }
  return Array.from(new Set(out));
}
