/**
 * API pública del módulo @formatos.
 *
 * El resto de la aplicación SAFA debería importar SOLO desde aquí:
 *   import { createFormatoGateway, formatosGateway } from '@/modules/formatos';
 */
export * from './core/types';
export * from './gateway';
export type {
  StoragePort,
  TokenResolverPort,
  TokenContext,
  TokenResolverFn,
  BlockRegistryPort,
  BlockDefinition,
  BlockInstance,
  EventBusPort,
  EventHandler,
  FormatoEvent,
  FormatoEventType,
} from './contracts';

// Singleton SAFA: gateway preconfigurado con adapters Supabase + tokens + plugins.
import { createFormatoGateway } from './gateway';
import { createSupabaseStorage } from './adapters/supabase';
import { registerSafaTokens } from './adapters/safa-tokens';
import { registerSafaPlugins } from './plugins/safa';

export const formatosGateway = createFormatoGateway({
  storage: createSupabaseStorage(),
});

registerSafaTokens(formatosGateway.tokenRegistry);
registerSafaPlugins(formatosGateway.blockRegistry);
