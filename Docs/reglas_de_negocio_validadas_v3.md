# Reglas de Negocio — CEFIH Sistema de Formación

**Fecha de generación:** 3 de abril de 2026  
**Versión del análisis:** 3.0  
**Fuente:** Código fuente front-end (tipos, servicios, hooks, utilidades, mocks)

---

## Tabla de Contenidos

1. [Módulo Personas](#1-módulo-personas)
2. [Módulo Niveles de Formación](#2-módulo-niveles-de-formación)
3. [Módulo Cursos](#3-módulo-cursos)
4. [Módulo Matrículas](#4-módulo-matrículas)
5. [Módulo Formatos de Formación](#5-módulo-formatos-de-formación)
6. [Módulo Cartera](#6-módulo-cartera)
7. [Módulo Certificación](#7-módulo-certificación)
8. [Módulo Portal Estudiante](#8-módulo-portal-estudiante)
9. [Módulo Personal y Cargos](#9-módulo-personal-y-cargos)
10. [Módulo Empresas (Directorio)](#10-módulo-empresas-directorio)
11. [Módulo Auditoría](#11-módulo-auditoría)
12. [Módulo Comentarios](#12-módulo-comentarios)
13. [Módulo Drive (Almacenamiento)](#13-módulo-drive-almacenamiento)
14. [UX y Protecciones de Navegación](#14-ux-y-protecciones-de-navegación)
15. [Integraciones entre Módulos](#15-integraciones-entre-módulos)
16. [Inconsistencias y Deuda Técnica](#16-inconsistencias-y-deuda-técnica)

---

## 1. Módulo Personas

### Reglas de Creación

**RN-PER-001** — Unicidad de documento de identidad: No se permite crear dos personas con el mismo `numeroDocumento`. Se lanza error `DOCUMENTO_DUPLICADO` (HTTP 400). (`personaService.create`)

**RN-PER-002** — Tipos de documento permitidos: CC (Cédula de Ciudadanía), CE (Cédula de Extranjería), PA (Pasaporte), PE (Permiso Especial), PP (Permiso de Protección). (`TipoDocumento` en `persona.ts`)

**RN-PER-003** — Género restringido a tres valores: M (Masculino), F (Femenino) y O (Otro). (`Genero` en `persona.ts`) *(Actualizado v3.0: se agregó valor 'O')*

**RN-PER-004** — Niveles educativos permitidos: Escala de 10 valores desde `analfabeta` hasta `doctorado`. (`NivelEducativo` en `persona.ts`)

**RN-PER-005** — Contacto de emergencia obligatorio en el modelo: La interfaz `Persona` incluye `contactoEmergencia` como campo obligatorio (nombre, teléfono, parentesco). Sin embargo, no hay validación explícita en el servicio.

**RN-PER-006** — Firma digital de persona: Se almacena como Base64 (`firma`) con fecha de captura (`firmaFecha`). Es opcional.

**RN-PER-007** — Datos de dirección, seguridad social, área de trabajo y sector económico NO se gestionan en el perfil base de la persona. Estos datos se capturan exclusivamente dentro de la matrícula.

### Reglas de Búsqueda

**RN-PER-008** — Búsqueda multi-campo: Se busca por `numeroDocumento`, `nombres`, `apellidos` o `email`. La búsqueda por documento es exacta (contains); las demás son case-insensitive.

### Reglas de Eliminación

**RN-PER-009** — Eliminación destructiva en mock: Se elimina directamente del array. En producción debe ser soft-delete con verificación de integridad referencial (matrículas asociadas).

---

## 2. Módulo Niveles de Formación

### Modelo de Datos

**RN-NF-001** — Cada nivel define: nombre, duración en horas y días, documentos requeridos (catálogo fijo de 6 tipos), campos adicionales personalizables, y configuración de código de estudiante.

**RN-NF-002** — Catálogo de documentos requeridos (fijo): `cedula`, `examen_medico`, `certificado_eps`, `arl`, `planilla_seguridad_social`, `curso_previo`. (`DocumentoReqKey` en `nivelFormacion.ts`)

**RN-NF-003** — Campos adicionales soportan 12 tipos de dato: texto_corto, texto_largo, numerico, select, select_multiple, estado, fecha, fecha_hora, booleano, archivo, url, telefono, email. (`TipoCampoAdicional`)

**RN-NF-004** — Alcance de campos adicionales: `solo_nivel` (aplica solo al nivel donde se crea) o `todos_los_niveles` (se hereda a todos). (`AlcanceCampo`)

### Código de Estudiante

**RN-NF-005** — El código de estudiante es configurable por nivel con: prefijo, código tipo formación, separador, longitud consecutivo, opciones de año/mes/consecutivo del curso. La configuración puede estar activa o inactiva.

**RN-NF-006** — Formato por defecto del código: `FIH-R-AAAA-MM-CC-NNNN` donde R=tipo formación, AAAA=año, MM=mes, CC=consecutivo curso, NNNN=consecutivo estudiante.

---

## 3. Módulo Cursos

### Modelo de Datos

**RN-CUR-001** — Un curso tiene: tipo de formación (vinculado a nivel), número de curso, fechas inicio/fin, duración en días y horas, entrenador obligatorio, supervisor opcional, capacidad máxima, y estado.

**RN-CUR-002** — Estados de curso: `abierto`, `en_progreso`, `cerrado`. (`EstadoCurso`)

**RN-CUR-003** — Tipos de formación: `jefe_area`, `trabajador_autorizado`, `reentrenamiento`, `coordinador_ta`. (`TipoFormacion`)

**RN-CUR-004** — El nombre del curso se genera automáticamente: `{TipoFormación} - #{NúmeroCurso}` (ej: "Trabajador Autorizado - #TA-2026-001").

### Reglas de MinTrabajo

**RN-CUR-005** — Un curso cerrado puede tener campos de MinTrabajo: registro, responsable, fecha de cierre principal.

**RN-CUR-006** — Se pueden agregar fechas adicionales de MinTrabajo con motivo, creador y timestamp. (`FechaAdicionalMinTrabajo`)

**RN-CUR-007** — El exportable CSV de MinTrabajo incluye 15 columnas, incluyendo la columna ARL como última columna. El valor se resuelve contra el catálogo `ARL_OPTIONS`.

### Reglas de Gestión

**RN-CUR-008** — Un curso mantiene un array `matriculasIds` con las matrículas asociadas.

**RN-CUR-009** — Un curso puede tener `camposAdicionalesValores` para almacenar valores de campos adicionales definidos a nivel de formación.

### Acciones Masivas en Estudiantes

**RN-CUR-010** — En la tabla de estudiantes inscritos, se permite selección múltiple para acciones masivas: generar certificados y eliminar estudiantes del curso.

### Calendario

**RN-CUR-011** — El filtro de entrenadores en vista calendario se implementa con checkboxes (selección múltiple), no con menú desplegable.

---

## 4. Módulo Matrículas

### Modelo de Datos

**RN-MAT-001** — Estados de matrícula: `creada`, `pendiente`, `completa`, `certificada`, `cerrada`. (`EstadoMatricula`)

**RN-MAT-002** — Tipos de vinculación laboral: `empresa`, `independiente`, `arl`. (`TipoVinculacion`)

**RN-MAT-003** — Formas de pago: `transferencia_bancaria`, `efectivo`, `consignacion`, `nequi`, `daviplata`, `bre_b`, `corresponsal_bancario`, `otro`. (`FormaPago`) *(Actualizado v3.0: lista ampliada con métodos de pago colombianos)*

**RN-MAT-004** — Niveles previos de formación: `trabajador_autorizado`, `avanzado`. (`NivelPrevio`)

**RN-MAT-005** — El curso es **opcional** al crear una matrícula. Si no se asigna curso, la matrícula se crea con `cursoId` vacío y los formatos se resuelven usando `empresaNivelFormacion` como fallback.

### Vinculación con Empresa

**RN-MAT-006** — El campo `empresaId` (opcional) vincula la matrícula con una empresa del Directorio. Cuando se selecciona, los campos `empresaNombre`, `empresaNit`, `empresaRepresentanteLegal` se autorellenan desde el directorio.

**RN-MAT-007** — Los datos de empresa se mantienen desnormalizados en la matrícula (`empresaNombre`, `empresaNit`, etc.) como snapshot del momento de creación, para evitar que cambios futuros en el directorio afecten registros históricos.

**RN-MAT-008** — El formulario de matrícula ofrece un campo autocomplete para buscar empresas del directorio y opción de crear una nueva empresa inline.

### Consentimiento de Salud

**RN-MAT-009** — El consentimiento de salud incluye: restricción médica, alergias, consumo de medicamentos (cada uno con campo detalle), embarazo (condicional a género F), y nivel de lectoescritura.

**RN-MAT-010** — La autorización de uso de datos personales es un campo booleano requerido (`autorizacionDatos`).

### Documentos

**RN-MAT-011** — Cada matrícula tiene un array de `DocumentoRequerido` con: tipo, nombre, estado (`pendiente`/`cargado`), URL de Drive, fechas, y flag `opcional`.

**RN-MAT-012** — Tipos de documento: `cedula`, `examen_medico`, `certificado_eps`, `arl`, `planilla_seguridad_social`, `curso_previo`, `consolidado`, `otro`. (`TipoDocumento`)

**RN-MAT-013** — Los documentos requeridos se **sincronizan automáticamente** con el nivel de formación vigente al consultar el detalle de una matrícula (`sincronizarDocumentos`). Se añaden requisitos faltantes sin alterar los documentos ya cargados.

### Evaluaciones

**RN-MAT-014** — Se almacenan respuestas de: autoevaluación, evaluación de competencias (arrays de strings), evaluación de reentrenamiento (array de índices de respuesta), y encuesta de satisfacción.

**RN-MAT-015** — La evaluación de reentrenamiento tiene 15 preguntas con umbral de aprobación del 70%.

### Cartera en Matrícula

**RN-MAT-016** — Cada matrícula puede tener campos de cobro: contacto, valor de cupo, abono, fecha de facturación, número de factura, titular, fecha de pago, forma de pago.

**RN-MAT-017** — El saldo se calcula: `valorCupo - abono`.

**RN-MAT-018** — El campo `pagado` se calcula automáticamente al registrar un pago: `true` cuando `saldo <= 0`.

### Certificado

**RN-MAT-019** — La fecha de generación de certificado se asigna automáticamente al generar PDF. La fecha de entrega es manual.

### Portal Estudiante

**RN-MAT-020** — Cada matrícula puede tener un objeto `portalEstudiante` con estado de habilitación y documentos del portal.

**RN-MAT-021** — Al crear una matrícula con curso asignado, se auto-inicializa el portal del estudiante (`initPortalEstudiante`). Si se asigna curso posteriormente mediante edición, también se inicializa.

### Auto-asignación a Cartera

**RN-MAT-022** — Al crear una matrícula, se ejecuta automáticamente `asignarMatriculaACartera` que busca o crea un responsable de pago y un grupo de cartera basándose en el NIT (empresa) o documento (independiente).

---

## 5. Módulo Formatos de Formación

### Arquitectura de Motor Dual

**RN-FMT-001** — Los formatos soportan dos motores de renderizado: `bloques` (constructor declarativo legacy) y `plantilla_html` (motor de plantillas HTML con tokens). (`MotorRender`)

**RN-FMT-002** — Los formatos nuevos se crean exclusivamente con el motor `plantilla_html`. El motor `bloques` se mantiene solo para compatibilidad con los 4 formatos legacy existentes.

**RN-FMT-003** — Los 4 formatos legacy son: Información del Aprendiz (`info_aprendiz`), Registro de Asistencia (`registro_asistencia`), Participación PTA-ATS (`participacion_pta_ats`), Evaluación de Reentrenamiento (`evaluacion_reentrenamiento`). Se identifican por `legacyComponentId`.

### Estados del Formato

**RN-FMT-004** — Un formato tiene tres estados: `borrador`, `activo`, `archivado`. (`EstadoFormato`)

**RN-FMT-005** — Solo los formatos en estado `activo` con `visibleEnMatricula: true` aparecen en las matrículas.

**RN-FMT-006** — Archivar un formato equivale a eliminación lógica (soft delete). No se eliminan, se marcan como archivados.

**RN-FMT-007** — La eliminación masiva permite seleccionar múltiples formatos y eliminarlos en lote (operación destructiva en mock, soft-delete en producción).

### Categorías

**RN-FMT-008** — Los formatos se clasifican en categorías: `formacion`, `evaluacion`, `asistencia`, `pta_ats`, `personalizado`. (`CategoriaFormato`)

### Asignación y Sincronización

**RN-FMT-009** — Los formatos se asignan por dos scopes: `nivel_formacion` (IDs de niveles) o `tipo_curso` (keys de tipo de formación). (`AsignacionScope`)

**RN-FMT-010** — Mapeo de nivel a tipo de curso para filtrado: `nf1 → reentrenamiento`, `nf2 → jefe_area`, `nf3 → trabajador_autorizado`, `nf5 → coordinador_ta`. Este mapeo se aplica en `getForMatricula`.

**RN-FMT-011** — Los formatos visibles en una matrícula se resuelven usando `curso.tipoFormacion` como clave primaria. Si la matrícula no tiene curso asignado, se usa `matricula.empresaNivelFormacion` como fallback. *(Nuevo v3.0)*

**RN-FMT-012** — Los cambios en Gestión de Formatos (crear, editar, archivar, activar formatos) se reflejan automáticamente en las matrículas porque la consulta `useFormatosMatricula` se ejecuta dinámicamente contra la lista vigente de formatos activos. No hay snapshot; la sincronización es en tiempo real. *(Nuevo v3.0)*

### Motor de Plantillas HTML

**RN-FMT-013** — Las plantillas HTML usan tokens con formato `{{grupo.campo}}` (ej: `{{persona.nombreCompleto}}`, `{{empresa.nit}}`).

**RN-FMT-014** — El catálogo de tokens contiene 36 tokens organizados en 6 categorías: Persona (13), Empresa (10), Curso (7), Personal (4), Matrícula (2), Sistema (1). (`tokenSources.ts`)

**RN-FMT-015** — Cada token mapea a un `AutoFieldKey` que se resuelve via `resolveAutoField.ts` usando el contexto de la matrícula (persona, matrícula, curso, entrenador, supervisor).

**RN-FMT-016** — Los tokens no resueltos se muestran con un badge visual amarillo en la vista previa: `<span style="background:#fef3c7...">{{grupo.campo}}</span>`.

**RN-FMT-017** — La función `buildFormatoContext` construye el diccionario de contexto recorriendo todos los tokens del catálogo y resolviéndolos contra las entidades del sistema.

### Editor

**RN-FMT-018** — El editor de plantillas usa TipTap (rich text) con soporte para: texto enriquecido, tablas, alineación de texto, e inserción de tokens desde una biblioteca lateral.

**RN-FMT-019** — La biblioteca de tokens (`TokenLibrary`) agrupa los tokens por categoría y permite insertarlos con un clic en la posición del cursor.

### Versionado

**RN-FMT-020** — Cada formato puede tener múltiples versiones (`FormatoVersion`) con: HTML, CSS opcional, fecha, y creador.

**RN-FMT-021** — Guardar versión toma snapshot del HTML/CSS actual del formato.

**RN-FMT-022** — Restaurar versión reemplaza el HTML/CSS del formato actual con los de la versión seleccionada.

### Plantillas Base

**RN-FMT-023** — Existen plantillas base preconstruidas (`PlantillaBase`) que sirven como punto de partida para crear nuevos formatos. Incluyen: Constancia de Asistencia, Acta de Compromiso, Registro de Entrega de EPP.

**RN-FMT-024** — Al crear un formato desde plantilla base, se copian `htmlTemplate` y `cssTemplate`, y se guarda `plantillaBaseId` como referencia.

### Encabezado Institucional

**RN-FMT-025** — Los formatos pueden usar encabezado institucional configurable con: logo, nombre del centro, código de documento, versión, fecha, paginación, y alineación.

### Firmas

**RN-FMT-026** — Cada formato define qué firmas requiere: aprendiz, entrenador, supervisor. Los bloques de firma (`signature_aprendiz`, `signature_entrenador_auto`, `signature_supervisor_auto`) renderizan automáticamente las firmas capturadas.

### Duplicación

**RN-FMT-027** — Duplicar un formato crea una copia con nombre "Copia de {nombre}", incrementa la versión, resetea el estado a `borrador`, y genera nuevo ID.

### Bloques (Motor Legacy)

**RN-FMT-028** — El motor de bloques soporta 18 tipos: heading, paragraph, text, date, number, radio, select, checkbox, auto_field, attendance_by_day, signature_aprendiz, signature_entrenador_auto, signature_supervisor_auto, health_consent, data_authorization, evaluation_quiz, satisfaction_survey, section_title. (`TipoBloque`)

**RN-FMT-029** — Los bloques `auto_field` resuelven automáticamente 36 campos del sistema agrupados en: datos de aprendiz, empresa, curso, personal, matrícula, y sistema. (`AutoFieldKey`)

**RN-FMT-030** — El bloque `evaluation_quiz` tiene un `umbralAprobacion` (porcentaje mínimo para aprobar, ej: 70%) y un array de preguntas con opciones y respuesta correcta.

**RN-FMT-031** — El bloque `health_consent` define preguntas con campo detalle opcional y condiciones (ej: embarazo solo si género = F).

**RN-FMT-032** — El bloque `satisfaction_survey` combina preguntas de escala (4 opciones) con una pregunta Sí/No.

### Respuestas de Formato

**RN-FMT-033** — La entidad `FormatoRespuesta` almacena respuestas por matrícula y formato con estados: `pendiente`, `completado`, `firmado`.

---

## 6. Módulo Cartera

### Modelo de Datos

**RN-CAR-001** — Tipos de responsable de pago: `empresa`, `independiente`, `arl`. (`TipoResponsable`)

**RN-CAR-002** — Estados de grupo de cartera: `sin_facturar`, `facturado`, `abonado`, `pagado`, `vencido`. (`EstadoGrupoCartera`)

**RN-CAR-003** — Estados de factura: `por_pagar`, `parcial`, `pagada`. (`EstadoFactura`)

**RN-CAR-004** — Métodos de pago: `transferencia`, `efectivo`, `consignacion`, `tarjeta`. (`MetodoPago`)

### Responsable de Pago

**RN-CAR-005** — `ResponsablePago` es una entidad propia con: tipo, nombre, NIT, `empresaId` (opcional FK al Directorio de Empresas), datos de contacto y dirección de facturación.

**RN-CAR-006** — Cuando el responsable es tipo `empresa`, se busca en el Directorio de Empresas por NIT para vincular con `empresaId`. Los datos de nombre, NIT y contacto se copian como snapshot.

**RN-CAR-007** — Pueden existir responsables de pago que no estén en el Directorio de Empresas (independientes, ARLs, empresas no registradas).

### Agrupación Automática

**RN-CAR-008** — Al crear una matrícula, se ejecuta `asignarMatriculaACartera` que busca o crea un `ResponsablePago` por NIT (empresa) o documento (independiente), y luego busca o crea un `GrupoCartera` para ese responsable.

**RN-CAR-009** — Si la empresa del NIT existe en el Directorio, se vincula automáticamente `empresaId` al `ResponsablePago`.

**RN-CAR-010** — Cada matrícula se agrega al grupo existente del responsable si ya existe. El valor total del grupo se incrementa con el `valorCupo` de la nueva matrícula.

### Recálculo de Estados

**RN-CAR-011** — El estado del grupo se recalcula automáticamente en cada consulta:
- `pagado`: saldo ≤ 0 y totalValor > 0
- `vencido`: alguna factura no pagada tiene fecha vencimiento pasada
- `abonado`: totalAbonos > 0 pero saldo > 0
- `facturado`: tiene facturas pero sin abonos
- `sin_facturar`: sin facturas

**RN-CAR-012** — El estado de la factura se recalcula basado en pagos:
- `pagada`: total pagado ≥ total factura
- `parcial`: total pagado > 0 pero < total
- `por_pagar`: sin pagos

### Facturas

**RN-CAR-013** — Al crear factura, se sincronizan los campos `facturaNumero` y `fechaFacturacion` en las matrículas asociadas.

**RN-CAR-014** — Al editar factura, se re-sincronizan las matrículas vinculadas.

**RN-CAR-015** — Eliminar factura también elimina todos los pagos asociados y re-sincroniza el grupo.

### Actividades

**RN-CAR-016** — Tipos de actividad: `llamada`, `promesa_pago`, `comentario`, `sistema`. (`TipoActividadCartera`)

**RN-CAR-017** — Las actividades de tipo `sistema` se generan automáticamente al: registrar factura, registrar pago, actualizar factura, eliminar factura, eliminar pago, asignar matrícula al grupo.

**RN-CAR-018** — Las actividades se ordenan por fecha descendente (más recientes primero).

### Navegación a Empresa

**RN-CAR-019** — En la vista de cartera, si el responsable tiene `empresaId`, se muestra un enlace visual que navega al detalle de la empresa en el Directorio.

---

## 7. Módulo Certificación

### Modelo de Datos

**RN-CER-001** — Estados de certificado: `elegible`, `generado`, `bloqueado`, `revocado`. (`EstadoCertificado`)

**RN-CER-002** — El certificado generado incluye: snapshot de datos al momento de generación, SVG final renderizado, versión de plantilla usada, y código único.

### Plantillas de Certificado

**RN-CER-003** — Cada plantilla tiene: SVG editable con tokens, tipo de formación asociado, reglas de negocio, niveles asignados, y sistema de versionado con historial.

**RN-CER-004** — Reglas por tipo de certificado definen: si requiere pago, documentos, formatos, si incluye empresa, y si incluye firmas. (`ReglaTipoCertificado`)

### Excepciones

**RN-CER-005** — Se puede solicitar excepción para generar certificado sin cumplir todos los requisitos. Estados: `pendiente`, `aprobada`, `rechazada`. (`SolicitudExcepcionCertificado`)

### Revocación

**RN-CER-006** — Un certificado puede ser revocado registrando: quién revoca, motivo, y fecha de revocación.

---

## 8. Módulo Portal Estudiante

### Modelo de Datos

**RN-POR-001** — Tipos de documento del portal: `firma_autorizacion`, `evaluacion`, `formulario`, `solo_lectura`. (`TipoDocPortal`)

**RN-POR-002** — Estados de documento del portal: `bloqueado`, `pendiente`, `completado`. (`EstadoDocPortal`)

### Acceso

**RN-POR-003** — El acceso al portal público se realiza mediante cédula (número de documento). El servicio `buscarMatriculaVigente` busca matrículas cuyo curso tenga `fechaFin` igual o posterior a la fecha actual y que tengan `portalEstudiante.habilitado === true`. *(Nuevo v3.0)*

**RN-POR-004** — Si no se encuentra matrícula vigente, se deniega el acceso con mensaje de error contextual.

### Dependencias

**RN-POR-005** — Los documentos del portal tienen dependencias entre sí (`dependeDe`): un documento no puede desbloquearse hasta que sus dependencias estén completadas.

**RN-POR-006** — El orden de presentación de documentos es configurable por campo `orden`.

### Habilitación por Nivel

**RN-POR-007** — Cada documento del portal se puede habilitar o deshabilitar por tipo de formación (nivel). (`habilitadoPorNivel` en `PortalDocumentoConfigAdmin`)

### Intentos

**RN-POR-008** — Los documentos pueden almacenar múltiples intentos (`intentos: DocumentoPortalEstado[]`), útil para evaluaciones que permiten reintento.

---

## 9. Módulo Personal y Cargos

### Cargos

**RN-PNL-001** — Tipos de cargo: `entrenador`, `supervisor`, `administrativo`, `instructor`, `otro`. (`TipoCargo`)

**RN-PNL-002** — Cada cargo tiene nombre y tipo. El nombre es personalizable (ej: "Entrenador Senior").

### Personal

**RN-PNL-003** — El personal tiene: nombres, apellidos, cargo (FK), firma digital (Base64), y array de adjuntos.

**RN-PNL-004** — Los adjuntos del personal almacenan: nombre, tipo MIME, tamaño, fecha de carga, y data URL (base64 para mock).

**RN-PNL-005** — Solo personal con cargo tipo `entrenador` o `instructor` puede asignarse como entrenador de un curso.

**RN-PNL-006** — Solo personal con cargo tipo `supervisor` puede asignarse como supervisor de un curso.

---

## 10. Módulo Empresas (Directorio)

### Modelo de Datos

**RN-EMP-001** — La entidad `Empresa` centraliza la información corporativa: nombre, NIT (identificador único), representante legal, sector económico, ARL, dirección, teléfono, persona de contacto, teléfono contacto, email contacto, y estado activo/inactivo.

**RN-EMP-002** — Unicidad de NIT: No se permite crear dos empresas con el mismo NIT. Se lanza error `NIT_DUPLICADO` (HTTP 400). Se valida tanto en creación como en actualización.

**RN-EMP-003** — La empresa tiene un campo `activo` (booleano) que permite desactivarla sin eliminarla (soft-disable).

### Sectores Económicos

**RN-EMP-004** — Sectores económicos disponibles (catálogo fijo): construcción, petróleo/gas/minería, energía eléctrica, telecomunicaciones, mantenimiento industrial, logística/almacenamiento, energías renovables, publicidad exterior, infraestructura vial.

### ARLs

**RN-EMP-005** — ARLs disponibles (catálogo fijo): Sura ARL, Positiva, Colmena, AXA Colpatria, Bolívar, Equidad, Liberty.

### Búsqueda

**RN-EMP-006** — Búsqueda multi-campo: por nombre de empresa, NIT, persona de contacto, o email de contacto. Case-insensitive para texto, exacta para NIT.

### Tarifas Especiales

**RN-EMP-007** — La entidad `TarifaEmpresa` permite registrar precios negociados por empresa y curso: empresa_id (FK), curso_id (FK), curso_nombre (desnormalizado), valor.

**RN-EMP-008** — Las tarifas se administran desde el detalle de cada empresa en una sección dedicada con operaciones CRUD.

**RN-EMP-009** — Cada tarifa es única por combinación empresa+curso (no explícitamente validado en mock, pero es la intención del modelo).

### Navegación

**RN-EMP-010** — El directorio de empresas se ubica en el sidebar bajo "Directorio" como submenú colapsable junto a "Personas".

### Estudiantes Enviados

**RN-EMP-011** — En el detalle de empresa se muestra una sección con los estudiantes (personas) que han sido matriculados con esa empresa, contando matrículas con `empresaId` coincidente.

**RN-EMP-012** — En la tabla principal de empresas se muestra una columna "Estudiantes" con el conteo de matrículas asociadas.

### Eliminación

**RN-EMP-013** — Eliminación destructiva en mock. En producción debe verificar integridad referencial: matrículas, tarifas, y responsables de cartera vinculados.

---

## 11. Módulo Auditoría

### Modelo de Datos

**RN-AUD-001** — Tipos de entidad auditables: `persona`, `matricula`, `curso`, `comentario`, `nivel_formacion`, `personal`, `cargo`, `certificado`, `plantilla_certificado`, `excepcion_certificado`. (`TipoEntidad`)

**RN-AUD-002** — Tipos de acción: `crear`, `editar`, `eliminar`. (`TipoAccion`)

**RN-AUD-003** — Cada log registra: entidad afectada (tipo + ID), acción, campos modificados, valor anterior, valor nuevo, usuario, justificación opcional, y timestamp.

### ⚠️ Entidades faltantes en auditoría

**RN-AUD-004** — Las siguientes entidades NO están incluidas en `TipoEntidad` y deberían agregarse: `empresa`, `formato_formacion`, `tarifa_empresa`, `factura`, `pago`, `grupo_cartera`. Esto es deuda técnica pendiente.

---

## 12. Módulo Comentarios

### Modelo de Datos

**RN-COM-001** — Secciones de comentarios: `cartera`, `observaciones`, `curso_observaciones`. (`SeccionComentario`)

**RN-COM-002** — Los comentarios son genéricos: el campo `matriculaId` funciona como ID de entidad genérica (puede ser matrícula o curso).

**RN-COM-003** — Los comentarios tienen: texto, usuario (ID y nombre), fecha de creación, y fecha de edición opcional.

---

## 13. Módulo Drive (Almacenamiento)

**RN-DRV-001** — Los archivos se almacenan en Google Drive como integración planificada. El servicio actual utiliza URLs de Drive como referencia.

**RN-DRV-002** — Los documentos de matrícula referencian archivos por URL de Drive (`urlDrive`).

**RN-DRV-003** — Las facturas pueden tener archivo adjunto (`archivoFactura`) almacenado como referencia.

---

## 14. UX y Protecciones de Navegación *(Nuevo v3.0)*

### Tooltips

**RN-UX-001** — Todos los botones icon-only de la aplicación usan el componente `IconButton` que envuelve `Button` con un `Tooltip` de Radix UI. Al hacer hover se muestra el nombre de la acción (ej: "Volver", "Editar", "Eliminar", "Vista previa", "Descargar", "Copiar").

**RN-UX-002** — Los tooltips aparecen por debajo del botón por defecto (`side="bottom"`), son configurables con `tooltipSide`, y tienen estilos coherentes con el diseño del sistema (`bg-popover`, bordes redondeados, sombra).

### Protección de Navegación en Formularios de Matrícula

**RN-UX-003** — Al crear o editar una matrícula, si el formulario tiene cambios sin guardar (`isDirty`), se intercepta cualquier intento de navegación (botón volver, sidebar, botón atrás del navegador, cierre de pestaña) y se muestra un diálogo de confirmación.

**RN-UX-004** — El diálogo de "Cambios sin guardar" ofrece tres opciones:
- **Seguir editando**: Cierra el diálogo y permanece en el formulario.
- **Descartar**: Navega sin guardar cambios.
- **Guardar**: Ejecuta el guardado y luego navega al destino.

**RN-UX-005** — La interceptación se implementa mediante monkey-patching de `history.pushState` y `history.replaceState`, capturando navegaciones programáticas (incluyendo las del sidebar). Se complementa con listeners de `beforeunload` (cierre de pestaña) y `popstate` (botón atrás).

**RN-UX-006** — Si el formulario no tiene cambios (`isDirty === false`), la navegación se permite libremente sin mostrar ningún diálogo.

**RN-UX-007** — Tras guardar exitosamente una matrícula (nueva o editada), se activa un flag de bypass (`skipNavGuardRef`) antes de navegar, evitando que el interceptor bloquee la redirección post-guardado.

**RN-UX-008** — El mismo patrón de protección se aplica tanto en `MatriculaFormPage` (creación) como en `MatriculaDetallePage` (edición), verificando `isDirty` del formulario y cambios en datos de persona.

---

## 15. Integraciones entre Módulos

### Empresas ↔ Matrículas

**RN-INT-001** — Al seleccionar empresa en matrícula, se autocompletan: nombre, NIT, representante legal desde el Directorio. Los datos se copian (snapshot), no se referencian en vivo.

**RN-INT-002** — El campo `empresaId` en matrícula permite navegación al detalle de empresa desde el detalle y la ficha de matrícula.

**RN-INT-003** — Al crear empresa inline desde el formulario de matrícula, se crea en el Directorio y se vincula automáticamente.

### Empresas ↔ Cartera

**RN-INT-004** — `ResponsablePago.empresaId` vincula opcionalmente al Directorio. Se resuelve por NIT al crear el responsable.

**RN-INT-005** — Los datos desnormalizados en `ResponsablePago` (nombre, NIT, contacto) son snapshot del momento de creación. No se actualizan automáticamente si la empresa cambia en el Directorio.

**RN-INT-006** — En la vista de cartera, responsables con `empresaId` muestran un enlace navegable al Directorio.

### Matrículas ↔ Cartera

**RN-INT-007** — Al crear matrícula con datos de empresa y valor de cupo, se ejecuta auto-agrupación en Cartera (`asignarMatriculaACartera`).

**RN-INT-008** — Las facturas sincronizan bidirecionalmente: `facturaNumero` y `fechaFacturacion` se escriben en las matrículas asociadas.

### Matrículas ↔ Formatos

**RN-INT-009** — Los formatos visibles en una matrícula se filtran por: `activo`, `visibleEnMatricula`, y scope de asignación coincidente con el tipo de formación. Se usa `curso.tipoFormacion` como clave primaria o `matricula.empresaNivelFormacion` como fallback cuando no hay curso asignado. *(Actualizado v3.0)*

**RN-INT-010** — Los formatos legacy se renderizan con componentes hardcodeados específicos. Los formatos de plantilla HTML se renderizan dinámicamente con `DynamicFormatoDocument`.

**RN-INT-011** — La sincronización entre Gestión de Formatos y los formatos en matrículas es en tiempo real: `useFormatosMatricula` consulta dinámicamente los formatos activos vigentes en cada acceso, sin snapshot. *(Nuevo v3.0)*

### Formatos ↔ Tokens

**RN-INT-012** — Los tokens en plantillas HTML se resuelven contra: Persona (del personaId de la matrícula), Matrícula (directamente), Curso (del cursoId), Entrenador (del entrenadorId del curso), Supervisor (del supervisorId del curso).

**RN-INT-013** — Los datos de empresa en tokens provienen de la matrícula (desnormalizados), no directamente del Directorio.

### Cursos ↔ Personal

**RN-INT-014** — El entrenador del curso debe ser personal con cargo tipo `entrenador` o `instructor`.

**RN-INT-015** — El supervisor del curso es opcional y debe ser personal con cargo tipo `supervisor`.

### Matrículas ↔ Certificación

**RN-INT-016** — El estado `certificada` de la matrícula se asigna al generar el certificado. La elegibilidad depende de las reglas del tipo de certificado (pago, documentos, formatos).

### Matrículas ↔ Documentos Requeridos

**RN-INT-017** — Al consultar el detalle de una matrícula, se ejecuta `sincronizarDocumentos` que compara los documentos actuales contra los requeridos por el nivel de formación vigente. Se agregan los faltantes sin alterar los ya existentes (preserva archivos cargados). *(Nuevo v3.0)*

---

## 16. Inconsistencias y Deuda Técnica

### Críticas

**INC-001** — **Auditoría incompleta:** `TipoEntidad` no incluye `empresa`, `formato_formacion`, `tarifa_empresa`, `factura`, `pago`, `grupo_cartera`. Acciones sobre estas entidades no se registran en el log de auditoría.

**INC-002** — **Duplicidad de datos de empresa:** La matrícula almacena `empresaNombre`, `empresaNit`, `empresaRepresentanteLegal`, `empresaCargo`, etc. como campos planos, además de `empresaId`. Esto es intencional (snapshot) pero crea riesgo de inconsistencia si se edita la matrícula sin actualizar todos los campos.

**INC-003** — **Datos de cartera duplicados en matrícula:** La matrícula tiene campos propios de cartera (`valorCupo`, `abono`, `fechaFacturacion`, `facturaNumero`) que también existen en el módulo de Cartera. No hay sincronización bidireccional completa.

### Importantes

**INC-004** — **Contacto de emergencia sin validación:** El modelo requiere `contactoEmergencia` como obligatorio en la interfaz TypeScript, pero el servicio no valida su presencia al crear/actualizar.

**INC-005** — **Integridad referencial ausente:** Al eliminar persona, empresa, curso, o nivel de formación, no se verifican referencias en otras entidades. En producción, el backend debe implementar cascade o restrict.

**INC-006** — **Tarifas sin validación de unicidad:** No se valida explícitamente que no existan dos tarifas para la misma combinación empresa+curso.

### Menores

**INC-007** — **`TipoFormacion` como union abierta:** Incluye `| string` lo que permite valores arbitrarios no definidos en el enum. Debería restringirse a los 4 valores conocidos.

**INC-008** — **Nombre del comentario genérico:** El campo `matriculaId` en `Comentario` se usa como ID genérico de entidad, pero su nombre sugiere que solo aplica a matrículas.

**INC-009** — **MetodoPago divergente:** `MetodoPago` en Cartera tiene 4 valores; `FormaPago` en Matrícula tiene 8 (transferencia_bancaria, efectivo, consignacion, nequi, daviplata, bre_b, corresponsal_bancario, otro). Deberían unificarse.

**INC-010** — **Estado de empresa `activo` no filtrado:** El Directorio no filtra empresas inactivas en autocomplete de matrículas. Empresas desactivadas podrían seleccionarse.

### Resueltas desde v2.0

**INC-R01** — ~~**Campo `pagado` no calculado:**~~ El booleano `pagado` en matrícula ahora se calcula automáticamente al registrar un pago: `true` cuando `saldo <= 0`. *(Resuelto v3.0)*

---

## Resumen de Cambios respecto a v2.0

| Área | Cambios |
|------|---------|
| Personas | RN-PER-003 actualizada (género incluye 'O'/Otro); nueva RN-PER-007 (datos de dirección solo en matrícula) |
| Matrículas | Nuevas reglas: curso opcional (RN-MAT-005), sincronización documentos (RN-MAT-013), auto-init portal (RN-MAT-021), auto-cartera (RN-MAT-022); FormaPago actualizada con 8 métodos |
| Formatos | Nuevas reglas: fallback empresaNivelFormacion (RN-FMT-011), sincronización en tiempo real (RN-FMT-012) |
| Cursos | RN-CUR-007 nueva (columna ARL en CSV MinTrabajo) |
| Portal Estudiante | Nuevas reglas de acceso: vigencia por fechaFin (RN-POR-003/004) |
| UX/Navegación | Sección nueva completa (14): tooltips (RN-UX-001/002), protección de navegación (RN-UX-003 a RN-UX-008) |
| Integraciones | Nuevas: RN-INT-011 (sincronización formatos en tiempo real), RN-INT-017 (sincronización documentos con nivel) |
| Inconsistencias | INC-R01 resuelta (pagado ahora es calculado); INC-009 actualizada con lista real de formas de pago |

**Total de reglas:** 190+  
**Inconsistencias activas:** 10  
**Inconsistencias resueltas:** 1
