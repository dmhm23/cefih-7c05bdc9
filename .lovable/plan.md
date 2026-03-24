

## Plan: Rediseñar pregunta de embarazo con lógica de género

La pregunta de embarazo debe mostrarse siempre (no condicionalmente), pero su comportamiento cambia según el género:
- **Masculino**: muestra texto "No aplica" (sin controles interactivos)
- **Femenino**: muestra opciones Sí/No con "No" por defecto

### Archivos a modificar

#### 1. `src/components/matriculas/ConsentimientoSalud.tsx`
- Cambiar prop `showEmbarazo` por `genero: 'M' | 'F' | undefined`
- Actualizar el texto de la pregunta a: "A la fecha, ¿usted considera que se encuentra en estado de embarazo?"
- Si género es `'M'`: renderizar la pregunta con un texto estático "No aplica" alineado a la derecha (sin Switch)
- Si género es `'F'`: renderizar con Switch (Sí/No), valor por defecto No
- Si género es `undefined`: no mostrar la pregunta

#### 2. `src/pages/matriculas/MatriculaFormPage.tsx` (línea 986)
- Cambiar `showEmbarazo={selectedPersona?.genero === 'F'}` por `genero={selectedPersona?.genero}`

#### 3. `src/components/matriculas/formatos/InfoAprendizDocument.tsx` (líneas 284-289)
- Actualizar la condición y el texto de la pregunta para seguir la misma lógica de género (usar `persona.genero` del contexto)
- Si masculino: mostrar "No aplica"; si femenino: mostrar el select Sí/No

### Detalle técnico

En `ConsentimientoSalud.tsx`, el bloque de embarazo se reemplaza por:
```
{genero === 'M' && (
  <div> label + "No aplica" estático </div>
)}
{genero === 'F' && (
  <ConsentRow con Switch Sí/No />
)}
```

