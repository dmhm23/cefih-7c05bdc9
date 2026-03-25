

## Plan: Corregir filtro de formatos por tipo de curso

### Diagnóstico

El problema está en `src/services/formatoFormacionService.ts`, método `getForMatricula`. Recibe `curso.tipoFormacion` (un ID de nivel como `'nf1'`, `'nf3'`) pero lo compara contra `tipoCursoKeys` que contienen keys legibles como `'reentrenamiento'`, `'trabajador_autorizado'`. Nunca coinciden, por lo que la lista siempre devuelve vacío.

### Causa

Los cursos guardan `tipoFormacion: 'nf1'` (ID del nivel), pero los formatos definen `tipoCursoKeys: ['reentrenamiento']` (nombre normalizado). No existe un mapeo entre ambos.

### Solución

Actualizar `getForMatricula` para traducir el `tipoCurso` (ID de nivel) a su key correspondiente antes de filtrar. Se agrega un diccionario de mapeo dentro del servicio.

### Cambio — `src/services/formatoFormacionService.ts` (líneas 340-350)

Agregar un mapa de traducción:

```
const NIVEL_TO_TIPO_CURSO: Record<string, string> = {
  nf1: 'reentrenamiento',
  nf2: 'jefe_area',
  nf3: 'trabajador_autorizado',
  nf5: 'coordinador_ta',
};
```

Y modificar `getForMatricula` para usar el mapeo:

```ts
getForMatricula: async (tipoCurso: string): Promise<FormatoFormacion[]> => {
  const tipoCursoKey = NIVEL_TO_TIPO_CURSO[tipoCurso] || tipoCurso;
  const results = mockFormatos.filter(f =>
    f.activo &&
    f.visibleEnMatricula &&
    (f.asignacionScope === 'tipo_curso'
      ? f.tipoCursoKeys.includes(tipoCursoKey as any)
      : true)
  );
  return simulateApiCall(results);
},
```

### Archivo modificado
- `src/services/formatoFormacionService.ts`

