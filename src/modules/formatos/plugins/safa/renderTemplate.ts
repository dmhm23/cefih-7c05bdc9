/**
 * Helpers de renderizado de plantillas con tokens `{{grupo.campo}}`.
 *
 * Es un módulo de conveniencia para el host SAFA cuando trabaja con
 * plantillas tipo HTML; los formatos basados en bloques no lo necesitan.
 */
import type { Persona } from '@/types/persona';
import type { Matricula } from '@/types/matricula';
import type { Curso } from '@/types/curso';
import type { Personal } from '@/types/personal';
import { resolveAutoFieldValue, type AutoFieldContext } from './autoFields/resolveAutoField';
import { getAllTokens } from './autoFields/tokenSources';
import type { AutoFieldKey } from './types';

export function renderTemplate(
  html: string,
  context: Record<string, Record<string, string | null>>,
): string {
  return html.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_match, group, field) => {
    const value = context[group]?.[field];
    return (
      value ??
      `<span style="background:#fef3c7;padding:1px 4px;border-radius:3px;font-size:11px;color:#92400e;">{{${group}.${field}}}</span>`
    );
  });
}

export function detectUnresolvedTokens(renderedHtml: string): string[] {
  const matches = renderedHtml.match(/\{\{(\w+\.\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

export function buildFormatoContext(
  persona: Persona | null,
  matricula: Matricula | null,
  curso: Curso | null,
  entrenador: Personal | null,
  supervisor: Personal | null,
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
