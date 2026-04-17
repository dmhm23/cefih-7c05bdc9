

## Plan de corrección: Sincronización Formatos ↔ Portal Estudiante

### Contexto del problema (recap)
Identificamos 6 puntos donde la lógica actual genera comportamientos confusos o incorrectos:

1. **Filtro engañoso en catálogo del portal** — Formatos ya registrados desaparecen del dropdown sin explicación.
2. **Auto-sync oculto** desde el editor de formatos hacia `portal_config_documentos` (sin que el usuario lo sepa).
3. **Falsos "Completados"** por triggers bidireccionales (`sync_formato_respuestas_to_portal` ↔ `sync_portal_to_formato_respuestas`) que usan `LIMIT 1` sobre `formato_id`.
4. **Doble fuente de verdad**: el editor de formatos y el panel admin del portal escriben sobre el mismo catálogo.
5. **Defaults peligrosos** en el editor (`activo: true`, `visibleEnPortalEstudiante`) que pueden re-activar formatos al guardar.
6. **`documento_key` colisiona con IDs legacy** (`info_aprendiz`, `evaluacion`) y con `formato.id` UUID, generando matches incorrectos en triggers.

---

### Priorización (3 fases)

**Fase 1 — Detener el sangrado (alta prioridad, bajo riesgo)**
Objetivo: que el bug visible no siga ocurriendo y dar visibilidad al usuario.

1.1. **Arreglar filtro del dropdown en `DocumentoConfigDialog`**
- Mostrar los formatos ya registrados pero deshabilitados con etiqueta "Ya está en el portal".
- Así el usuario entiende por qué un formato no aparece como nuevo.

1.2. **Hacer visible el auto-sync en `formatoFormacionService.syncPortalConfig`**
- Cuando se guarda un formato con `visibleEnPortalEstudiante=true`, mostrar toast: "Sincronizado con el catálogo del Portal".
- Cuando se desactiva, toast: "Removido del Portal".
- No se cambia la lógica todavía, solo se hace explícita.

1.3. **Limpiar el "Completado" falso del formato EVALUACIÓN de Oscar**
- Migración puntual de datos: `DELETE FROM documentos_portal WHERE matricula_id = <oscar> AND documento_key = <evaluacion-id>` si el `formato_respuestas` correspondiente está en estado `pendiente`.

---

**Fase 2 — Corregir la causa raíz de los falsos "Completados" (prioridad media-alta)**
Objetivo: que ningún nuevo formato herede estado de otro por colisión de keys.

2.1. **Endurecer triggers `sync_formato_respuestas_to_portal` y `sync_portal_to_formato_respuestas`**
- Reemplazar `SELECT ... LIMIT 1` por matching estricto: `WHERE formato_id = NEW.formato_id AND key = NEW.formato_id::text`.
- Validar que el `documento_key` corresponde **exactamente** al `formato.id`, no a aliases legacy.

2.2. **Garantizar unicidad en `portal_config_documentos`**
- Agregar constraint `UNIQUE (formato_id)` para que un formato no pueda estar registrado dos veces.
- Validar que `key = formato_id::text` para entradas nuevas (las legacy `info_aprendiz` / `evaluacion` siguen funcionando porque no tienen `formato_id`).

---

**Fase 3 — Eliminar la doble fuente de verdad (prioridad media, requiere decisión UX)**
Objetivo: que solo un lugar controle el catálogo del portal.

3.1. **Definir fuente única**:
- Opción A (recomendada): `formatos_formacion.visible_en_portal_estudiante` es la fuente de verdad. El panel `portal-admin` se vuelve **solo lectura + ordenamiento + dependencias** (no agrega/quita formatos).
- Opción B: el panel `portal-admin` es la fuente de verdad. El switch del editor desaparece o solo informa.

3.2. **Quitar defaults peligrosos del store del editor**
- `useFormatoEditorStore`: al cargar un formato existente, no resetear `activo` ni `visibleEnPortalEstudiante` a `true` por defecto. Respetar lo que viene de BD.

3.3. **Documentar el flujo en `Docs/`**
- Nuevo archivo `Docs/sincronizacionPortalFormatos.md` con diagrama del flujo definitivo.

---

### Detalles técnicos por fase

**Archivos afectados Fase 1:**
- `src/components/portal-admin/DocumentoConfigDialog.tsx` (filtro + UI)
- `src/services/formatoFormacionService.ts` (toasts en `syncPortalConfig`)
- 1 migración de datos puntual para Oscar

**Archivos afectados Fase 2:**
- 1 migración SQL: redefinir 2 funciones trigger + agregar constraint UNIQUE
- Validación previa: revisar que no existan duplicados actuales antes de aplicar UNIQUE

**Archivos afectados Fase 3:**
- `src/stores/useFormatoEditorStore.ts` (defaults)
- `src/components/portal-admin/DocumentosCatalogoTable.tsx` (modo solo-lectura si Opción A)
- `src/pages/portal-admin/PortalAdminPage.tsx`
- `Docs/sincronizacionPortalFormatos.md` (nuevo)

---

### Pregunta antes de implementar

Antes de ejecutar necesito que decidas **Fase 3 — fuente única de verdad**:

- **Opción A (recomendada)**: El editor de formatos controla todo (switch "Visible en portal" + activo). El panel admin del portal solo ordena y configura dependencias/niveles. Más simple, menos pasos para crear un formato visible.
- **Opción B**: El panel admin del portal controla qué formatos están en el portal. El editor solo crea formatos; agregarlos al portal es un paso explícito separado. Más control, más fricción.

¿Cuál prefieres? También puedes aprobar solo Fase 1 y Fase 2 y dejar la Fase 3 para después si quieres validar primero los arreglos urgentes.

