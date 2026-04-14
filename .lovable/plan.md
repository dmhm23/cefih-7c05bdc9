

# Analisis de brechas: Documento de Requerimientos vs. Implementacion actual

## Resumen ejecutivo

El modulo actual tiene un constructor visual funcional (canvas + catalogo + inspector + config), persistencia en BD via `formatos_formacion` y `formato_respuestas`, sincronizacion basica con portal, y un motor de autocompletado con ~40 campos fijos. Sin embargo, existen brechas significativas frente al documento de requerimientos en 7 ejes principales.

---

## 1. Motor de Dependencias (Secciones 10, 9.3-9.5 del doc)

**Estado actual:** No existe. No hay ningun campo, tabla ni logica para definir dependencias entre formatos.

**Brechas:**
- No hay campo `depende_de` en `formatos_formacion` para dependencias entre formatos
- No hay dependencias de activacion (un formato desbloquea otro)
- No hay dependencias de datos (heredar respuestas/firma de otro formato)
- No hay dependencias de precondicion (exigir que otro formato este firmado/completado)
- No hay reglas compuestas de asignacion (nivel + dependencia + estado matricula + consentimiento previo)
- La funcion `get_formatos_for_matricula` solo evalua nivel y scope, sin considerar precondiciones

**Cambios necesarios:**
- Agregar columna `dependencias` (jsonb) a `formatos_formacion` con estructura tipo `[{formatoId, tipo: 'activacion'|'datos'|'precondicion', condicion: 'completado'|'firmado'|'aprobado'}]`
- Modificar `get_formatos_for_matricula` para evaluar dependencias contra `formato_respuestas`
- Agregar UI en `FormatoConfigSheet` para configurar dependencias
- Implementar logica de estado derivado: bloqueado/pendiente/completado segun dependencias

---

## 2. Motor de Firma Reutilizable (Seccion 11)

**Estado actual:** La firma se captura en el portal (info_aprendiz) y se almacena como base64 en `personas.firma_storage_path`. El bloque `signature_aprendiz` simplemente muestra la firma de la persona. No hay concepto de firma por matricula ni evidencia compuesta.

**Brechas:**
- La firma es global de la persona, no por matricula como exige el doc
- No hay metadatos de evidencia (timestamp, IP, user-agent, hash de integridad)
- No hay control de autorizacion explicita para reutilizacion
- No hay logica de "firma valida dentro de esta matricula"
- No hay manejo de firma faltante del entrenador que se incorpore despues

**Cambios necesarios:**
- Crear tabla `firmas_matricula` con campos: `matricula_id`, `tipo` (aprendiz/entrenador/supervisor), `firma_base64`, `timestamp`, `ip`, `user_agent`, `hash`, `formato_origen_id`
- Modificar bloque `signature_aprendiz` para leer/escribir desde `firmas_matricula` en vez de `personas`
- Agregar campo en config del formato para indicar si puede reutilizar firma de otro formato
- Implementar logica de incorporacion tardia de firma de entrenador/supervisor

---

## 3. Motor de Autocompletado Abierto (Seccion 8)

**Estado actual:** Catalogo fijo de ~40 campos en `autoFieldCatalog.ts` con tipo `AutoFieldKey` cerrado. Resolucion en `resolveAutoField.ts` con switch case estatico.

**Brechas:**
- El catalogo es cerrado y hardcodeado — el doc exige acceso a "cualquier dato disponible y relacionado"
- No se pueden consumir datos de documentos/formatos previos
- No se pueden consumir campos adicionales dinamicos del nivel de formacion
- La UX obliga a pensar en "tokens tecnicos" en vez de datos navegables del sistema (seccion 16.4)
- No hay distincion clara entre datos solo lectura y editables en la interfaz del configurador

**Cambios necesarios:**
- Refactorizar `AutoFieldKey` de union literal a string abierto con validacion en runtime
- Agregar categoria "Formatos previos" al catalogo, que liste dinamicamente campos de otros formatos completados
- Agregar categoria "Campos adicionales" que lea `campos_adicionales` del nivel de formacion
- Mejorar la UX del selector de auto_field con busqueda, categorias expandibles y preview del dato
- Agregar propiedad `editable` al bloque para distinguir campos prellenados editables vs solo lectura

---

## 4. Estados del Formato-Respuesta y Permisos de Edicion (Secciones 12, 13)

**Estado actual:** `formato_respuestas.estado` solo tiene `pendiente` | `completado`. No hay estado `bloqueado`, `firmado`, ni logica de reapertura. No hay control de quien puede editar despues del envio.

**Brechas:**
- Falta estado `bloqueado` (por dependencia no cumplida)
- Falta estado `firmado` (diferente a completado)
- No hay mecanismo de reapertura por admin
- No hay permisos granulares: quien edita que campo y en que momento
- El estudiante podria en teoria editar despues del envio (no hay bloqueo real)
- No hay reintentos de evaluacion configurables

**Cambios necesarios:**
- Extender enum `estado_formato_respuesta` en BD: agregar `bloqueado`, `firmado`, `reabierto`
- Agregar columna `reabierto_por` y `reabierto_at` a `formato_respuestas`
- Agregar campo `intentos_evaluacion` (jsonb) para historial de reintentos
- Implementar logica de bloqueo post-envio en el renderer del portal
- Agregar boton "Reabrir" en la vista de matricula para admins

---

## 5. Formatos Automaticos e Hibridos (Seccion 14)

**Estado actual:** Existe el campo `esAutomatico` y `modoDiligenciamiento: 'automatico_sistema'` pero no hay logica de generacion automatica por eventos. El unico formato "automatico" es `attendance_by_day` que genera su estructura en render, no en persistencia.

**Brechas:**
- No hay triggers ni listeners de eventos del proceso (cierre de curso, asignacion, etc.)
- No hay generacion automatica de instancias de formato_respuestas
- No hay concepto de formato hibrido (datos prellenados + campos editables mezclados)
- No hay configuracion de "eventos disparadores" en el formato

**Cambios necesarios:**
- Agregar campo `eventos_disparadores` (jsonb) a `formatos_formacion`: `['asignacion_curso', 'cierre_curso', 'firma_completada']`
- Crear funcion de BD o edge function que escuche cambios en matriculas/cursos y genere formato_respuestas automaticamente
- Implementar logica de prellenado automatico al crear la instancia

---

## 6. Sincronizacion Portal-Matricula (Seccion 15)

**Estado actual:** Existe sincronizacion basica via triggers `sync_formato_respuestas_to_portal` y `sync_portal_to_formato_respuestas`. El `syncPortalConfig` en el servicio crea/desactiva entradas en `portal_config_documentos`.

**Brechas:**
- Si cambia el entrenador, supervisor o fechas del curso, los formatos ya generados no se actualizan (seccion 15.3)
- Si el estudiante es removido del curso, los campos dependientes del curso no pasan a "Sin datos" (seccion 15.4)
- No hay logica unificada de lectura — portal y matricula resuelven datos por caminos distintos
- La sincronizacion de `niveles_habilitados` en portal_config_documentos siempre es `[]` (global), no respeta los niveles del formato

**Cambios necesarios:**
- Modificar `syncPortalConfig` para propagar `niveles_asignados` del formato a `niveles_habilitados` del portal
- Agregar trigger que detecte cambio de entrenador/supervisor en curso y actualice formatos afectados
- Implementar logica de "Sin datos" cuando `curso_id` es null en la matricula
- Unificar la resolucion de datos en un servicio compartido entre portal y matricula

---

## 7. UX del Configurador (Seccion 16)

**Estado actual:** Constructor funcional con 3 paneles (catalogo, canvas, inspector), drag & drop, columnas, undo/redo.

**Brechas:**
- No hay secciones colapsables configurables (solo `section_title` con `collapsible` no implementado en render)
- No hay logica condicional visual (mostrar/ocultar bloques segun respuestas)
- No hay configuracion de dependencias en el inspector
- No hay preview de como se ve el formato con datos reales de una matricula especifica
- La experiencia de tokens sigue siendo tecnica — la pestana "Tokens" muestra codigos como `{{persona.nombreCompleto}}`

**Cambios necesarios:**
- Implementar render de secciones colapsables en el documento
- Agregar panel de "Reglas" en el inspector para logica condicional por bloque
- Agregar selector de matricula de prueba en el preview para ver datos reales
- Reemplazar tokens de texto por selector visual de datos del sistema

---

## Prioridades sugeridas para la refactorizacion

```text
Prioridad   | Eje                          | Impacto
────────────┼──────────────────────────────┼──────────────────────────
   1        | Dependencias entre formatos  | Desbloquea flujos criticos
   2        | Estados y permisos           | Seguridad y control de edicion
   3        | Sincronizacion portal        | Consistencia de datos
   4        | Firma por matricula          | Cumplimiento legal
   5        | Autocompletado abierto       | Flexibilidad del configurador
   6        | Formatos automaticos         | Automatizacion de procesos
   7        | UX del configurador          | Usabilidad avanzada
```

---

## Lo que ya esta bien implementado

- Constructor visual por bloques con drag & drop
- Catalogo de bloques organizado por categorias
- Inspector de propiedades por bloque
- Configuracion de formato (nombre, categoria, scope, visibilidad, firmas)
- Asignacion por nivel de formacion (scope)
- Persistencia en BD con motor de bloques
- Autocompletado de ~40 campos del sistema
- Sincronizacion basica portal (triggers bidireccionales)
- Versionado de formatos
- Duplicacion de formatos
- Undo/redo en el editor
- Encabezado institucional configurable
- Bloques especiales (evaluacion, encuesta, salud, autorizacion, asistencia)

