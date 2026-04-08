

# Plan: Persistir el campo "Representante Legal" en la base de datos

## Problema

La tabla `empresas` en la base de datos **no tiene** una columna `representante_legal`. El servicio `empresaService.ts` confirma esto:
- `mapEmpresaRow` siempre retorna `representanteLegal: ''` (hardcoded)
- `mapEmpresaToDb` no incluye ningún mapeo para `representanteLegal`

El formulario captura el dato correctamente, pero al guardarlo se descarta porque no hay dónde almacenarlo.

## Solución

### Paso 1: Migración SQL
Agregar la columna `representante_legal` a la tabla `empresas`:

```sql
ALTER TABLE public.empresas
ADD COLUMN representante_legal text DEFAULT '';
```

### Paso 2: Actualizar `src/services/empresaService.ts`

- En `mapEmpresaRow`: cambiar `representanteLegal: ''` por `representanteLegal: row.representante_legal || ''`
- En `mapEmpresaToDb`: agregar el mapeo `if (data.representanteLegal !== undefined) result.representante_legal = data.representanteLegal || null;`

## Archivos afectados

| Paso | Archivo | Cambio |
|------|---------|--------|
| 1 | 1 migración SQL | Agregar columna `representante_legal` |
| 2 | `src/services/empresaService.ts` | Mapear lectura y escritura del campo |

**Total: 1 archivo editado, 1 migración**

