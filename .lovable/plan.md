

# Plan: Corregir logo en encabezados de formatos y optimizar reutilización

## Causa raíz

Tres problemas interrelacionados:

1. **`DynamicFormatoDocument.tsx` ignora el bloque `document_header`**: Renderiza un `DocumentHeader` hardcoded (línea 562) sin pasar `logoUrl` ni `borderColor`. El `renderBloque` no tiene `case 'document_header'` — cae al `default: return null`. Resultado: el logo configurado en el editor nunca aparece en Matrículas ni Portal Estudiante.

2. **Logos se almacenan como Base64 en JSON**: El inspector (`InspectorFields.tsx`, línea 794) convierte la imagen a `data:image/...;base64,...` y la guarda directamente en `props.logoUrl` del bloque. Esto infla el JSONB de `formatos_formacion.bloques` (un logo típico pesa 50-200KB en Base64). La memoria del proyecto ya indica que deben usarse URLs de Storage.

3. **No hay reutilización de logos**: Cada formato obliga al usuario a subir un archivo nuevo. No existe una galería de logos ya cargados.

## Puntos afectados

| Componente | Problema |
|---|---|
| `DynamicFormatoDocument.tsx` (Matrículas) | No lee `document_header` block → sin logo personalizado |
| `DynamicFormatoPreviewDialog.tsx` (Portal) | Usa `DynamicFormatoDocument` → mismo problema |
| `InspectorFields.tsx` (Editor) | Guarda Base64 en JSON en vez de subir a Storage |
| `EvaluacionReentrenamientoDocument.tsx` | Legacy: logo hardcoded, no afectado pero no reutiliza |

## Solución

### 1. Storage bucket para logos de formatos
Crear un bucket `logos-formatos` (público) para almacenar los logos. Migración SQL.

### 2. Subir logo a Storage desde el editor
Modificar `DocumentHeaderInspector` en `InspectorFields.tsx`:
- Al seleccionar un archivo, subirlo a `logos-formatos/{uuid}.{ext}` vía Supabase Storage
- Guardar la URL pública en `props.logoUrl` (no Base64)
- Mostrar galería de logos existentes consultando el bucket

### 3. Galería de logos reutilizables
Agregar en `DocumentHeaderInspector` una sección "Logos disponibles" que lista los archivos del bucket `logos-formatos`. El usuario puede:
- Seleccionar uno existente (un clic)
- O subir uno nuevo

### 4. Renderizar `document_header` en `DynamicFormatoDocument.tsx`
Cambiar la lógica del componente principal para que:
- Detecte si existe un bloque `document_header` en los bloques (igual que hace `FormatoPreviewDocument.tsx` línea 430)
- Si existe: renderizarlo con sus props (logo, empresa, etc.) — agregar `case 'document_header'` en `renderBloque`
- Si no existe: mantener el `DocumentHeader` por defecto actual (fallback)

```typescript
// En renderBloque, agregar:
case "document_header": {
  const hp = (bloque as any).props || {};
  return (
    <div style={{ gridColumn: "span 2" }}>
      <DocumentHeader
        nombreDocumento={bloque.label || formato.nombre}
        codigo={hp.codigo || formato.codigo}
        version={hp.version || formato.version}
        fechaCreacion={hp.fechaCreacion || meta?.fechaCreacion || "—"}
        fechaEdicion={hp.fechaEdicion || meta?.fechaEdicion || "—"}
        empresaNombre={hp.empresaNombre}
        sistemaGestion={hp.sistemaGestion}
        subsistema={hp.subsistema || "FORMACIÓN"}
        logoUrl={hp.logoUrl || undefined}
        borderColor={hp.borderColor || undefined}
      />
    </div>
  );
}
```

Y en el componente principal:
```typescript
const hasHeaderBlock = bloques.some(b => b.type === 'document_header');

// Solo renderizar el fallback si NO hay bloque document_header
{!hasHeaderBlock && (
  <DocumentHeader
    nombreDocumento={formato.nombre}
    codigo={formato.codigo}
    ...
  />
)}
```

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| Migración SQL | Crear bucket `logos-formatos` (público) con RLS |
| `src/components/formatos/editor/InspectorFields.tsx` | Subir a Storage + galería de logos existentes |
| `src/components/matriculas/formatos/DynamicFormatoDocument.tsx` | Agregar `case 'document_header'` y lógica condicional de fallback |

## Archivos que NO se tocan
- `DocumentHeader.tsx` — ya soporta `logoUrl`
- `FormatoPreviewDocument.tsx` — ya maneja correctamente el bloque `document_header`
- `BlockPreview.tsx` — ya renderiza la vista previa en el editor
- Formatos legacy (Asistencia, PTA/ATS, Evaluación) — tienen encabezados hardcoded por diseño

