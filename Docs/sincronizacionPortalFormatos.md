# Sincronización Portal Estudiante ↔ Formatos de Formación

> **Fuente única de verdad:** `formatos_formacion.visible_en_portal_estudiante`
> El editor de formatos es el único lugar donde se agrega o se quita un formato del Portal Estudiante.

## 1. Visión general

El Portal Estudiante muestra al aprendiz una lista de documentos para diligenciar.
Esa lista proviene de dos tablas que deben mantenerse sincronizadas:

| Tabla | Rol |
|---|---|
| `formatos_formacion` | Definición del formato (bloques, validaciones, niveles asignados, visibilidad). |
| `portal_config_documentos` | Catálogo del portal: orden, dependencias, niveles habilitados, label visible. |
| `formato_respuestas` | Respuestas que el estudiante envía desde la matrícula. |
| `documentos_portal` | Estado del documento dentro del portal del estudiante (pendiente / completado). |

## 2. Quién manda sobre qué

| Acción | Lugar |
|---|---|
| Crear / editar el contenido de un formato | Editor de formatos (`/formatos/:id/edit`) |
| **Agregar / quitar** un formato del catálogo del portal | Editor de formatos → switch *"Visible en portal estudiante"* |
| Reordenar documentos del portal | Panel `/admin/portal` |
| Configurar dependencias entre documentos | Panel `/admin/portal` |
| Habilitar / deshabilitar por nivel | Panel `/admin/portal` |

El panel `/admin/portal` **no permite** agregar ni eliminar formatos del catálogo.
Si un formato no aparece en el panel, hay que activar *"Visible en portal estudiante"* en su editor.

## 3. Flujo de sincronización

```
┌──────────────────────────────┐
│  Editor de formatos          │
│  visible_en_portal = true    │
│  activo = true               │
└──────────────┬───────────────┘
               │  syncPortalConfig()  ← service-side, transparente
               ▼
┌──────────────────────────────┐
│  portal_config_documentos    │
│  key = formato.id (UUID)     │
│  formato_id = formato.id     │
│  activo = true               │
└──────────────────────────────┘
```

Al guardar un formato:

1. El service `formatoFormacionService.update` ejecuta `syncPortalConfig`.
2. Devuelve un resultado con la acción aplicada (`added`, `reactivated`, `updated`, `deactivated`).
3. El hook `useUpdateFormato` muestra un toast informativo para que el usuario sepa qué pasó en el portal.

Las entradas legacy `info_aprendiz` y `evaluacion` que se crearon antes de la migración a UUID
no tienen `formato_id` y siguen funcionando como entradas independientes.

## 4. Sincronización de respuestas

Existen dos triggers en la base de datos que mantienen `documentos_portal` y `formato_respuestas` consistentes:

- `sync_formato_respuestas_to_portal`: cuando un `formato_respuestas` pasa a `completado`,
  marca el `documentos_portal` correspondiente como `completado`.
- `sync_portal_to_formato_respuestas`: el inverso.

**Regla estricta:** ambos triggers solo emparejan filas cuando
`portal_config_documentos.key = formato_id::text`. Esto evita que entradas legacy
(`info_aprendiz`, `evaluacion`) hereden estado por error de formatos modernos.

## 5. Garantías

- `portal_config_documentos` tiene un índice único parcial sobre `formato_id` (donde `formato_id IS NOT NULL`),
  garantizando que un formato no pueda registrarse dos veces en el catálogo.
- El hook `useUpdateFormato` notifica con un toast cualquier cambio que el guardado del formato
  haya provocado en el catálogo del portal.

## 6. Cómo agregar un formato nuevo al portal

1. Abrir `/formatos` y crear o editar el formato.
2. En la configuración del formato, activar **"Visible en portal estudiante"**.
3. Guardar. Aparecerá un toast `Formato agregado al catálogo del Portal Estudiante`.
4. (Opcional) Ir a `/admin/portal` → ajustar orden, dependencias y niveles habilitados.

## 7. Cómo quitar un formato del portal

1. Abrir el formato en el editor.
2. Desactivar **"Visible en portal estudiante"** (o desactivar el formato completo).
3. Guardar. Aparecerá un toast `Formato removido del Portal Estudiante`.
La fila en `portal_config_documentos` se desactiva (`activo = false`); no se borra para
preservar la configuración de dependencias en caso de reactivación.

## 8. Errores conocidos resueltos

| Síntoma | Causa raíz | Resolución |
|---|---|---|
| Formato no aparece en el dropdown del panel admin | Filtro excluía formatos ya registrados sin avisar | Ahora se muestran deshabilitados con etiqueta "Ya está en el portal" |
| Formato nuevo aparece como "Completado" sin diligenciar | Triggers usaban `LIMIT 1` por `formato_id`; entradas legacy podían colisionar | Triggers ahora exigen `key = formato_id::text` |
| Cambios silenciosos en el catálogo al guardar un formato | `syncPortalConfig` no notificaba al usuario | Toast en el hook `useUpdateFormato` con la acción aplicada |
| Doble fuente de verdad confusa | Editor y panel admin podían crear/borrar formatos del catálogo | Panel admin queda solo lectura para alta/baja; el switch del editor manda |
