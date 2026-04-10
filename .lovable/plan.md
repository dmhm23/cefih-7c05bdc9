

# Plan: Usar BirthDateField en el modal de crear persona desde matrícula

## Diagnóstico

En `CrearPersonaModal.tsx` línea 245, el campo de fecha de nacimiento usa `DateField` (calendario genérico) en lugar de `BirthDateField` (el componente especializado con restricción 18-90 años, buscador de años y navegación optimizada).

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/matriculas/CrearPersonaModal.tsx` | Reemplazar `import { DateField }` por `import { BirthDateField }` y cambiar `<DateField>` por `<BirthDateField>` en el campo `fechaNacimiento` (línea 245). |

**Total: 1 archivo, 1 línea de cambio, 0 migraciones**

