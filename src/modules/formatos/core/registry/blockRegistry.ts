/**
 * Implementación in-memory del BlockRegistryPort.
 */
import type { BlockDefinition, BlockRegistryPort } from '../../contracts/BlockRegistryPort';

export function createBlockRegistry(): BlockRegistryPort {
  const map = new Map<string, BlockDefinition>();

  return {
    register<TProps>(definition: BlockDefinition<TProps>) {
      map.set(definition.type, definition as unknown as BlockDefinition);
    },
    get(type: string) {
      return map.get(type);
    },
    list() {
      return Array.from(map.values());
    },
    has(type: string) {
      return map.has(type);
    },
  };
}
