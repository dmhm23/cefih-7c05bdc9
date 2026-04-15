

# Plan: Mejorar UX de selección de logo en encabezado

## Estado actual

El código en `InspectorFields.tsx` (líneas 835-891) ya tiene:
- Upload a Storage funcionando
- Galería de logos existentes funcionando

Pero la UX actual muestra solo el botón "Subir logo…" y la galería como un link colapsable debajo. No es claro que hay dos opciones.

## Cambio propuesto

Cuando no hay logo seleccionado, mostrar **dos botones claros** en lugar del área de carga:
1. **"Galería"** — abre la grilla de logos existentes inline
2. **"Subir nuevo"** — abre el file input (flujo actual)

Cuando ya hay un logo seleccionado, se mantiene la vista actual (preview + botón X para quitar).

### Cambio en `InspectorFields.tsx` (líneas 854-890)

Reemplazar el bloque sin-logo y la galería colapsable por:

```tsx
{/* Sin logo: mostrar dos opciones */}
{!props.logoUrl && (
  <div className="space-y-2">
    <div className="flex gap-2">
      <Button
        variant="outline" size="sm"
        className="flex-1 text-xs"
        onClick={() => setShowGallery(!showGallery)}
        disabled={galleryLogos.length === 0}
      >
        <ImageIcon className="h-3 w-3 mr-1" />
        Galería ({galleryLogos.length})
      </Button>
      <label className="flex-1">
        <Button variant="outline" size="sm" className="w-full text-xs" asChild disabled={uploading}>
          <span>
            {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
            Subir nuevo
          </span>
        </Button>
        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
      </label>
    </div>
    {showGallery && galleryLogos.length > 0 && (
      <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto border rounded-md p-1.5">
        {galleryLogos.map(...)} {/* mismo código actual */}
      </div>
    )}
  </div>
)}
```

Mover la galería para que solo aparezca dentro de este bloque (no debajo del preview cuando ya hay logo).

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/components/formatos/editor/InspectorFields.tsx` | Reemplazar zona de carga (líneas 854-890) con dos botones + galería inline |

## Lo que NO se toca
- Lógica de upload a Storage — se mantiene igual
- Lógica de galería (listado del bucket) — se mantiene igual
- `DynamicFormatoDocument.tsx` — ya corregido en el commit anterior

