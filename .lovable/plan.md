# Plan: Centralizar código de estudiante como servicio de dominio puro

## Problema raíz

El cálculo del código de estudiante vive inline en `EnrollmentsTable` (línea 376-378), usa el índice del array **filtrado** (`idx` de `filtered.map`), no aparece en `/matriculas/:id`, y `certificadoGenerator.ts` usa una función completamente diferente (`generarCodigoCertificado`) que ignora la configuración del nivel de formación.

## Arquitectura propuesta

```text
┌─────────────────────────────────────────────────┐
│  src/utils/codigoEstudiante.ts  (funciones puras)│
│                                                   │
│  generarCodigoEstudiante()     ← ya existe, OK    │
│  calcularCodigosCurso()        ← NUEVA             │
│    Input: matriculas[], config, curso              │
│    1. Ordena por created_at ASC, desempate id ASC  │
│    2. Genera código para cada matrícula             │
│    3. Retorna Record<matriculaId, string>          │
│  resolverCodigoEstudiante()    ← NUEVA             │
│    Wrapper: dado un matriculaId + el mapa,         │
│    retorna el código o null                        │
└─────────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
┌────────┴─────────┐  ┌──────┴──────────────────┐
│  useCodigosCurso │  │  construirDiccionario    │
│  (hook: solo      │  │  Tokens (certificados)  │
│   fetch + delega) │  │  consume calcularCodigos│
└──────────────────┘  └─────────────────────────┘
    ▲         ▲                    ▲
    │         │                    │
Enrollments  Matricula       Certificacion
Table        DetallePage     Section
```

## Cambios detallados


| #   | Archivo                                              | Cambio                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/utils/codigoEstudiante.ts`                      | Agregar `calcularCodigosCurso(matriculas, config, curso)`: ordena por `created_at ASC, id ASC`, llama a `generarCodigoEstudiante` con el índice resultante, retorna `Record<string, string>`. Agregar `resolverCodigoEstudiante(matriculaId, mapa)` como helper de acceso. |
| 2   | `src/hooks/useCodigosCurso.ts`                       | **NUEVO**. Hook liviano que: (a) recibe `cursoId`, (b) consume `useMatriculasByCurso` + resolución del nivel, (c) delega a `calcularCodigosCurso`, (d) retorna `{ codigos, isLoading }`. Cero lógica de negocio en el hook.                                                |
| 3   | `src/components/cursos/EnrollmentsTable.tsx`         | Eliminar resolución local de `nivelConfig`/`codigoConfig` y el cálculo inline. Consumir `useCodigosCurso(curso.id)` y leer `codigos[m.id]`. Reemplazar badges "Sin regla"/"Desactivado" por guion `—`.                                                                     |
| 4   | `src/pages/matriculas/MatriculaDetallePage.tsx`      | Consumir `useCodigosCurso(matricula.cursoId)` en la tarjeta "Curso" del sidebar. Mostrar `codigos[matricula.id]` como texto `font-mono text-sm`. Si no hay curso: "Sin curso asignado". Si config no activa: no mostrar nada.                                              |
| 5   | `src/utils/certificadoGenerator.ts`                  | En `construirDiccionarioTokens`: agregar parámetro opcional `codigoEstudiante?: string` y asignarlo al token `codigoCertificado` (o al token que corresponda). Deprecar/eliminar `generarCodigoCertificado` (legacy).                                                      |
| 6   | `src/components/matriculas/CertificacionSection.tsx` | Consumir `useCodigosCurso` para obtener el código del estudiante y pasarlo a `construirDiccionarioTokens`.                                                                                                                                                                 |


## Criterio de orden (fuente de verdad)

```typescript
// En calcularCodigosCurso:
const ordenadas = [...matriculas]
  .sort((a, b) => {
    const cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return cmp !== 0 ? cmp : a.id.localeCompare(b.id);
  });
```

Esto garantiza que el consecutivo sea **determinista y estable frente a filtros de UI**, y se auto-compacta al eliminar un estudiante (porque el array se re-ordena sin vacíos).

## Casos límite


| Caso                                 | Comportamiento                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| Matrícula sin curso                  | `useCodigosCurso` no se ejecuta; se muestra "Sin curso asignado"                          |
| Nivel sin `config_codigo_estudiante` | `calcularCodigosCurso` retorna `{}` (mapa vacío); columna muestra `—`                     |
| Config con `activo: false`           | Igual que arriba                                                                          |
| Filtros activos en EnrollmentsTable  | Códigos no cambian (vienen del mapa precalculado sobre el array completo)                 |
| Estudiante removido del curso        | Query se invalida → `calcularCodigosCurso` se re-ejecuta → consecutivos se compactan      |
| Curso cambia `fechaInicio` o nivel   | Query se invalida → códigos se recalculan con la nueva config                             |
| Certificados                         | Usan el mismo código vía `construirDiccionarioTokens` con el parámetro `codigoEstudiante` |


## Validaciones post-implementación

1. En `/cursos/:id`, aplicar filtro de búsqueda → verificar que los códigos NO cambian
2. En `/matriculas/:id`, verificar que el código coincide con el de la tabla de inscritos
3. Remover un estudiante → verificar compactación de consecutivos (1,2,3 → quitar 2 → quedan 1,2)
4. Cambiar `fechaInicio` del curso → verificar que los códigos reflejan el nuevo año/mes
5. Generar certificado → verificar que el token `codigoCertificado` usa el código del estudiante correcto

**Total: 1 archivo nuevo, 4 archivos editados, 0 migraciones**