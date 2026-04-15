

# Plan: Corregir selector de Tipo de Formación sin selección

## Causa raíz

En ambos componentes (`CourseInfoCard.tsx` y `CursoDetailSheet.tsx`), el `EditableField` del selector "Tipo de Formación" recibe como `value`:

```typescript
value={getValue("tipoFormacion")}  // → retorna "jefe_area" (slug legacy)
```

Pero las opciones del select usan el **UUID** del nivel como valor:

```typescript
niveles.map((n) => ({ value: n.id, label: n.nombreNivel }))
//                          ^^^^ UUID
```

El select compara `"jefe_area"` contra UUIDs y no encuentra match → muestra "Seleccionar".

## Solución

Cambiar el `value` del select para que use `nivelFormacionId` (UUID) en lugar de `tipoFormacion` (slug). Cuando el usuario cambia la selección, actualizar `nivelFormacionId` además de `tipoFormacion`.

### Cambios en `CourseInfoCard.tsx` (línea ~96)

```typescript
// Antes
value={getValue("tipoFormacion")}
onChange={(v) => onFieldChange("tipoFormacion", v)}

// Después
value={formData.nivelFormacionId ?? curso.nivelFormacionId ?? ""}
onChange={(v) => {
  onFieldChange("nivelFormacionId", v);
  onFieldChange("tipoFormacion", v);
}}
```

### Cambios en `CursoDetailSheet.tsx` (línea ~159)

```typescript
// Antes
value={getValue("tipoFormacion")}
onChange={(v) => handleFieldChange("tipoFormacion", v)}

// Después
value={formData.nivelFormacionId ?? curso?.nivelFormacionId ?? ""}
onChange={(v) => {
  handleFieldChange("nivelFormacionId", v);
  handleFieldChange("tipoFormacion", v);
}}
```

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/cursos/CourseInfoCard.tsx` | Usar `nivelFormacionId` como value del select |
| `src/components/cursos/CursoDetailSheet.tsx` | Usar `nivelFormacionId` como value del select |

