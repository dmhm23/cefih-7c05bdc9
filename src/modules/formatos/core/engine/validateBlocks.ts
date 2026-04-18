/**
 * Validación genérica de bloques delegando en su BlockDefinition.
 */
import type { BlockRegistryPort } from '../../contracts/BlockRegistryPort';
import type { Bloque } from '../types';

export interface ValidationIssue {
  blockId: string;
  message: string;
}

export function validateBlocks(
  bloques: Bloque[],
  registry: BlockRegistryPort,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const b of bloques) {
    const def = registry.get(b.type);
    if (!def) {
      issues.push({ blockId: b.id, message: `Tipo de bloque desconocido: ${b.type}` });
      continue;
    }
    if (def.validate) {
      const errs = def.validate(b);
      for (const msg of errs) issues.push({ blockId: b.id, message: msg });
    }
  }
  return issues;
}
