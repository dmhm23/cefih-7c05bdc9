

# Plan: Botón "Copiar todos los errores" en importación

## Cambio

Agregar un botón junto al badge "X con errores" que copie al portapapeles TODAS las filas con error en formato texto plano, una por línea:

```
Empresa ABC, 900123456, NIT duplicado; ARL no reconocida
Empresa XYZ, , Nombre vacío; Sector inválido
```

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/components/empresas/ImportarEmpresasDialog.tsx` | Agregar botón "Copiar todos los errores" que genera texto plano con `nombre, nit, errores` por línea y lo copia al portapapeles |

## Detalle

- Junto al badge destructive de errores, agregar un botón con ícono `Copy`/`Check`
- Al hacer clic, genera una cadena iterando `errorRows` con formato: `${r.nombreEmpresa || '—'}, ${r.nit || '—'}, ${r.errors.join('; ')}\n`
- Clipboard API + feedback visual (ícono cambia a Check por 1.5s)

