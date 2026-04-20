

## Plan: Desacoplar el Portal del Estudiante del `curso_id`

### Principio rector
La **matrícula activa con `nivel_formacion_id`** es la única condición para habilitar el Portal. El curso pasa a ser **contexto complementario** (fechas, nombre), nunca requisito de acceso ni fuente del nivel.

---

### Cambios estructurales

#### 1. Base de datos — migración SQL única

**A. Reescribir `login_portal_estudiante`:**
- Eliminar el `JOIN` obligatorio a `cursos`. Pasarlo a `LEFT JOIN`.
- Condición de acceso válida: `matriculas.deleted_at IS NULL AND activo = TRUE AND nivel_formacion_id IS NOT NULL`.
- Selección de la matrícula a usar (en este orden):
  1. Matrícula activa con `nivel_formacion_id` y curso en estado `programado` o `en_curso`.
  2. Matrícula activa con `nivel_formacion_id` y **sin curso**.
  3. Matrícula activa con `nivel_formacion_id` y curso `cerrado`/`cancelado` → devuelve `curso_cerrado` solo si **no hay** ninguna otra matrícula válida.
- Devolver siempre el `tipo_formacion` resuelto desde `niveles_formacion` (vía `matriculas.nivel_formacion_id`), no desde el curso.
- Cuando no haya curso, devolver `curso_id = NULL`, `curso_nombre = nombre del nivel`, `curso_tipo_formacion` desde el nivel.
- Resultados posibles: `ok`, `portal_deshabilitado`, `sin_matricula` (nuevo, reemplaza `sin_curso` cuando no hay matrícula con nivel), `persona_no_encontrada`. Mantener `curso_cerrado` como caso residual.

**B. Reescribir `get_documentos_portal`:**
- Resolver el nivel con `COALESCE(matriculas.nivel_formacion_id, cursos.nivel_formacion_id)` — la matrícula manda, el curso es fallback.
- Cambiar `JOIN cursos` por `LEFT JOIN cursos` para soportar matrículas sin curso.
- Resto de la lógica (`niveles_habilitados`, dependencias) intacta.

**C. Verificar consistencia con funciones ya alineadas:**
- `get_formatos_for_matricula`: ya prioriza `matriculas.nivel_formacion_id`. No se toca.
- `autogenerar_formato_respuestas`: ya usa `matriculas.nivel_formacion_id`. No se toca.

#### 2. Frontend

**A. `src/services/portalEstudianteService.ts`**
- `mapMinimalCurso`: tolerar `curso_id = NULL`. Cuando no haya curso, construir un objeto sintético con `id=null`, `nombre = curso_nombre devuelto por el RPC`, sin fechas.
- Manejar el nuevo resultado `sin_matricula`.

**B. `src/contexts/PortalEstudianteContext.tsx`**
- `PortalSession`: hacer `cursoFechaInicio`, `cursoFechaFin` opcionales (ya lo son) y aceptar `matriculaId` sin requerir curso.

**C. `src/pages/estudiante/PortalGuard.tsx`**
- Si la sesión no trae `cursoFechaInicio`/`cursoFechaFin`, omitir validación de vigencia por fechas. La protección de acceso vive en el RPC del backend.
- Mantener el redirect a `/estudiante` solo cuando no haya `session`.

**D. `src/pages/estudiante/AccesoEstudiantePage.tsx`** (revisar mensajes)
- Mapear el nuevo resultado `sin_matricula` a un mensaje claro: *"No se encontró una matrícula activa para esta cédula"*.
- Mantener mensajes existentes para `curso_cerrado`, `portal_deshabilitado`, `persona_no_encontrada`.

**E. `src/pages/estudiante/PanelDocumentosPage.tsx` y vistas dependientes**
- Mostrar el nombre del curso solo cuando exista; si no, mostrar el nombre del nivel como contexto.
- Ocultar fechas de curso si vienen vacías.

---

### Archivos tocados

| Archivo | Tipo de cambio |
|---|---|
| `supabase/migrations/<timestamp>_portal_acceso_por_matricula.sql` | Nueva migración con redefinición de `login_portal_estudiante` y `get_documentos_portal` |
| `src/services/portalEstudianteService.ts` | Tolerar `curso_id NULL`; manejar resultado `sin_matricula` |
| `src/contexts/PortalEstudianteContext.tsx` | Confirmar opcionalidad de fechas de curso |
| `src/pages/estudiante/PortalGuard.tsx` | Omitir validación de fechas si no hay curso |
| `src/pages/estudiante/AccesoEstudiantePage.tsx` | Mapear nuevo resultado `sin_matricula` |
| `src/pages/estudiante/PanelDocumentosPage.tsx` | Render condicional del bloque de curso |

### Validación post-cambio

- **Estudiantes reportados (`1110535624`, `93411594`, `1030618422`)** con matrícula activa y nivel Reentrenamiento: deben entrar al portal y ver los documentos del nivel, exista o no curso vigente.
- **Matrícula con nivel y sin curso:** debe acceder y ver documentos derivados del nivel.
- **Matrícula con nivel y curso vigente:** flujo actual sin cambios.
- **Persona sin ninguna matrícula con nivel:** mensaje `sin_matricula`.
- **Persona con todas sus matrículas en cursos cerrados pero con nivel:** debe entrar igualmente (la matrícula sigue siendo válida; el cierre del curso no inhabilita el portal).
- **Persona sin personas en BD:** `persona_no_encontrada`.

### Sin impacto colateral

- No modifica esquema de tablas ni triggers.
- No afecta generación automática de `formato_respuestas` (ya alineada).
- Lógica de cierre de curso, certificación y cartera intactas.
- Vista interna de matrículas (`/matriculas`) no se toca.

