
Objetivo: eliminar la duplicidad visual del calendario y unificar toda la app en un solo sistema de fechas, usando como base el calendario compartido que ya aparece en /matriculas/:id.

Qué está pasando
- Hoy la app no usa un único calendario.
- En /matriculas/:id la mayoría de fechas usan `EditableField` + `@/components/ui/calendar` (react-day-picker).
- Pero en varios módulos todavía se usan `Input type="date"` nativos del navegador:
  - Cartera: `CrearFacturaDialog`, `RegistrarPagoDialog`, `EditarFacturaDialog`, `EditarPagoDialog`
  - Matrículas: `DocumentosCarga` (Examen médico y ARL), `CrearPersonaModal`
  - Formularios: `MatriculaFormPage`, `PersonaFormPage`, `CursoFormPage`, entre otros
- Eso explica por qué ves “otro calendario” en Cartera o en examen médico/afiliación: no es el mismo componente, sino el datepicker nativo del navegador.

Causa probable de la duplicidad mes/año
- La duplicidad persiste en el calendario compartido porque el modo `captionLayout="dropdown-buttons"` no está resuelto de forma robusta con la implementación actual.
- El componente sigue renderizando elementos de cabecera redundantes del `DayPicker` (título + dropdowns/labels), así que el problema no se corrige solo con estilos sueltos.
- En otras palabras: hay dos problemas distintos al mismo tiempo:
  1. El calendario compartido tiene un header mal resuelto
  2. Muchos módulos ni siquiera usan ese calendario compartido

Plan propuesto

1. Corregir el calendario base compartido
- Ajustar `src/components/ui/calendar.tsx` para que el encabezado renderice mes y año una sola vez.
- Resolverlo de forma estable, no solo cosmética:
  - revisar `captionLayout`
  - ocultar/evitar elementos redundantes del caption
  - si hace falta, usar un caption personalizado en vez del header por defecto
- Dejar `pointer-events-auto` en el contenedor del `DayPicker` para garantizar interacción dentro de popovers/dialogs.

2. Crear un único componente reutilizable de fecha para toda la app
- Crear un componente compartido, por ejemplo `DateField`, basado en el calendario actual de `/matriculas/:id`.
- Este componente debe trabajar siempre con strings `YYYY-MM-DD` en hora local Colombia, sin `toISOString()`.
- Debe soportar:
  - selección desde calendario
  - ingreso manual estable del año/mes/día
  - variante compacta para campos pequeños como ARL y examen médico
  - variante de formulario para `react-hook-form` si hace falta

3. Hacer que `EditableField` use esa base común
- Mantener `EditableField` como interfaz visual en detalles inline, pero internamente montado sobre el nuevo flujo común de fechas.
- Así se conserva la UX actual de `/matriculas/:id`, pero con una implementación más consistente y reutilizable.

4. Reemplazar los `Input type="date"` en módulos prioritarios
- Migrar primero los puntos donde hoy se nota más la inconsistencia:
  - `src/components/matriculas/DocumentosCarga.tsx`
  - `src/components/cartera/CrearFacturaDialog.tsx`
  - `src/components/cartera/RegistrarPagoDialog.tsx`
  - `src/components/cartera/EditarFacturaDialog.tsx`
  - `src/components/cartera/EditarPagoDialog.tsx`
- Luego migrar formularios con uso nativo:
  - `src/components/matriculas/CrearPersonaModal.tsx`
  - `src/pages/matriculas/MatriculaFormPage.tsx`
  - `src/pages/personas/PersonaFormPage.tsx`
  - `src/pages/cursos/CursoFormPage.tsx`

5. Unificar parseo y formato de fechas
- Centralizar utilidades para:
  - convertir `Date -> YYYY-MM-DD` en hora local
  - parsear `YYYY-MM-DD -> Date` sin desplazamiento UTC
  - validar ingreso manual
- Esto evita regresiones como “selecciono hoy y guarda ayer”.

6. Validación funcional por módulos
- Verificar específicamente:
  - `/matriculas/:id` ya no duplica mes/año
  - examen médico y afiliación usan el mismo calendario visual
  - Cartera usa el mismo selector que Matrículas
  - se puede escribir el año manualmente sin bloquear el campo
  - navegar a años pasados funciona correctamente
  - seleccionar hoy guarda exactamente la fecha local de Colombia

Impacto esperado
- Un solo calendario en toda la plataforma
- Misma apariencia y comportamiento en Matrículas, Cartera, Personas y Cursos
- Sin duplicidad de mes/año
- Sin desfase UTC
- Sin dependencia del datepicker nativo del navegador

Detalle técnico
```text
Arquitectura objetivo

Calendar (base visual DayPicker)
   ↓
DateField (componente único de fecha)
   ├─ variante inline/detalle
   ├─ variante compacta
   └─ variante formulario
        ↓
Uso en toda la app
- EditableField(type="date")
- DocumentosCarga
- Cartera dialogs
- Formularios RHF
```

Alcance estimado
- No es un fix de un solo archivo.
- Es una corrección transversal pequeña-mediana: 1 componente base nuevo/ajustado + migración de varios puntos clave.
- Recomiendo hacerlo en dos fases dentro de la misma implementación:
  - Fase 1: corregir header duplicado + migrar Matrículas detalle y Cartera
  - Fase 2: migrar formularios restantes para cerrar la inconsistencia global
