# Plan: Corregir carga de requisitos documentales en matrículas

## Diagnóstico

El problema es que **nunca se crean las filas de `documentos_matricula**` en la base de datos. La función `crearDocumentosMatricula` y `sincronizarDocumentos` existen en `src/services/documentoService.ts` pero **no se invocan desde ningún lugar**:

1. **Al crear matrícula** (`MatriculaFormPage.tsx`): se llama `createMatricula.mutateAsync()` pero nunca se ejecuta `crearDocumentosMatricula()` después.
2. **Al abrir detalle** (`MatriculaDetallePage.tsx`): no se llama `sincronizarDocumentos()` para verificar/crear documentos faltantes.

Resultado: `matricula.documentos` siempre es `[]`, por lo que `DocumentosCarga` no renderiza ningún documento ni botón de carga.

Para la matrícula actual (`6a65ed3a...`), además `curso_id` es `null`, lo que significa que no hay nivel de formación asociado — en ese caso el sistema debería al menos crear el requisito mínimo (Cédula) y un mensaje con buen UX y claro, como ej. asignar nivel de formación para carga de requisitos.

## Cambios propuestos

### 1. Crear documentos al crear matrícula

**Archivo**: `src/hooks/useMatriculas.ts` → `useCreateMatricula`

En el `onSuccess` del mutation, llamar `crearDocumentosMatricula(matricula.id, nivelFormacionId)`. Alternativamente, encadenar la llamada dentro del `mutationFn` después de `matriculaService.create()`.

```
mutationFn: async (data) => {
  const matricula = await matriculaService.create(data);
  // Obtener nivel del curso si existe
  let nivelId = undefined;
  if (data.cursoId) {
    const curso = await cursoService.getById(data.cursoId); // o query directa
    nivelId = curso?.nivelFormacionId;
  }
  await crearDocumentosMatricula(matricula.id, nivelId);
  return matricula;
}
```

### 2. Sincronizar documentos al cargar detalle

**Archivo**: `src/pages/matriculas/MatriculaDetallePage.tsx`

Agregar un `useEffect` que al cargar la matrícula llame `sincronizarDocumentos()` si el curso tiene un nivel de formación. Esto cubre matrículas existentes que no tienen documentos creados y también detecta nuevos requisitos añadidos al nivel.

```
useEffect(() => {
  if (matricula && curso?.nivelFormacionId) {
    sincronizarDocumentos(matricula.id, curso.nivelFormacionId)
      .then(({ huboCambios }) => {
        if (huboCambios) refetchMatricula();
      });
  }
}, [matricula?.id, curso?.nivelFormacionId]);
```

### 3. Fallback para matrículas sin curso

Cuando `curso_id` es `null`, llamar `sincronizarDocumentos(matriculaId, undefined)` para que al menos se cree el requisito mínimo (Cédula) y mostrar un mensaje con buen UX y claro, como ej. asignar nivel de formación para carga de requisitos.

## Archivos a modificar


| Archivo                                         | Cambio                                                       |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `src/hooks/useMatriculas.ts`                    | Encadenar `crearDocumentosMatricula` en `useCreateMatricula` |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Agregar `useEffect` con `sincronizarDocumentos`              |


## Impacto

- **Ningún cambio** en `DocumentosCarga.tsx`, `driveService.ts`, `matriculaService.ts` ni storage — todo el pipeline de subida ya funciona correctamente.
- Las matrículas existentes sin documentos se reparan automáticamente al abrir su detalle.