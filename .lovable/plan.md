

## Plan: Sincronización automática de requisitos documentales Nivel → Matrículas

### Problema actual

Los requisitos documentales se generan una sola vez al crear la matrícula (`matriculaService.create` → `getDocumentosRequeridos`). Si un administrador agrega un nuevo requisito al Nivel de Formación después de la creación, las matrículas existentes no lo reflejan.

### Solución

Agregar una función de sincronización que, al consultar una matrícula, compare sus documentos actuales contra los requisitos vigentes del nivel y añada los faltantes sin alterar los ya cargados.

### Cambios

#### 1. `src/services/documentoService.ts` — nueva función `sincronizarDocumentos`

Crear función `sincronizarDocumentos(documentosActuales, nivelFormacionKey)`:
- Obtiene los requisitos vigentes del nivel via `getDocumentosRequeridos`
- Compara por `tipo`: identifica requisitos que existen en el nivel pero no en la matrícula
- Agrega los faltantes con estado `pendiente`
- Retorna el array combinado (existentes intactos + nuevos)
- No elimina documentos que ya no estén en el nivel (datos históricos se preservan)

#### 2. `src/services/matriculaService.ts` — sincronizar al consultar

Modificar `getById(id)`:
- Después de encontrar la matrícula, obtener el `empresaNivelFormacion` (o el nivel del curso asociado)
- Llamar `sincronizarDocumentos(matricula.documentos, nivelKey)`
- Si hay nuevos documentos, actualizar `matricula.documentos` y `matricula.updatedAt` en el mock
- Retornar la matrícula actualizada

Esto garantiza que al abrir cualquier matrícula existente, los nuevos requisitos aparezcan automáticamente.

#### 3. `src/pages/niveles/NivelDetallePage.tsx` — sin cambios UI

No se requieren cambios en la UI de niveles. La sincronización es transparente: el admin añade el requisito en el nivel, y al abrir cualquier matrícula de ese nivel, los nuevos requisitos ya están visibles.

### Archivos afectados
| Archivo | Cambio |
|---|---|
| `src/services/documentoService.ts` | Nueva función `sincronizarDocumentos` |
| `src/services/matriculaService.ts` | Llamar sincronización en `getById` |

### Lo que NO cambia
- `DocumentosCarga.tsx` — ya renderiza dinámicamente lo que reciba en `documentos`
- Documentos ya cargados (estado `cargado`) se preservan intactos
- El flujo de creación de matrícula sigue igual

