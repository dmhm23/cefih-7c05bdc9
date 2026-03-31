

## Plan: Corregir tipo "ARL" en cartera

### Problema

En `src/services/carteraService.ts`, línea 98, la condición solo verifica `tipoVinculacion === 'empresa'`. Cuando el tipo es `'arl'`, cae al bloque `else` (línea 115) que crea el responsable como `'independiente'`.

### Solución

Cambiar la condición en línea 98 para incluir `'arl'`:

```typescript
// Antes
if (tipoVinculacion === 'empresa' && empresaNit) {

// Después  
if ((tipoVinculacion === 'empresa' || tipoVinculacion === 'arl') && empresaNit) {
```

Y ajustar la asignación del `tipo` en línea 106 para que use el `tipoVinculacion` real en vez de hardcodear `'empresa'`:

```typescript
// Antes
tipo: 'empresa' as TipoResponsable,

// Después
tipo: tipoVinculacion as TipoResponsable,
```

### Archivo afectado

| Archivo | Cambio |
|---|---|
| `src/services/carteraService.ts` | Incluir `'arl'` en la condición de agrupación y usar `tipoVinculacion` dinámico para el tipo del responsable |

