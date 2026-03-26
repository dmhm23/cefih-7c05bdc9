import { AutoFieldKey } from '@/types/formatoFormacion';
import { resolveAutoFieldValue, AutoFieldContext } from './resolveAutoField';
import { getAllTokens } from '@/data/tokenSources';
import { Persona } from '@/types/persona';
import { Matricula } from '@/types/matricula';
import { Curso } from '@/types/curso';
import { Personal } from '@/types/personal';

/**
 * Replace all {{grupo.campo}} tokens in an HTML template with resolved values.
 */
export function renderTemplate(
  html: string,
  context: Record<string, Record<string, string | null>>
): string {
  return html.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_match, group, field) => {
    const value = context[group]?.[field];
    return value ?? `<span style="background:#fef3c7;padding:1px 4px;border-radius:3px;font-size:11px;color:#92400e;">{{${group}.${field}}}</span>`;
  });
}

/**
 * Detect unresolved tokens in rendered HTML.
 */
export function detectUnresolvedTokens(renderedHtml: string): string[] {
  const matches = renderedHtml.match(/\{\{(\w+\.\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(2, -2)))];
}

/**
 * Build a context dictionary from system entities, reusing resolveAutoField internally.
 */
export function buildFormatoContext(
  persona: Persona | null,
  matricula: Matricula | null,
  curso: Curso | null,
  entrenador: Personal | null,
  supervisor: Personal | null
): Record<string, Record<string, string | null>> {
  const ctx: AutoFieldContext = { persona, matricula, curso, entrenador, supervisor };
  const tokens = getAllTokens();

  const result: Record<string, Record<string, string | null>> = {};

  for (const token of tokens) {
    const [group, field] = token.key.split('.');
    if (!result[group]) result[group] = {};
    result[group][field] = resolveAutoFieldValue(token.autoFieldKey as AutoFieldKey, ctx);
  }

  return result;
}
