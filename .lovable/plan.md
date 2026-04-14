# Plan ajustado: Migración funcional del renderer dinámico y firma dinámica

## Resumen

Implementar el renderer dinámico del portal, el nuevo bloque `signature_capture`, y la lógica de firma reutilizable gobernada por configuración, **sin eliminar archivos legacy todavía**.

La validación se hará primero con un formato dinámico nuevo, de punta a punta, antes de cualquier borrado. El objetivo es asegurar que el portal quede gobernado por `portal_config_documentos` + `formatos_formacion` + reglas dinámicas, y no por keys o páginas legacy hardcodeadas.

---

## Qué estamos haciendo con este plan

Con este plan estamos quitándole al portal las reglas fijas viejas y haciendo que funcione de forma realmente configurable.

En términos simples:

- hoy el portal todavía depende de pantallas y nombres fijos, como si ya supiera de antemano cuáles formatos mostrar;
- con este plan, queremos que el portal ya no tenga formatos amarrados por defecto;
- en cambio, queremos que muestre el formato que se configure, en el orden que se defina;
- también queremos que la firma del estudiante ya no dependa de un formato fijo, sino del formato que se marque como origen;
- y que después esa firma pueda reutilizarse en otros formatos, pero solo si eso quedó autorizado y configurado.

La idea es dejar el sistema para que se pueda arrancar desde cero, crear formatos propios y decidir cuál será el primero, cuál recoge la firma y cuáles dependen de ese.

Y se hará sin borrar todavía lo viejo, para primero probar que el flujo nuevo sí funciona completo y no romper el portal antes de tiempo.

---

## Decisiones de diseño (firma)

### 1. Regla para marcar un formato como origen de firma reutilizable

Se agrega un campo booleano `es_origen_firma` al modelo `FormatoFormacion`.

Este campo **no implica por sí solo** que la firma quede autorizada para reutilización.

Solo indica que el formato **puede actuar como formato origen de firma**.

### 2. Regla de autorización explícita

La firma solo podrá persistirse en `firmas_matricula` como reutilizable si, además de existir una captura válida, el formato diligenciado contiene una autorización explícita del estudiante para reutilizar su firma dentro de esa matrícula.

Condición final para persistir una firma reutilizable:

- el formato tiene `es_origen_firma = true`,
- el estudiante capturó una firma válida,
- y el estudiante aceptó explícitamente la reutilización.

En ese caso se hace persistencia en `firmas_matricula` con:

- `matricula_id`
- `formato_origen_id = formato.id`
- `autoriza_reutilizacion = true`
- `tipo_firmante`
- evidencia de contexto correspondiente

### 3. Regla para múltiples firmas posibles

No se usará `tipo` documental ni keys fijas.

La firma reutilizable se resolverá con esta jerarquía:

1. Si el bloque indica explícitamente un `formatoOrigenId`, se reutiliza solo la firma de ese formato origen.
2. Si no lo indica, se busca una firma reutilizable activa por:
  - `matricula_id`
  - `tipo_firmante`
  - `autoriza_reutilizacion = true`
3. Si existen varias firmas válidas para el mismo `tipo_firmante`, se tomará la **más reciente**, salvo que exista dependencia explícita hacia un formato origen concreto.

### 4. Regla de no acoplamiento

No se usará:

- `tipo` del documento,
- `documento_key`,
- nombres como `info_aprendiz`,
- ni tipos predefinidos del portal

como criterio de reutilización de firma.

La reutilización dependerá únicamente de:

- `matricula_id`,
- configuración del bloque,
- configuración del formato,
- autorización explícita,
- y opcionalmente `formato_origen_id`.

---

## Fase 1: Nuevo bloque `signature_capture`

### Tipos (`formatoFormacion.ts`)

- Agregar `'signature_capture'` a `TipoBloque`
- Agregar interfaz `BloqueSignatureCapture`
- Agregar a la unión `Bloque`
- Agregar `esOrigenFirma?: boolean` a `FormatoFormacion`

### Props sugeridas para `BloqueSignatureCapture`

```tsx
{
  mode?: 'capture' | 'reuse_if_available' | 'reuse_required' | 'display_only';
  tipoFirmante?: 'aprendiz' | 'entrenador' | 'supervisor';
  formatoOrigenId?: string;
  requiereAutorizacionReutilizacion?: boolean;
}

```

### Regla funcional de los modos

- `capture`: siempre captura firma nueva
- `reuse_if_available`: reutiliza si existe una firma válida; si no existe, permite capturar
- `reuse_required`: solo reutiliza; si no existe firma válida, muestra estado bloqueado o error controlado
- `display_only`: solo muestra firma existente, sin permitir captura

### Catálogo de bloques (`BlockCatalog.tsx`)

- Agregar `signature_capture` en la categoría de firmas

### Renderer (`DynamicFormatoDocument.tsx`)

Agregar case `signature_capture` con esta lógica:

- Si el bloque está en modo reutilizable, consultar `firmasMatricula` del contexto
- Resolver firma según:
  - `formatoOrigenId`, si existe
  - o `matricula_id + tipo_firmante + autoriza_reutilizacion = true`
- Si la firma existe y el modo permite reutilización, mostrarla como solo lectura
- Si el modo permite captura nueva, renderizar canvas de captura
- Si el modo exige reutilización y no existe firma válida, mostrar estado controlado de bloqueo

---

## Fase 2: Migración del renderer del portal

### `DocumentoRendererPage.tsx` — cambio principal

- **Mantener temporalmente** el diccionario `RENDERERS` como fallback únicamente para documentos legacy sin `formato_id`
- **Agregar lógica prioritaria**: si `docConfig` tiene `formato_id`, renderizar `DynamicFormatoDocument` directamente
- El despacho por componente legacy solo debe ocurrir si no existe `formato_id`

### Flujo del renderer dinámico en portal

1. Consultar `portal_config_documentos` para obtener `formato_id` del `documentoKey`
2. Validar que el registro sea publicable y tenga `formato_id` válido
3. Cargar `formatos_formacion` por ese `formato_id`
4. Cargar datos de contexto:
  - persona
  - matrícula
  - curso
  - nivel de formación
  - firmas reutilizables
  - respuestas previas si aplican
5. Renderizar `DynamicFormatoDocument` en modo interactivo
6. Al enviar, persistir usando una única lógica transaccional

### Nuevos hooks/queries necesarios

- `useFormatoById(formatoId)`
- `useFirmasMatricula(matriculaId)`
- `useFormatoRespuesta(matriculaId, formatoId)` si aplica para reanudación o edición controlada

### Regla de navegación segura

Si el documento portal no tiene `formato_id` válido:

- no debe navegarse funcionalmente en portal estudiante,
- o debe mostrar un error controlado de “documento no configurado”,
- nunca intentar renderizar un flujo incompleto.

---

## Fase 3: Lógica de envío desde portal dinámico

### Nuevo servicio: `portalDinamicoService.ts`

Crear un flujo de persistencia con **una sola fuente de verdad**.

### Método

`enviarFormatoDinamico(matriculaId, formatoId, answers, firmaPayload?)`

### Operación esperada

La persistencia debe resolverse de forma **atómica**, idealmente desde backend/RPC/función de BD, no con mezcla ambigua entre trigger y fallback client-side.

Debe contemplar en una sola operación:

1. Upsert en `formato_respuestas`
2. Persistencia o actualización en `documentos_portal` si corresponde
3. Persistencia en `firmas_matricula` si:
  - el formato tiene `es_origen_firma = true`
  - existe firma válida
  - existe autorización explícita para reutilización

### Regla importante

No depender de fallback client-side para consistencia entre:

- `formato_respuestas`
- `documentos_portal`
- `firmas_matricula`

La lógica de guardado debe quedar centralizada y consistente.

---

## Fase 4: Migración de BD

### Migración SQL

- Agregar columna `es_origen_firma boolean default false` a `formatos_formacion`
- Si aplica, agregar campos auxiliares o estructura equivalente para soportar la política de firma reutilizable
- Definir una forma clara de identificar documentos no publicables cuando `formato_id` sea null:
  - ya sea con columna calculada `valido`
  - o mediante vista/query de validación

### Regla de integridad

Los registros en `portal_config_documentos` sin `formato_id` no deben quedar funcionalmente activos en el portal.

---

## Fase 5: Validación de registros inválidos en portal_config

### `PortalAdminPage.tsx` / `DocumentosCatalogoTable.tsx`

- Mostrar badge rojo: **“Sin formato vinculado”**
- Bloquear publicación si `formato_id` es null
- Bloquear navegación funcional en portal estudiante a documentos inválidos
- Permitir identificarlos fácilmente para limpieza posterior

---

## Archivos que se modifican


| Archivo                                                         | Cambio                                                                |
| --------------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/types/formatoFormacion.ts`                                 | Nuevo bloque, `esOrigenFirma`, props ampliadas                        |
| `src/components/formatos/editor/BlockCatalog.tsx`               | Agregar `signature_capture`                                           |
| `src/components/matriculas/formatos/DynamicFormatoDocument.tsx` | Soporte para modos de firma                                           |
| `src/pages/estudiante/DocumentoRendererPage.tsx`                | Priorizar renderer dinámico cuando hay `formato_id`                   |
| `src/services/portalDinamicoService.ts`                         | Nuevo servicio para persistencia dinámica                             |
| `src/hooks/usePortalEstudiante.ts`                              | Agregar `useFormatoById`, `useFirmasMatricula` y queries relacionadas |
| `src/components/portal-admin/DocumentosCatalogoTable.tsx`       | Badge “Sin formato” y bloqueo de publicación                          |
| Migración SQL                                                   | `es_origen_firma` y validación de registros publicables               |


### Archivos que NO se tocan todavía

Se mantienen hasta validar el flujo end-to-end:

- `InfoAprendizPage.tsx`
- `EvaluacionPage.tsx`
- `portalAdminConfig.ts`
- `portalEstudianteConfig.ts`
- `portalInitService.ts`

---

## Criterio de éxito para proceder con eliminación legacy

Antes de eliminar cualquier circuito legacy, se debe validar que un formato dinámico nuevo:

1. aparece en el panel de documentos del portal;
2. se renderiza desde `formato_id` y no desde un renderer hardcodeado;
3. captura firma mediante `signature_capture`;
4. guarda respuesta correctamente en `formato_respuestas`;
5. sincroniza correctamente con `documentos_portal`;
6. persiste firma reutilizable en `firmas_matricula` solo cuando existe autorización explícita;
7. un segundo formato reutiliza la firma sin depender de keys fijas;
8. la reutilización se resuelve correctamente cuando existe más de una firma posible;
9. el portal no permite navegación funcional a documentos sin `formato_id` válido.

Solo después de validar estos puntos se procede a:

- eliminar componentes legacy,
- eliminar catálogos hardcodeados,
- limpiar rutas y tipos legacy,
- y borrar formatos mock si ya no son necesarios.

---

## Resultado esperado

Al finalizar esta migración funcional, el portal debe quedar preparado para operar así:

1. `portal_config_documentos` define qué documentos aparecen y en qué orden;
2. cada documento portal se vincula a un `formato_id`;
3. `formatos_formacion` define la estructura visual y lógica del documento;
4. `DynamicFormatoDocument` renderiza el formato de manera interactiva;
5. la firma se captura o reutiliza según configuración del bloque y del formato;
6. la reutilización depende de autorización explícita y reglas dinámicas;
7. el sistema puede convivir temporalmente con legacy hasta validar el flujo nuevo;
8. una vez validado, lo legacy podrá eliminarse sin romper el portal.