# @formatos — Motor de formatos desacoplado

Módulo independiente para construir, renderizar y persistir formatos dinámicos.
Diseñado para ser extraído como librería npm sin cambios en el core.

## Principios

- **El core no conoce el dominio**. No importa `Persona`, `Matricula`, `Curso`, `Supabase`, ni nada del host.
- **Todo lo específico del dominio se conecta vía Ports** (interfaces): `StoragePort`, `TokenResolverPort`, `BlockRegistryPort`, `EventBusPort`.
- **Los bloques son extensibles** vía registry, no vía unión cerrada de tipos.
- **Los efectos secundarios** (sincronizar portal, propagar firmas) son responsabilidad del host vía eventos.

## Estructura

```
src/modules/formatos/
├── core/         # 100% genérico
│   ├── types/    # Formato, Bloque, Respuesta, TokenContext
│   ├── editor/   # Canvas, Inspector, BlockCatalog (UI genérica)
│   ├── renderer/ # FormatoRenderer (semántico + documental)
│   ├── engine/   # token resolution, validation, dependencies
│   └── registry/ # BlockRegistry, TokenResolverRegistry
├── contracts/    # Ports (interfaces)
├── adapters/     # Implementaciones concretas
│   ├── supabase/      # SupabaseStoragePort
│   └── safa-tokens/   # Resolvers SAFA (persona, matricula, curso, firma)
├── plugins/      # Bloques de dominio
│   └── safa/          # health_consent, evaluation_quiz, signature_*, etc.
├── gateway/      # FormatoGateway: API pública estable
└── index.ts      # Barrel: exporta solo Gateway + tipos públicos
```

## Uso desde el host

```ts
import { createFormatoGateway } from '@/modules/formatos';
import { createSupabaseStorage } from '@/modules/formatos/adapters/supabase';
import { registerSafaTokens } from '@/modules/formatos/adapters/safa-tokens';
import { registerSafaPlugins } from '@/modules/formatos/plugins/safa';

const gateway = createFormatoGateway({
  storage: createSupabaseStorage(),
});
registerSafaTokens(gateway.tokenRegistry);
registerSafaPlugins(gateway.blockRegistry);

const formatos = await gateway.getFormatos();
gateway.events.on('signature.captured', (e) => { /* host handles cascade */ });
```
