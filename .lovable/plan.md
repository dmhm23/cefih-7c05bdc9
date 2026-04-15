## Diagnóstico validado

Revisé el flujo y el problema está dividido en dos partes:

1. **La firma fuente sí existe y sí quedó guardada**
  - Thomas Doe (`1110123123`) ya tiene una firma persistida en `firmas_matricula`.
  - El formato **Información del Aprendiz** sí está funcionando como origen de firma.
2. **El evento automático sí está corriendo, pero solo cubre un tipo de bloque**
  - El formato **Participación en el diligenciamiento del PTA - ATS** ya tiene un `formato_respuestas` generado y su bloque `signature_capture` ya recibió firma.
  - El formato **Registro de asistencia...** también fue generado, pero quedó con `answers` vacíos.
3. **La causa real del faltante en asistencia es de motor, no de tu configuración**
  - Ese formato de asistencia **solo tiene** un bloque `attendance_by_day`.
  - Hoy el código de `procesarEventoFirmaCompletada` **solo inyecta firma en bloques `signature_capture**`.
  - Además, el renderer de `attendance_by_day` **nunca lee ni `firmas_matricula` ni `answers**`; la columna “Firma” está hardcodeada con placeholder.
4. **Hay además una confusión de UX en Gestión de Formatos**
  - El preview del editor (`FormatoPreviewDocument`) muestra `signature_capture` y `attendance_by_day` como maquetas estáticas.
  - Ahí **no se resuelven firmas reales por matrícula**, así que puede parecer que “no heredó”, aunque en runtime sí exista la firma para formatos compatibles.

## Conclusión

Tu configuración actual **sí es suficiente para un formato destino que tenga `signature_capture**`.

Pero **no existe hoy una configuración útil para que `attendance_by_day` herede firma**, porque ese bloque no fue implementado con esa capacidad.  
O sea: para asistencia, **te falta código**, no te falta marcar otra casilla.

## Plan de ajuste

### 1. Hacer explícito que el bloque de asistencia también puede heredar firma

Extender `attendance_by_day` para que tenga propiedades similares a `signature_capture`, por ejemplo:

- `mode`: `none | reuse_if_available | reuse_required`
- `tipoFirmante`: `aprendiz | entrenador | supervisor`
- `formatoOrigenId` opcional

Así el usuario podrá configurar la herencia desde el propio bloque de asistencia, sin depender de adivinanzas.

### 2. Actualizar el editor para que esa configuración exista y sea clara

Modificar el inspector del bloque `attendance_by_day` para permitir:

- activar firma heredada,
- elegir tipo de firmante,
- opcionalmente fijar el formato origen.

También ajustar el preview del editor para mostrar texto más claro para el inspector:

- “La firma heredada se resuelve en instancias reales del formato, no en esta maqueta”.

### 3. Enseñar al motor automático a poblar también bloques de asistencia

En `portalDinamicoService.procesarEventoFirmaCompletada`:

- mantener la lógica actual para `signature_capture`,
- agregar soporte para `attendance_by_day`,
- si el formato destino tiene ese bloque configurado para herencia, guardar en `formato_respuestas.answers` una snapshot de la firma reutilizada para ese bloque.

Esto evita que asistencia quede “completado” pero sin evidencia visual.

### 4. Renderizar la firma heredada dentro de la tabla de asistencia

En `DynamicFormatoDocument`:

- hacer que `attendance_by_day` lea primero la firma snapshot guardada en `answers[blockId]`,
- y como fallback pueda resolverla desde `firmas_matricula`,
- renderizar esa firma en la columna “Firma” de cada fila del registro.

Con esto el documento final sí mostrará la firma en asistencia.

### 5. Alinear también el preview documental

Actualizar `FormatoPreviewDocument` / preview de formatos para no inducir a error:

- mostrar que el bloque de asistencia admite firma heredada,
- diferenciar entre “preview de diseño” y “instancia real por matrícula”.

### 6. Backfill para no dejar casos ya creados rotos

Aplicar una corrección sobre respuestas ya generadas:

- Thomas Doe
- y cualquier otro formato automático ya creado por `firma_completada`

Objetivo del backfill:

- completar la data faltante en formatos con `attendance_by_day` configurados para reutilización.

## Configuración final que deberías usar

### Formato origen

- `esOrigenFirma = true`

### Formato destino con bloque `signature_capture`

- `mode = reuse_required` o `reuse_if_available`
- `tipoFirmante = aprendiz`
- `formatoOrigenId` opcional si quieres amarrarlo a un origen específico

### Formato destino con bloque `attendance_by_day`

Después del ajuste:

- activar firma heredada en el mismo bloque
- `tipoFirmante = aprendiz`
- `formatoOrigenId` opcional

## Archivos a tocar

- `src/types/formatoFormacion.ts`
- `src/components/formatos/editor/InspectorFields.tsx`
- `src/components/formatos/FormatoPreviewDocument.tsx`
- `src/components/matriculas/formatos/DynamicFormatoDocument.tsx`
- `src/services/portalDinamicoService.ts`

## Resultado esperado

Después del ajuste:

- **PTA** seguirá heredando la firma con `signature_capture`
- **Asistencia** heredará y mostrará la firma desde su propio bloque `attendance_by_day`
- el editor dejará claro qué se ve en preview y qué solo aparece en instancias reales
- no tendrás que poner esos formatos en el portal del estudiante