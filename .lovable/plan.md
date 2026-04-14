

# Plan: Sincronización real de documentos por nivel y correcciones de UI

## Problemas identificados

### Problema 1: Los documentos no se ajustan al cambiar de nivel
`sincronizarDocumentos()` solo **agrega** documentos faltantes, nunca **elimina** los que ya no corresponden al nivel. Además, cuando el usuario cambia el nivel de formación en la vista de detalle, la sincronización no se vuelve a ejecutar porque el flag `docsSynced` ya está en `true`.

### Problema 2: El subtítulo muestra el ID en vez del nombre
`resolveNivelFormacionLabel()` usa un caché en memoria que no se invalida cuando se crea un nivel nuevo. Si el caché no contiene el nivel recién creado, retorna el UUID crudo.

### Problema 3: El texto del nivel se desborda visualmente
El componente `Combobox` no aplica `truncate` al texto del botón, lo que permite que nombres largos desborden el contenedor.

---

## Fase 1: Sincronización completa de documentos (archivo: `src/services/documentoService.ts`)

Refactorizar `sincronizarDocumentos` para que realice una **sincronización bidireccional**:
- Agregar documentos que faltan según el nivel actual
- **Eliminar** documentos que ya no están en los requisitos del nivel **solo si están en estado `pendiente`** (sin archivo cargado). Los documentos que ya fueron cargados o aprobados se conservan para no perder trabajo del usuario.

```text
Antes:  solo inserta faltantes
Después: inserta faltantes + elimina sobrantes pendientes
```

### Verificación Fase 1
Cambiar el nivel de formación de una matrícula existente → los documentos deben ajustarse automáticamente al abrir el detalle.

---

## Fase 2: Re-sincronizar al cambiar nivel en detalle (archivos: `MatriculaDetallePage.tsx`, `MatriculaDetailSheet.tsx`)

Actualmente `docsSynced` es un flag que se pone en `true` una sola vez. Cuando el usuario cambia el nivel de formación y guarda, el efecto no se vuelve a disparar.

**Solución**: Resetear `docsSynced` a `false` cuando `matricula.nivelFormacionId` cambie (ya está en las dependencias del `useEffect`, pero `docsSynced` bloquea la re-ejecución). Agregar lógica para detectar cambio efectivo del nivel y forzar re-sync.

### Verificación Fase 2
1. Abrir detalle de una matrícula
2. Cambiar el nivel de formación y guardar
3. Los documentos deben actualizarse sin necesidad de recargar la página

---

## Fase 3: Corregir visualización del nombre del nivel

### 3.1 Invalidar caché al crear/editar niveles (`src/hooks/useNivelesFormacion.ts`)
Llamar a `invalidateNivelesCache()` en los `onSuccess` de `useCreateNivelFormacion` y `useUpdateNivelFormacion`, y también invocar `preloadNiveles()` al inicio de la aplicación para que el caché esté disponible desde el primer render.

### 3.2 Precargar caché en `App.tsx` o en el layout principal
Invocar `preloadNiveles()` una vez al montar la aplicación para que `resolveNivelFormacionLabel` tenga datos disponibles sincrónicamente.

### Verificación Fase 3
Crear un nuevo nivel de formación → al asignarlo a una matrícula, el panel lateral debe mostrar el nombre (no el UUID) en el subtítulo del encabezado.

---

## Fase 4: Corregir desbordamiento de texto

### 4.1 Combobox (`src/components/ui/combobox.tsx`)
Agregar `truncate` y `min-w-0` al contenedor del texto del botón (línea 63):
```tsx
<span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
```

### 4.2 EditableField — renderValue (`src/components/shared/EditableField.tsx`)
En el `renderValue` (línea 114-118), agregar `truncate` al `<span>`:
```tsx
<span className={cn("truncate", isEmpty && "text-muted-foreground italic")}>
```

### Verificación Fase 4
Asignar un nivel con nombre largo (ej. "Jefes de área para trabajos en alturas") → el texto debe cortarse con puntos suspensivos tanto en el selector como en la vista estática, en ambas vistas (panel lateral y página completa).

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/services/documentoService.ts` | Sincronización bidireccional (agregar + eliminar pendientes sobrantes) |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Resetear `docsSynced` al cambiar nivel |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Resetear `docsSynced` al cambiar nivel |
| `src/hooks/useNivelesFormacion.ts` | Invalidar caché en `onSuccess` de create/update |
| `src/components/ui/combobox.tsx` | Truncate en botón |
| `src/components/shared/EditableField.tsx` | Truncate en renderValue |
| `src/App.tsx` o `src/components/layout/MainLayout.tsx` | Precargar niveles al montar |

## Impacto
- Sin cambios en la estructura de BD, storage, ni edge functions
- Sin cambios en `DocumentosCarga.tsx` ni `driveService.ts`
- Los documentos con archivos cargados nunca se eliminan automáticamente (protección de datos)
- La lógica de creación de matrículas nuevas no se afecta

## Respuesta sobre almacenamiento de documentos
Los archivos cargados se almacenan en el bucket de Storage llamado **`documentos-matricula`** (privado). Las referencias se guardan en la tabla `documentos_matricula` con los campos `storage_path`, `archivo_nombre` y `archivo_tamano`.

