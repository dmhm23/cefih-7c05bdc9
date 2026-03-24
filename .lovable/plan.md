## Plan: Actualizar datos mock para usar IDs de niveles de formación

### Problema

Los datos mock en `mockCursos` y `mockMatriculas` usan claves legacy (`'trabajador_autorizado'`, `'reentrenamiento'`, etc.) en lugar de los IDs reales de niveles (`'nf1'`, `'nf2'`, `'nf3'`, `'nf5'`). Aunque el resolver dinámico los traduce correctamente, los datos deben estar alineados con la fuente de verdad.

### Mapeo de claves legacy → IDs

```text
'reentrenamiento'        → 'nf1'
'jefe_area'              → 'nf2'
'trabajador_autorizado'  → 'nf3'
'coordinador_ta'         → 'nf5'
```

### Cambios en `src/data/mockData.ts`

**Cursos** — campo `tipoFormacion`:

- c1: `'trabajador_autorizado'` → `'nf3'`
- c2: `'reentrenamiento'` → `'nf1'`
- c3: `'coordinador_ta'` → `'nf5'`
- c4: `'trabajador_autorizado'` → `'nf3'`
- c5: `'jefe_area'` → `'nf2'`
- c6: `'reentrenamiento'` → `'nf1'`
- c7: `'coordinador_ta'` → `'nf5'`

**Matrículas** — campo `empresaNivelFormacion`:

- m1: `'trabajador_autorizado'` → `'nf3'`
- m3: `'reentrenamiento'` → `'nf1'`
- m4: `'coordinador_ta'` → `'nf5'`
- m5–m9: `'trabajador_autorizado'` → `'nf3'`
- m11–m14: `'reentrenamiento'` → `'nf1'`
- m16–m19: `'jefe_area'` → `'nf2'`
- m20–m23: `'reentrenamiento'` → `'nf1'`

**Nota**: m2, m10, m15, m24 son independientes sin `empresaNivelFormacion` — no requieren cambio.

### Cambios en `src/data/mockCertificados.ts`

- Línea 70: `tipoFormacion: 'jefe_area'` → `'nf2'`

### Sin otros archivos afectados

El resolver `resolveNivelLabel.ts` ya maneja tanto IDs como claves legacy, así que seguirá funcionando. Los datos simplemente quedarán alineados con la fuente de verdad.