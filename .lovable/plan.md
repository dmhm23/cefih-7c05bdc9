

# Plan: Corregir filtrado de estudiantes cuando el curso no tiene nivel_formacion_id

## Problema

La matrícula tiene `empresa_nivel_formacion = 'b62b5715-...'` (UUID del nivel "Trabajador Autorizado", tipo `formacion_inicial`). El curso `FI-0001` tiene `nivel_formacion_id = NULL` y `tipo_formacion = 'formacion_inicial'`.

El modal compara `m.empresaNivelFormacion === nivelFormacion`. Como el curso no tiene `nivel_formacion_id`, el fallback es `"formacion_inicial"` (string), que nunca iguala al UUID. Resultado: 0 estudiantes disponibles.

## Solución

Cambiar la lógica de filtrado en `AgregarEstudiantesModal` para que cuando reciba un UUID, compare directo. Cuando reciba un string de tipo (fallback), busque todos los niveles de ese tipo y compare contra sus UUIDs.

### Paso 1: Modificar `AgregarEstudiantesModal.tsx`

Importar `useNivelesFormacion` y resolver el filtrado correctamente:

- Si `nivelFormacion` parece un UUID → comparar directo con `m.empresaNivelFormacion`
- Si `nivelFormacion` es un string de tipo (ej. `"formacion_inicial"`) → buscar todos los `niveles_formacion` de ese tipo y aceptar matrículas cuyo `empresaNivelFormacion` esté en esa lista de UUIDs

Esto cubre ambos escenarios: cursos con y sin `nivel_formacion_id` asignado.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/cursos/AgregarEstudiantesModal.tsx` | Mejorar lógica de filtrado para resolver tipo → UUIDs |

**Total: 1 archivo editado, 0 migraciones**

