

# Plan: Fusionar botones Plantilla e Importar en menú de 3 puntos

## Cambio

Reemplazar los dos botones separados ("Plantilla" e "Importar") por un único `DropdownMenu` con ícono `MoreVertical`, replicando el patrón exacto de `EmpresasPage`.

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/personas/PersonasPage.tsx` | Reemplazar los 2 botones por un `DropdownMenu` con `MoreVertical`. Actualizar imports (agregar `MoreVertical, FileUp`, `DropdownMenu*`; remover `Upload, FileDown`... bueno, conservar `FileDown` y agregar `FileUp`). |

## Detalle

Reemplazar líneas 285-298 con:

```tsx
<Button onClick={() => navigate("/personas/nuevo")}>
  <Plus className="h-4 w-4 mr-2" />
  Nueva Persona
</Button>
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => descargarPlantillaPersonas()}>
      <FileDown className="h-4 w-4 mr-2" />
      Descargar plantilla
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setImportOpen(true)}>
      <FileUp className="h-4 w-4 mr-2" />
      Importar personas
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Imports a actualizar: agregar `MoreVertical, FileUp` de lucide-react y `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` de ui. Remover `Upload` (ya no se usa).

