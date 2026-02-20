
## Plan: Vista Administrativa de Resultados para Evaluación Reentrenamiento

### Diagnóstico del problema raíz

El componente `EvaluacionReentrenamientoDocument` tiene un defecto estructural en la vista administrativa: las respuestas individuales se guardan únicamente en estado local React (`useState`), pero **solo se persisten `evaluacionCompletada` y `evaluacionPuntaje`** en la matrícula. Cuando un administrador abre el formato después de que el estudiante lo completó, el estado local se inicializa vacío, por lo que:

- Los `RadioGroup` aparecen sin selección (en blanco).
- El bloque `.print-only-eval` muestra "Sin responder" en todas las preguntas.
- El resultado sí se muestra (porque lee `matricula.evaluacionPuntaje`), pero las preguntas se ven mal.

**Las respuestas individuales nunca se guardaron en el backend — solo el puntaje final.** Esto es una decisión de diseño que se debe respetar y asumir en la vista administrativa.

### Solución: prop `modo` para bifurcar el comportamiento

Se agrega una prop `modo: "diligenciamiento" | "resultados"` al renderer. Esto mantiene la arquitectura desacoplada (la futura Vista del Estudiante usará `modo="diligenciamiento"`) y la vista administrativa usará `modo="resultados"`.

```
modo="diligenciamiento"  →  muestra RadioGroups interactivos + botón Enviar
                             (futura Vista del Estudiante)
                             
modo="resultados"        →  oculta preguntas individuales, muestra solo resultado consolidado
                             + tabla de resumen estadístico
                             (vista admin en /matriculas/:id)
```

El `EvaluacionReentrenamientoPreviewDialog` pasa `modo="resultados"` porque siempre se usa desde contexto administrativo. Cuando `evaluacionCompletada = false` en modo resultados, se muestra un mensaje de "Evaluación pendiente de diligenciar".

---

### Cambios en `EvaluacionReentrenamientoDocument.tsx`

**1. Agregar prop `modo`:**
```ts
interface Props {
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
  modo?: "diligenciamiento" | "resultados"; // default: "diligenciamiento"
  onSubmit?: (...) => void;
}
```

**2. Bifurcar el renderizado según `modo`:**

En `modo="resultados"`:

- **Ocultar** la sección de instrucciones y la lista de preguntas con RadioGroups.
- **Mostrar** un bloque prominente de "Resultado de la Evaluación" con:
  - Puntaje grande (`evaluacionPuntaje`%).
  - Badge Aprobado / No Aprobado.
  - Número de preguntas correctas inferido: `Math.round(puntaje * 15 / 100)` de 15.
  - Estado visual (emerald si aprobado, destructive si no).
- **Mostrar** una sección de "Resumen" con:
  - Total preguntas: 15
  - Puntaje obtenido: X%
  - Puntaje mínimo: 70%
  - Resultado: Aprobado / No Aprobado

En `modo="diligenciamiento"` (comportamiento actual sin cambios):
- Instrucciones + preguntas + RadioGroups + botón Enviar.

**3. Mejorar la versión print (`.print-only-eval`):**

En modo resultados, la versión print muestra directamente el bloque de resultado sin intentar listar respuestas individuales (que no están disponibles). El CSS del `PRINT_STYLES` en el dialog se ajusta para dar más espaciado al bloque de resultado.

---

### Cambios en `EvaluacionReentrenamientoPreviewDialog.tsx`

Pasar `modo="resultados"` al renderer:

```tsx
<EvaluacionReentrenamientoDocument
  persona={persona}
  matricula={matricula}
  curso={curso}
  modo="resultados"
  onSubmit={handleSubmit}
/>
```

Mejorar `PRINT_STYLES` para:
- Aumentar tamaño del bloque de resultado (`font-size` del puntaje, padding, border).
- Asegurar márgenes adecuados entre secciones.
- El bloque resultado nunca se fragmenta entre páginas (`break-inside: avoid`).

---

### Comportamientos según estado de la matrícula

| Estado `evaluacionCompletada` | Modo | Pantalla | PDF |
|---|---|---|---|
| `false` | `"resultados"` (admin) | Bloque "Evaluación pendiente de diligenciar" en ámbar | Mismo bloque en print |
| `true` | `"resultados"` (admin) | Resultado grande + datos consolidados, solo lectura | Resultado destacado + datos consolidados |
| `false` | `"diligenciamiento"` (futuro estudiante) | Preguntas + RadioGroups + botón Enviar | N/A |
| `true` | `"diligenciamiento"` (futuro estudiante) | Preguntas disabled + resultado (comportamiento actual) | Respuestas seleccionadas en texto plano |

---

### Vista administrativa — diseño del bloque de resultados

Cuando `evaluacionCompletada = true` y `modo = "resultados"`:

```
┌─────────────────────────────────────────────────────────┐
│  [encabezado institucional FIH04-019]                  │
├─────────────────────────────────────────────────────────┤
│  DATOS DEL PARTICIPANTE                                │
│  Fecha | Tipo Doc | No. Doc | Nombre | Nivel | Empresa │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │      ✓  EVALUACIÓN APROBADA                    │   │
│  │                  87%                           │   │
│  │         [badge: Aprobado]                      │   │
│  │  13 de 15 respuestas correctas                 │   │
│  │  Puntaje mínimo requerido: 70%                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  RESUMEN DE LA EVALUACIÓN                              │
│  Total preguntas:  15                                  │
│  Correctas:        13                                  │
│  Puntaje obtenido: 87%                                 │
│  Puntaje mínimo:   70%                                 │
│  Resultado:        Aprobado                            │
└─────────────────────────────────────────────────────────┘
```

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/matriculas/formatos/EvaluacionReentrenamientoDocument.tsx` | Agregar prop `modo`, bifurcar renderizado entre "diligenciamiento" y "resultados" |
| `src/components/matriculas/formatos/EvaluacionReentrenamientoPreviewDialog.tsx` | Pasar `modo="resultados"`, mejorar `PRINT_STYLES` para resultado más prominente |

**Sin cambios en**: `MatriculaDetallePage`, `MatriculaDetailSheet`, tipos, servicios, ni ningún otro archivo.
