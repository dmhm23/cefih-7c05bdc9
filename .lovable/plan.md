

# Optimizar espacios y UX en las vistas de detalle

## Problema actual

Las vistas de detalle (`/personas/:id`, `/matriculas/:id`, `/cursos/:id`) usan Cards con headers grandes, padding excesivo (`space-y-6`, `gap-6`, `pt-6`), titulos `text-3xl`, e iconos decorativos que consumen mucho espacio vertical. Esto contrasta con la estética compacta y minimalista "Lightfield" de las tablas.

## Cambios propuestos

### 1. Header compacto unificado (las 3 paginas)
- Reducir titulo de `text-3xl font-bold` a `text-xl font-semibold`
- Comprimir el header en una sola linea con badge de estado inline
- Reducir el espaciado general de `space-y-6` a `space-y-4`

### 2. Reemplazar Cards por secciones planas
- Eliminar los componentes `Card`/`CardHeader`/`CardContent` que agregan bordes y padding dobles
- Usar secciones con titulo en mayusculas pequenas (estilo tabla) + separador sutil
- Reducir el padding interno de cada seccion

### 3. Grids mas densos
- Cambiar grids de `gap-6` a `gap-4` y `gap-4` a `gap-3`
- En MatriculaDetallePage: comprimir las tarjetas de Estudiante/Curso en una fila mas compacta
- Usar `text-sm` consistente para labels y valores

### 4. PersonaDetallePage
- Eliminar iconos decorativos (Mail, Phone, Calendar, Droplet) que duplican la label
- Presentar los datos en un grid compacto label/valor sin iconos
- Contacto de emergencia en linea con el resto, sin fondo separado

### 5. MatriculaDetallePage
- Comprimir las cards de Estudiante y Curso en una barra resumen superior de una linea
- Secciones de Consentimiento, Documentos, Cobros, Certificado como bloques planos con headers uppercase
- Reducir el checklist del sidebar: items mas compactos sin circulos grandes
- Mover las fechas de creacion/actualizacion al header

### 6. CursoDetallePage
- Info del curso en un grid horizontal compacto sin iconos decorativos
- Lista de estudiantes con filas mas delgadas (padding `p-2` en vez de `p-3`)
- Sidebar de estadisticas mas denso

## Detalles tecnicos

### Archivos a modificar

**`src/pages/personas/PersonaDetallePage.tsx`**
- Eliminar imports de iconos (Mail, Phone, Calendar, Droplet)
- Reducir header: `text-xl font-semibold`, `space-y-4`
- Reemplazar Card por `div` con bordes sutiles y headers `text-xs font-semibold uppercase tracking-wide text-muted-foreground`
- Grid de datos personales: 4 columnas, label + valor sin iconos

**`src/pages/matriculas/MatriculaDetallePage.tsx`**
- Comprimir header a `text-xl`
- Cards de Estudiante/Curso: una sola barra horizontal con datos clave inline
- Todas las secciones: eliminar `Card`/`CardHeader`, usar `div` + separador + titulo uppercase
- Checklist sidebar: items de `p-2` sin circulos de 8x8, solo un dot + texto
- Spacing general: `space-y-4`, `gap-3`

**`src/pages/cursos/CursoDetallePage.tsx`**
- Header compacto `text-xl`
- Info del curso: grid plano sin iconos, `gap-3`
- Lista de estudiantes: `p-2` por fila
- Sidebar compacto

### Patron de seccion reutilizado

```tsx
<div className="space-y-2">
  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    Titulo Seccion
  </h3>
  <div className="grid grid-cols-3 gap-3">
    ...
  </div>
</div>
```

Este patron ya existe en `DetailSection` del `DetailSheet.tsx` y se replicara en las paginas de detalle para coherencia visual.

