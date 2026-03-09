# Documentación del Sistema SAFA

**Sistema de Administración para Centros de Formación en Trabajo Seguro en Alturas**

> Versión: 1.7  
> Última actualización: 9 de Marzo 2026  
> Marco normativo: Resolución 4272 de 2021 (Colombia)

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Módulo de Personas](#3-módulo-de-personas)
4. [Módulo de Matrículas](#4-módulo-de-matrículas)
5. [Módulo de Cursos](#5-módulo-de-cursos)
6. [Módulo de Niveles de Formación](#6-módulo-de-niveles-de-formación)
7. [Módulo de Gestión de Personal](#7-módulo-de-gestión-de-personal)
8. [Portal Estudiante (Admin)](#8-portal-estudiante-admin)
9. [Portal Estudiante (Público)](#9-portal-estudiante-público)
10. [Módulo de Certificación](#10-módulo-de-certificación)
11. [Módulo de Cartera](#11-módulo-de-cartera)
12. [Dashboard](#12-dashboard)
13. [Componentes Compartidos](#13-componentes-compartidos)
14. [Capa de Servicios y Datos](#14-capa-de-servicios-y-datos)
15. [Hooks (React Query)](#15-hooks-react-query)
16. [Relación entre Módulos](#16-relación-entre-módulos)
17. [Catálogos y Datos de Referencia](#17-catálogos-y-datos-de-referencia)
18. [Auditoría y Trazabilidad](#18-auditoría-y-trazabilidad)
19. [Historial de Cambios](#19-historial-de-cambios)

---

## 1. Introducción

### 1.1 Propósito

SAFA es un sistema de gestión integral para centros de formación y entrenamiento en **trabajo seguro en alturas**, conforme a la Resolución 4272 de 2021 del Ministerio del Trabajo de Colombia. El sistema gestiona el ciclo completo de formación: desde el registro de personas y la matrícula en cursos, pasando por la gestión documental y financiera, hasta la certificación final.

### 1.2 Alcance Funcional

El sistema abarca ocho módulos principales:

| Módulo | Función Principal |
|--------|-------------------|
| **Personas** | Registro y gestión de datos personales, laborales y de contacto |
| **Matrículas** | Vinculación persona-curso con gestión documental, financiera y de certificación |
| **Cursos** | Programación, control de capacidad, calendario y estadísticas de cursos |
| **Niveles de Formación** | Configuración dinámica de niveles, documentos requeridos y campos adicionales |
| **Gestión de Personal** | Administración de perfiles de staff, cargos, firmas digitales y documentos adjuntos |
| **Portal Estudiante (Admin)** | Configuración del catálogo de documentos, habilitación por nivel, y monitoreo de progreso |
| **Portal Estudiante (Público)** | Interfaz mobile-first para que estudiantes completen documentos de formación |
| **Certificación** | Gestión de plantillas SVG, tipos de certificado, generación y emisión de certificados, excepciones |

Adicionalmente, un **Dashboard** centraliza las métricas operativas clave.

---

## 2. Arquitectura del Sistema

### 2.1 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework UI | React 18 + TypeScript |
| Bundler | Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Gestión de Estado | TanStack React Query v5 |
| Routing | React Router DOM v6 |
| Formularios | React Hook Form + Zod |
| Iconos | Lucide React |
| Componentes UI | Radix UI (via shadcn/ui) |
| Firma Digital | react-signature-canvas |

### 2.2 Patrón de Arquitectura: Backend Emulado

El sistema utiliza una arquitectura **Frontend-First** con backend emulado:

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                   │
│  Pages → Components → Hooks (React Query)                │
└──────────────────────┬──────────────────────────────────┘
                       │ mutateAsync / queryFn
┌──────────────────────▼──────────────────────────────────┐
│                   CAPA DE SERVICIOS                       │
│  personaService · matriculaService · cursoService        │
│  comentarioService · documentoService · driveService     │
│  nivelFormacionService · personalService                 │
│  portalAdminService · portalEstudianteService            │
│  portalMatriculaService · portalMonitoreoService         │
│  portalInitService · formatoFormacionService             │
│  certificadoService · plantillaService                   │
│  tipoCertificadoService · excepcionCertificadoService    │
│        ┌─────────────┐                                   │
│        │ delay(ms)   │  ← Simula latencia de red         │
│        └─────────────┘                                   │
└──────────────────────┬──────────────────────────────────┘
                       │ CRUD sobre arrays
┌──────────────────────▼──────────────────────────────────┐
│                   CAPA DE DATOS                           │
│  mockData.ts (arrays en memoria)                         │
│  mockCertificados.ts (plantillas, tipos, certificados)   │
│  portalAdminConfig.ts (catálogo portal)                  │
│  mockPersonas · mockMatriculas · mockCursos              │
│  mockNivelesFormacion · mockPersonalStaff · mockCargos   │
│  mockComentarios · mockAuditLogs                         │
│  mockPlantillas · mockTiposCertificado                   │
│  mockCertificados · mockExcepcionesCertificado           │
│  portalDocumentosCatalogo                                │
└─────────────────────────────────────────────────────────┘
```

**Características clave:**
- Todas las operaciones son **asíncronas** con `delay()` artificial (500-1500ms) para simular latencia real.
- Los servicios operan sobre **arrays mutables** en memoria (`mockData.ts`).
- Cada operación de escritura genera automáticamente un **log de auditoría**.
- La clase `ApiError` simula errores HTTP con códigos de estado y códigos de error personalizados.

### 2.3 Estructura de Directorios

```
src/
├── components/
│   ├── layout/          # MainLayout, AppSidebar
│   ├── certificacion/   # Componentes de certificación (PlantillaTestDialog, PlantillaVersionHistory)
│   ├── cursos/          # Componentes específicos de cursos
│   ├── estudiante/      # Componentes del portal estudiante (QuizReviewCard)
│   ├── formatos/        # Editor y preview de formatos de formación
│   ├── matriculas/      # Componentes específicos de matrículas
│   │   └── formatos/    # Documentos PDF previsualizables
│   ├── niveles/         # Componentes de niveles de formación
│   ├── personal/        # Componentes de gestión de personal
│   ├── personas/        # Componentes específicos de personas
│   ├── portal-admin/    # Componentes de administración del portal
│   ├── shared/          # Componentes reutilizables
│   └── ui/              # shadcn/ui base components
├── contexts/
│   └── PortalEstudianteContext.tsx  # Sesión del portal estudiante
├── data/
│   ├── mockData.ts      # Datos iniciales en memoria
│   ├── mockCertificados.ts  # Datos mock de certificación
│   ├── formOptions.ts   # Catálogos para selectores
│   ├── portalAdminConfig.ts  # Catálogo de documentos del portal
│   └── portalEstudianteConfig.ts  # Configuración del portal público
├── hooks/               # Custom hooks (React Query)
├── pages/               # Páginas por módulo
│   ├── certificacion/   # Páginas de certificación
│   ├── cursos/
│   ├── estudiante/      # Páginas del portal público (AccesoEstudiante, PanelDocumentos, etc.)
│   ├── formatos/
│   ├── matriculas/
│   ├── niveles/
│   ├── personal/
│   ├── personas/
│   └── portal-admin/    # Administración del portal estudiante
├── services/            # Capa de servicios (API emulada)
├── types/               # Definiciones TypeScript
└── utils/               # Utilidades (CSV, resolvers, generador de certificados)
```

### 2.4 Enrutamiento

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | `Index` | Login / Landing |
| `/dashboard` | `Dashboard` | Panel principal con métricas |
| `/personas` | `PersonasPage` | Listado de personas |
| `/personas/nuevo` | `PersonaFormPage` | Crear persona |
| `/personas/:id` | `PersonaDetallePage` | Detalle de persona |
| `/personas/:id/editar` | `PersonaFormPage` | Editar persona |
| `/matriculas` | `MatriculasPage` | Listado de matrículas |
| `/matriculas/nueva` | `MatriculaFormPage` | Crear matrícula |
| `/matriculas/:id` | `MatriculaDetallePage` | Detalle de matrícula |
| `/cursos` | `CursosPage` | Listado de cursos |
| `/cursos/nuevo` | `CursoFormPage` | Crear curso |
| `/cursos/:id` | `CursoDetallePage` | Detalle de curso |
| `/niveles` | `NivelesPage` | Listado de niveles de formación |
| `/niveles/nuevo` | `NivelFormPage` | Crear nivel de formación |
| `/niveles/:id` | `NivelDetallePage` | Detalle de nivel de formación |
| `/niveles/:id/editar` | `NivelFormPage` | Editar nivel de formación |
| `/gestion-personal` | `GestionPersonalPage` | Listado de personal (staff) |
| `/gestion-personal/nuevo` | `PersonalFormPage` | Crear perfil de personal |
| `/gestion-personal/:id` | `PersonalDetallePage` | Detalle de personal |
| `/gestion-personal/:id/editar` | `PersonalFormPage` | Editar perfil de personal |
| `/gestion-formatos` | `FormatosPage` | Listado de formatos de formación |
| `/gestion-formatos/nuevo` | `FormatoEditorPage` | Crear formato |
| `/gestion-formatos/:id/editar` | `FormatoEditorPage` | Editar formato |
| `/portal-estudiante` | `PortalAdminPage` | Administración del portal estudiante |
| `/certificacion/historial` | `HistorialCertificadosPage` | Historial de certificados generados |
| `/certificacion/plantillas` | `PlantillasPage` | Gestión de plantillas SVG y tipos de certificado |
| `/certificacion/plantillas/:id/editar` | `PlantillaEditorPage` | Editor de mapeo de etiquetas SVG |
| `/estudiante` | `AccesoEstudiantePage` | Acceso público por cédula |
| `/estudiante/inicio` | `PanelDocumentosPage` | Panel de documentos del estudiante |
| `/estudiante/documentos/:documentoKey` | `DocumentoRendererPage` | Renderer genérico de documentos |

Rutas protegidas se envuelven en `MainLayout`. Rutas del portal estudiante se envuelven en `PortalEstudianteProvider` y `PortalGuard`. El módulo de Certificación agrupa sus subrutas bajo `/certificacion/` con menú desplegable en el sidebar.

---

## 3. Módulo de Personas

### 3.1 Entidad: `Persona`

Representa a un individuo registrado en el sistema (estudiante, trabajador, etc.).

```typescript
interface Persona {
  id: string;
  
  // Identificación
  tipoDocumento: 'CC' | 'CE' | 'PA' | 'PE' | 'PP';
  numeroDocumento: string;          // Único en el sistema
  
  // Datos personales
  nombres: string;
  apellidos: string;
  genero: 'M' | 'F';
  paisNacimiento: string;           // Código ISO (ej: 'CO')
  fechaNacimiento: string;          // ISO date
  rh: string;                       // Grupo sanguíneo
  
  // Datos laborales/educativos
  nivelEducativo: NivelEducativo;   // 10 niveles desde 'analfabeta' hasta 'doctorado'
  areaTrabajo: 'administrativo' | 'operativa';
  sectorEconomico: string;          // Catálogo de 20 sectores
  
  // Contacto
  email: string;
  telefono: string;
  
  // Contacto de emergencia
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    parentesco: string;
  };
  
  // Firma digital
  firma?: string;                   // Base64 de imagen PNG
  firmaFecha?: string;
  
  // Metadatos
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Operaciones y Reglas de Negocio

| Operación | Regla de Negocio |
|-----------|-----------------|
| **Crear** | Valida **unicidad del número de documento**. Si existe, lanza `ApiError` con código `DOCUMENTO_DUPLICADO`. |
| **Buscar** | Búsqueda multi-campo: por número de documento, nombres, apellidos o email. Requiere mínimo 2 caracteres. |
| **Editar** | Actualización parcial (`Partial<PersonaFormData>`). Registra campos modificados en auditoría. |
| **Eliminar** | Registra log de auditoría antes de eliminar. No valida si tiene matrículas asociadas (potencial mejora). |
| **Buscar por documento** | Búsqueda exacta por `numeroDocumento`. Habilitada solo con 6+ caracteres. |

### 3.3 Componentes

| Componente | Función |
|------------|---------|
| `PersonasPage` | Tabla con búsqueda, filtros (género, sector, nivel educativo), selección múltiple, columnas configurables con ordenamiento interactivo, y acciones en lote. |
| `PersonaDetailSheet` | Panel lateral deslizable con vista resumida y edición inline de todos los campos. |
| `PersonaDetallePage` | Vista completa a pantalla completa. |
| `PersonaFormPage` | Formulario de creación/edición. Detecta si es edición por presencia de `:id` en la ruta. |

### 3.4 Flujo Funcional

```
Listado (/personas)
  ├── [Buscar] → Filtrado en tiempo real
  ├── [+ Nueva Persona] → Formulario (/personas/nuevo)
  │     └── Guardar → Validar unicidad → Crear → Redirigir a listado
  ├── [Clic en fila] → Panel lateral (DetailSheet)
  │     ├── Edición inline → Guardar cambios
  │     └── [Pantalla completa] → /personas/:id
  └── [Selección múltiple] → Acciones en lote (eliminar)
```

---

## 4. Módulo de Matrículas

### 4.1 Entidad: `Matricula`

Es la entidad central del sistema. Vincula una **Persona** a un **Curso** y gestiona todo el ciclo de formación: documentación, salud, pagos y certificación.

### 4.2 Ciclo de Estados

```
creada → pendiente → completa → certificada → cerrada
```

| Estado | Descripción |
|--------|-------------|
| `creada` | Matrícula recién registrada, sin documentación ni pagos. |
| `pendiente` | En proceso de completar documentación y/o pagos. |
| `completa` | Documentos verificados, pagos al día, evaluación y encuesta completadas. |
| `certificada` | Certificado generado y/o entregado. |
| `cerrada` | Proceso finalizado y archivado. |

### 4.3 Tipos de Formación

| Tipo | Descripción | Documentos Adicionales |
|------|-------------|----------------------|
| `inicial` | Primera formación en trabajo en alturas | Estándar según nivel |
| `reentrenamiento` | Actualización anual obligatoria | Estándar + historial previo |
| `avanzado` | Nivel avanzado para trabajadores con experiencia | Estándar según nivel |
| `coordinador` | Formación de Coordinador de Trabajo en Alturas | Todos + Certificado de Curso Previo |

### 4.4 Subsistema de Vinculación Laboral

Cada matrícula tiene un tipo de vinculación que determina los datos requeridos:

**Empresa:**
- Nombre de empresa, NIT, Representante Legal
- Cargo del trabajador
- Nivel de formación en empresa (Jefe de Área, Trabajador Autorizado, Reentrenamiento, Coordinador T.A.)
- Contacto de empresa (nombre + teléfono)
- Área de trabajo, Sector económico
- EPS y ARL (con opción "Otra" para texto libre)

**Independiente:**
- Solo datos de empresa opcionales (nombre, NIT, representante legal)
- Área de trabajo, Sector económico
- EPS y ARL

### 4.5 Subsistema de Documentos Requeridos

Los documentos se generan **dinámicamente** según el nivel de formación del trabajador en la empresa (`NivelFormacionEmpresa`):

```
┌─────────────────────┬─────────┬──────────────────────┬──────────────────┬──────────────┐
│ Documento           │ Jefe de │ Trabajador Autorizado│ Reentrenamiento  │ Coordinador  │
│                     │ Área    │                      │                  │ T.A.         │
├─────────────────────┼─────────┼──────────────────────┼──────────────────┼──────────────┤
│ Cédula              │ ✓       │ ✓                    │ ✓                │ ✓            │
│ ARL                 │ ✓       │ ✓                    │ ✓                │ ✓            │
│ Certificado EPS     │ ✓       │ ✓                    │ ✓                │ ✓            │
│ Planilla SS (opc.)  │ ✓       │ ✓                    │ ✓                │ ✓            │
│ Examen Médico       │         │ ✓                    │ ✓                │ ✓            │
│ Certificado Previo  │         │                      │                  │ ✓            │
└─────────────────────┴─────────┴──────────────────────┴──────────────────┴──────────────┘
```

**Estados de documento:** `pendiente` → `cargado` (ciclo binario, sin estado de verificación intermedio). El estado `cargado` se muestra con estilo esmeralda (verde) indicando completitud.

**Modos de carga:**
- **Individual**: Archivo por archivo, con campos de fecha específicos por tipo (fecha de examen médico, inicio de cobertura ARL).
- **Consolidado**: Un solo PDF que agrupa múltiples documentos. Incluye checklist de qué documentos contiene.

**Campos de fecha por tipo de documento:**
- `examen_medico`: `fechaDocumento` (fecha del examen)
- `arl`: `fechaInicioCobertura` (inicio de cobertura)

**Integración con Google Drive (simulada):**
La carga de archivos simula una subida a Google Drive con estructura de carpetas:
```
AÑO / ID_CURSO / NOMBRE_CEDULA / TIPO_DOCUMENTO_ID
```

### 4.6 Subsistema de Consentimiento de Salud

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `consentimientoSalud` | boolean | Aceptación general |
| `restriccionMedica` | boolean + texto | Si aplica, detalle de la restricción |
| `alergias` | boolean + texto | Si aplica, detalle de alergias |
| `consumoMedicamentos` | boolean + texto | Si aplica, nombres de medicamentos |
| `embarazo` | boolean (opcional) | Solo para género femenino |
| `nivelLectoescritura` | boolean | Confirma que puede leer y escribir |

### 4.7 Subsistema de Cobros / Cartera

| Campo | Descripción |
|-------|-------------|
| `cobroContactoNombre` | Persona de contacto para cobros (usualmente del empresa) |
| `cobroContactoCelular` | Celular del contacto |
| `valorCupo` | Valor total del cupo de formación |
| `abono` | Monto abonado hasta la fecha |
| **Saldo** (calculado) | `valorCupo - abono` |
| `fechaFacturacion` | Fecha de emisión de factura |
| `ctaFactNumero` | Número de cuenta/factura (CTA-FACT) |
| `ctaFactTitular` | Nombre del titular de la factura |
| `fechaPago` | Fecha del pago realizado |
| `formaPago` | Efectivo, Transferencia, Consignación, Tarjeta, Otro |
| `pagado` | **Automático**: `true` cuando `saldo <= 0` |

**Regla de negocio:** El estado `pagado` se determina automáticamente al registrar un pago, calculando si el saldo (`valorCupo - abono`) es menor o igual a cero.

**Sistema de comentarios:** La sección de cartera tiene un historial de comentarios independiente (sección `cartera`) que permite registrar seguimiento telefónico, confirmaciones de pago, y cualquier nota relevante al cobro.

### 4.8 Subsistema de Certificación

| Campo | Descripción |
|-------|-------------|
| `fechaGeneracionCertificado` | Automática al generar el PDF del certificado |
| `fechaEntregaCertificado` | Manual, registrada por el usuario al entregar |

### 4.9 Evaluaciones y Encuesta

| Campo | Descripción |
|-------|-------------|
| `evaluacionCompletada` | Boolean: evaluación de reentrenamiento completada |
| `evaluacionPuntaje` | Puntaje obtenido (0–100). Umbral de aprobación: **70%** |
| `evaluacionRespuestas` | Array de enteros: índice de la opción seleccionada por pregunta (0–3) |
| `encuestaCompletada` | Boolean: encuesta de satisfacción completada |
| `encuestaRespuestas` | Array de strings: 4 escalas de satisfacción + 1 pregunta Sí/No |
| `autoevaluacionRespuestas` | Array de respuestas de autoevaluación (otros formatos) |
| `evaluacionCompetenciasRespuestas` | Array de respuestas de evaluación de competencias (otros formatos) |

**Lógica de aprobación:** `evaluacionPuntaje >= 70` → Aprobado. El puntaje se calcula como `(correctas / 15) * 100`, redondeado a entero.

**Persistencia de respuestas individuales:** Cada respuesta se almacena como el índice de la opción elegida (0 = a, 1 = b, 2 = c, 3 = d), permitiendo reconstruir la tabla pregunta/respuesta en cualquier momento.

### 4.10 Formato: Evaluación Reentrenamiento (FIH04-019)

El formato `EvaluacionReentrenamientoDocument` es el documento más complejo del sistema. Opera en dos modos controlados por la prop `modo`:

#### Modos de operación

| Modo | Uso | Comportamiento |
|------|-----|----------------|
| `"diligenciamiento"` | Vista del Estudiante (futuro) | RadioGroups interactivos + botón Enviar |
| `"resultados"` | Vista administrativa actual | Bloque compacto de resultado + tabla pregunta/respuesta + encuesta solo lectura |

#### Estructura del documento (modo "resultados")

1. **Encabezado institucional** (`DocumentHeader`) — logo, nombre documento, código FIH04-019, versión y fechas.
2. **Datos del Participante** — grid de **3 columnas**:
   - Fila 1: Fecha / Tipo de documento / Número de documento
   - Fila 2: Nombre completo (span 3 columnas)
   - Fila 3: Nivel de formación / Empresa (`"Independiente"` si no hay empresa asociada)
3. **Resultado de la Evaluación** — bloque compacto con:
   - Ratio `X/15` + porcentaje, en **verde** si aprobado, **rojo** si no aprobado
   - Badge `✓ Aprobado` / `✗ No aprobado` con color semántico
   - Fila secundaria (solo en pantalla, oculta en PDF): "Respuestas correctas X de 15 — Mínimo requerido: 70%"
4. **Preguntas y Respuestas** — tabla con columnas: #, Pregunta, Respuesta seleccionada (letra + texto), Calificación (✓/✗)
5. **Encuesta de Satisfacción** — tabla con 4 preguntas de escala + 1 Sí/No

#### Preguntas de evaluación

15 preguntas sobre la Resolución 4272/2021 (trabajo seguro en alturas):
- 5 preguntas Verdadero/Falso (opciones: a. Verdadero / b. Falso)
- 10 preguntas de selección múltiple con 4 opciones (a, b, c, d)

Hardcodeadas en la constante `PREGUNTAS` del componente. La respuesta correcta se indica con el índice `correcta`.

#### Componente `FieldCell` — soporte de span

```tsx
function FieldCell({ label, value, span, span3 }: {
  label: string;
  value?: string;
  span?: boolean;   // col-span-2 (grid de 2 o 3 columnas)
  span3?: boolean;  // col-span-3 (solo en grid de 3 columnas)
})
```

#### Generación de PDF (impresión)

El dialog `EvaluacionReentrenamientoPreviewDialog` abre una ventana del navegador con `PRINT_STYLES` autocontenidos. Las reglas de impresión aplicadas:

- **Color semántico**: `.resultado-ratio.aprobado { color: #059669 }` / `.resultado-ratio.no-aprobado { color: #dc2626 }`. Se inyectan las clases dinámicamente en el HTML antes de imprimir.
- **Contenido filtrado**: `.resultado-compacto > div:nth-child(3), > div:nth-child(4) { display: none }` — oculta la fila de "Mínimo requerido" en el PDF.
- **Optimización de espacio**: `body { padding: 6mm; font-size: 11px }`, `.section-group { margin-top: 14px }`, `.tabla-preguntas td { padding: 5px 4px }`.
- **Flujo de página**: `break-inside: auto` en `.section-group` permite que las secciones se dividan entre páginas, minimizando hojas impresas. El bloque `.resultado-compacto` mantiene `break-inside: avoid` para no fragmentarse.
- **Fallback de íconos**: Los SVG de ✓/✗ se reemplazan por `<span class="icon-check/icon-x">` con `::before { content: "✓"/"✗" }` para asegurar visibilidad en print.

#### Encuesta de Satisfacción

| # | Pregunta | Tipo de respuesta |
|---|----------|-------------------|
| 1–4 | Satisfacción con: capacitación / servicio al cliente / trato / calidad | Escala: Muy satisfecho, Satisfecho, Poco satisfecho, Insatisfecho |
| 5 | ¿Volvería a contratar y recomendaría el servicio? | Sí / No |

### 4.11 Formatos para Formación

El sistema genera cuatro tipos de documentos PDF previsualizables:

| Formato | Código | Descripción | Datos que incluye |
|---------|--------|-------------|-------------------|
| **Información del Aprendiz** | — | Ficha con datos personales y laborales | Persona + Matrícula + Empresa + Consentimiento |
| **Registro de Asistencia** | — | Planilla de asistencia por día/hora | Curso + Persona + Fechas |
| **Participación PTA - ATS** | — | Permiso de Trabajo en Alturas / Análisis de Trabajo Seguro | Persona + Empresa + Curso |
| **Evaluación Reentrenamiento** | FIH04-019 | Evaluación de conocimientos + Encuesta de satisfacción | Persona + Matrícula + Respuestas + Resultado |

**Estado del formato (InfoAprendiz, RegistroAsistencia, PtaAts):** Se calcula como `completo` si la matrícula tiene `autorizacionDatos` y `firmaCapturada`, de lo contrario es `borrador`.

**Estado del formato (EvaluaciónReentrenamiento):** Se calcula como `completo` si `evaluacionCompletada === true`, de lo contrario es `pendiente`.

### 4.13 Historial de Formación Previa

Para matrículas de tipo `reentrenamiento` o `coordinador`:

| Campo | Descripción |
|-------|-------------|
| `nivelPrevio` | Nivel alcanzado: Trabajador Autorizado o Avanzado |
| `centroFormacionPrevio` | Nombre del centro donde se formó previamente |
| `fechaCertificacionPrevia` | Fecha de la certificación anterior |

**Pre-llenado automático:** Al crear una nueva matrícula para una persona que ya tiene matrículas completadas/certificadas/cerradas, el sistema ofrece prellenar datos desde la matrícula más reciente (`getHistorialByPersona`).

### 4.14 Firma Digital

| Campo | Descripción |
|-------|-------------|
| `firmaCapturada` | Boolean: indica si se ha capturado la firma |
| `firmaBase64` | Imagen PNG en Base64 de la firma del estudiante |

Se captura mediante un canvas interactivo (`react-signature-canvas`).

### 4.15 Operaciones y Reglas de Negocio

| Operación | Regla de Negocio |
|-----------|-----------------|
| **Crear** | Valida que el curso exista, no esté cerrado, tenga capacidad, y no haya matrícula duplicada (misma persona + mismo curso). El curso es opcional. |
| **Actualizar** | Actualización parcial. Registra campos modificados en auditoría con valores anteriores y nuevos. |
| **Registrar pago** | Calcula saldo automáticamente. Activa `pagado` si `saldo <= 0`. Actualiza `fechaPago` automáticamente si no se proporciona. |
| **Cambiar estado** | Transición libre entre estados (sin validación de secuencia). |
| **Capturar firma** | Almacena Base64 de la firma y marca `firmaCapturada = true`. |
| **Actualizar documento** | Actualización parcial de un documento específico dentro de la matrícula. |
| **Eliminar** | Remueve la matrícula del array `matriculasIds` del curso asociado. |

### 4.16 Componentes

| Componente | Función |
|------------|---------|
| `MatriculasPage` | Tabla con búsqueda, filtros, selección múltiple, columnas con ordenamiento interactivo |
| `MatriculaDetailSheet` | Panel lateral con vista completa: progreso, estudiante, curso, vinculación, documentos, formatos, cartera, certificado, observaciones |
| `MatriculaDetallePage` | Vista completa a pantalla completa con sidebar informativo |
| `MatriculaFormPage` | Formulario wizard de creación |
| `DocumentosCarga` | Componente de carga de documentos (Individual/Consolidado) |
| `ConsentimientoSalud` | Formulario de consentimiento de salud |
| `FirmaCaptura` | Canvas interactivo para captura de firma digital |
| `CrearPersonaModal` | Modal para crear persona desde el flujo de matrícula |
| `FormatosList` | Lista de formatos disponibles con acciones de preview/descarga |
| `InfoAprendizDocument` | Documento PDF de Información del Aprendiz |
| `RegistroAsistenciaDocument` | Documento PDF de Registro de Asistencia |
| `ParticipacionPtaAtsDocument` | Documento PDF de Participación PTA-ATS |
| `EvaluacionReentrenamientoDocument` | Documento PDF interactivo de Evaluación Reentrenamiento FIH04-019 |
| `EvaluacionReentrenamientoPreviewDialog` | Dialog de previsualización y descarga PDF del formato FIH04-019 |

### 4.17 Flujo Funcional Completo

```
1. CREACIÓN
   └── /matriculas/nueva
       ├── Seleccionar Persona (búsqueda por cédula)
       │   └── [No existe] → Modal CrearPersonaModal
       ├── Seleccionar Curso (opcional)
       ├── Tipo de Formación
       ├── Pre-llenado desde historial (si existe matrícula previa)
       └── Guardar → Estado: "creada"

2. GESTIÓN DOCUMENTAL
   └── /matriculas/:id (sección Documentos)
       ├── Modo Individual: Cargar archivo por archivo
       │   ├── Campos de fecha por tipo (examen médico, ARL)
       │   └── Estados: pendiente → cargado
       └── Modo Consolidado: PDF único con checklist
           └── Marcar qué documentos incluye

3. GESTIÓN FINANCIERA
   └── /matriculas/:id (sección Cartera)
       ├── Registrar valor cupo y abonos
       ├── Saldo calculado automáticamente
       ├── Datos de facturación (CTA-FACT)
       ├── Comentarios de seguimiento
       └── Estado pagado automático

4. FORMACIÓN
   └── /matriculas/:id
       ├── Consentimiento de salud
       ├── Firma digital
       ├── Evaluación de competencias
       └── Encuesta de satisfacción

5. CERTIFICACIÓN
   └── /matriculas/:id (sección Certificado)
       ├── Generar certificado → fecha automática
       └── Registrar entrega → fecha manual

6. FORMATOS
   └── /matriculas/:id (sección Formatos)
       ├── InfoAprendiz → Preview/Descarga
       ├── RegistroAsistencia → Preview/Descarga
       ├── ParticipacionPtaAts → Preview/Descarga
       └── EvaluaciónReentrenamiento (FIH04-019)
           ├── modo="resultados" → Preview admin: bloque resultado + tabla preguntas + encuesta
           └── Descargar PDF → ventana print con estilos autocontenidos (colores semánticos, espacio optimizado)
```

---

## 5. Módulo de Cursos

### 5.1 Entidad: `Curso`

```typescript
interface Curso {
  id: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string;           // ISO date
  fechaFin: string;              // ISO date
  duracionDias: number;
  horasTotales: number;
  entrenadorId: string;
  entrenadorNombre: string;
  supervisorId?: string;
  supervisorNombre?: string;
  capacidadMaxima: number;
  estado: 'abierto' | 'en_progreso' | 'cerrado';
  matriculasIds: string[];       // IDs de matrículas inscritas
  createdAt: string;
  updatedAt: string;
}
```

### 5.2 Ciclo de Estados

```
abierto → en_progreso → cerrado
```

| Estado | Descripción |
|--------|-------------|
| `abierto` | Acepta nuevas matrículas |
| `en_progreso` | Curso en ejecución, aún acepta matrículas |
| `cerrado` | Finalizado, no acepta matrículas |

### 5.3 Operaciones y Reglas de Negocio

| Operación | Regla de Negocio |
|-----------|-----------------|
| **Crear** | Genera curso con `matriculasIds: []`. |
| **Cerrar** | **Validación**: No se puede cerrar si hay matrículas con estado `pendiente` o `creada`. Lanza `ApiError` con código `MATRICULAS_PENDIENTES`. |
| **Eliminar** | **Validación**: No se puede eliminar si `matriculasIds.length > 0`. Lanza `ApiError` con código `TIENE_MATRICULAS`. |
| **Agregar estudiantes** | Recibe array de IDs de matrícula. Filtra duplicados. Actualiza `cursoId` en cada matrícula y agrega IDs al array del curso. |
| **Remover estudiante** | Remueve ID del array y limpia `cursoId` en la matrícula (lo pone como `''`). |
| **Estadísticas** | Calcula totales de matrículas: total, completas, pendientes (incluye `creada`), certificadas. |

### 5.4 Componentes

| Componente | Función |
|------------|---------|
| `CursosPage` | Listado con dos vistas: tabla y calendario |
| `CursosListView` | Vista de tabla con búsqueda, filtros y columnas ordenables. Incluye columna "Fecha Creación" (`createdAt`) como primera columna visible por defecto. |
| `CursosCalendarioView` | Vista de calendario (Mes/Semana/Día) con filtros por entrenador y supervisor. Panel lateral de resumen de horas por entrenador. |
| `CursoDetallePage` | Detalle del curso con listado de estudiantes y estadísticas |
| `CursoDetailSheet` | Panel lateral deslizable |
| `CursoFormPage` | Formulario de creación/edición |
| `AgregarEstudiantesModal` | Modal de búsqueda y selección múltiple de matrículas para agregar al curso |

### 5.5 Vista de Calendario

La vista de calendario ofrece:

- **Modos de visualización**: Mes, Semana, Día
- **Filtros**: Por entrenador (multi-select con colores asignados) y por supervisor
- **Panel de resumen**: Horas ejecutadas por entrenador en el período visible
- **Navegación temporal**: Anterior/Siguiente/Hoy
- **Eventos**: Cada curso se muestra como bloque con nombre, entrenador y estado

### 5.6 Flujo Funcional

```
Listado (/cursos)
  ├── Vista Lista
  │   ├── [Buscar] → Filtrar por nombre o entrenador
  │   └── [+ Nuevo Curso] → /cursos/nuevo
  ├── Vista Calendario
  │   ├── Filtrar por entrenador/supervisor
  │   ├── Cambiar modo (Mes/Semana/Día)
  │   └── Clic en evento → Navegar a detalle
  └── Clic en fila/evento → /cursos/:id
        ├── Ver estadísticas del curso
        ├── [Agregar estudiantes] → Modal de búsqueda
        │   └── Seleccionar matrículas → Agregar al curso
        ├── [Remover estudiante] → Confirmación → Eliminar
        └── [Cambiar estado] → Validaciones automáticas
```

---

## 6. Módulo de Niveles de Formación

### 6.1 Entidad: `NivelFormacion`

Permite configurar dinámicamente los niveles de formación del centro, definiendo documentos requeridos y campos adicionales personalizados.

```typescript
interface NivelFormacion {
  id: string;
  nombreNivel: string;
  duracionHoras?: number;
  duracionDias?: number;
  documentosRequeridos: string[];         // Claves del catálogo CATALOGO_DOCUMENTOS
  camposAdicionales?: CampoAdicional[];   // Campos personalizados configurables
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 6.2 Campos Adicionales

El sistema permite agregar campos personalizados a cada nivel de formación. Cada campo tiene las siguientes propiedades:

```typescript
interface CampoAdicional {
  id: string;
  nombre: string;
  tipo: TipoCampoAdicional;    // 12 tipos disponibles
  obligatorio: boolean;
  opciones?: string[];          // Solo para select / select_multiple
  alcance: AlcanceCampo;        // 'solo_nivel' | 'todos_los_niveles'
}
```

**Tipos de campo disponibles:**

| Tipo | Etiqueta | Descripción |
|------|----------|-------------|
| `texto_corto` | Texto corto | Input de texto simple |
| `texto_largo` | Texto largo | Textarea |
| `numerico` | Campo numérico | Input numérico |
| `select` | Lista desplegable | Select con opciones configurables |
| `select_multiple` | Select múltiple | Selección múltiple con opciones configurables |
| `estado` | Estado (activo/inactivo) | Switch booleano |
| `fecha` | Fecha | Date picker |
| `fecha_hora` | Fecha y hora | DateTime picker |
| `booleano` | Campo booleano (switch) | Toggle on/off |
| `archivo` | Subida de archivo | File upload |
| `url` | URL | Input de URL |
| `telefono` | Teléfono | Input de teléfono |
| `email` | Correo electrónico | Input de email |

### 6.3 Catálogo de Documentos Requeridos

| Clave | Documento |
|-------|-----------|
| `cedula` | Cédula de Ciudadanía |
| `examen_medico` | Examen Médico Ocupacional |
| `certificado_eps` | Certificado EPS |
| `arl` | Afiliación ARL |
| `planilla_seguridad_social` | Planilla de Seguridad Social |
| `curso_previo` | Certificado de Curso Previo |

### 6.4 Operaciones y Reglas de Negocio

| Operación | Regla de Negocio |
|-----------|-----------------|
| **Crear** | Genera nivel con documentos y campos opcionales. Audita creación. |
| **Buscar** | Búsqueda por nombre del nivel. Requiere 2+ caracteres. |
| **Editar** | Actualización parcial. Registra campos modificados en auditoría. |
| **Eliminar** | Registra auditoría antes de eliminar. |
| **Gestión de campos adicionales** | CRUD individual sobre campos del array `camposAdicionales` (`addCampoAdicional`, `updateCampoAdicional`, `deleteCampoAdicional`). |

### 6.5 Componentes

| Componente | Función |
|------------|---------|
| `NivelesPage` | Tabla con búsqueda, columnas configurables y acciones por fila |
| `NivelDetallePage` | Vista de detalle con información del nivel, documentos y campos adicionales |
| `NivelFormPage` | Formulario de creación/edición con selección de documentos |
| `CampoAdicionalModal` | Modal para crear/editar campos adicionales con preview en tiempo real |
| `CampoPreview` | Vista previa del campo según su tipo configurado |

### 6.6 Flujo Funcional

```
Listado (/niveles)
  ├── [Buscar] → Filtrar por nombre
  ├── [+ Nuevo Nivel] → /niveles/nuevo
  │     ├── Nombre, duración (horas/días)
  │     ├── Seleccionar documentos requeridos (checklist)
  │     ├── Observaciones opcionales
  │     └── Guardar → Redirigir a listado
  ├── [Clic en fila] → /niveles/:id
  │     ├── Ver documentos requeridos
  │     ├── Gestionar campos adicionales
  │     │   ├── [+ Agregar campo] → Modal CampoAdicionalModal
  │     │   ├── [Editar campo] → Modal con datos prellenados
  │     │   └── [Eliminar campo] → Confirmación
  │     └── [Editar nivel] → /niveles/:id/editar
  └── [Eliminar] → Confirmación → Eliminar
```

---

## 7. Módulo de Gestión de Personal

### 7.1 Propósito

Centraliza la administración de perfiles de **staff interno** del centro de formación (entrenadores, supervisores, administrativos, instructores, etc.). Sustituye las listas estáticas previas del formulario de Cursos, permitiendo que los selectores de entrenador y supervisor consuman registros dinámicos filtrados por tipo de cargo.

### 7.2 Entidad: `Personal`

```typescript
interface Personal {
  id: string;
  nombres: string;
  apellidos: string;
  cargoId: string;
  cargoNombre: string;
  firmaBase64?: string;          // Firma digital en Base64 (PNG)
  adjuntos: AdjuntoPersonal[];   // Documentos adjuntos
  createdAt: string;
  updatedAt: string;
}
```

### 7.3 Entidad: `Cargo`

```typescript
interface Cargo {
  id: string;
  nombre: string;               // Único (validación case-insensitive)
  tipo: TipoCargo;
  createdAt: string;
  updatedAt: string;
}

type TipoCargo = 'entrenador' | 'supervisor' | 'administrativo' | 'instructor' | 'otro';
```

### 7.4 Entidad: `AdjuntoPersonal`

```typescript
interface AdjuntoPersonal {
  id: string;
  nombre: string;      // Nombre del archivo
  tipo: string;        // MIME type
  tamano: number;      // Tamaño en bytes
  fechaCarga: string;  // ISO datetime
  dataUrl?: string;    // Base64 data URL (almacenamiento mock)
}
```

### 7.5 Firma Digital

El componente `FirmaPersonal` ofrece dos modos de captura:

| Modo | Descripción |
|------|-------------|
| **Dibujar** | Canvas interactivo usando `react-signature-canvas`. Permite limpiar y guardar. |
| **Cargar PNG** | Subida de archivo de imagen (PNG, JPEG, WebP). Se recomienda PNG con fondo transparente. |

**Comportamiento:**
- Si ya existe firma: muestra la imagen con indicador "Firma registrada" y botón para eliminar.
- Si no existe: muestra las pestañas Dibujar / Cargar PNG.
- La firma es **opcional** tanto en la creación como en la edición del perfil.
- La firma centralizada es la fuente única para formatos de Matrículas (entrenador/supervisor).

### 7.6 Documentos Adjuntos

El componente `AdjuntosPersonal` permite gestionar documentos del personal (hoja de vida, contratos, certificaciones, etc.):

- **Carga**: Archivos de hasta 10MB. Lectura como DataURL para almacenamiento mock.
- **Previsualización inline**: Para imágenes y PDFs.
- **Descarga**: Botón de descarga individual.
- **Eliminación**: Con confirmación.
- Los adjuntos son **opcionales** y pueden cargarse durante la creación o posteriormente.

### 7.7 Operaciones y Reglas de Negocio

#### Personal

| Operación | Regla de Negocio |
|-----------|-----------------|
| **Crear** | Crea perfil con datos básicos. Opcionalmente acepta firma y adjuntos (se suben secuencialmente tras crear el registro). |
| **Editar** | Actualización parcial. Registra campos modificados en auditoría. |
| **Eliminar** | Registra auditoría antes de eliminar. |
| **Filtrar por tipo de cargo** | `getByTipoCargo(tipo)` filtra personal cuyos cargos correspondan al tipo solicitado. |
| **Actualizar firma** | `updateFirma(id, base64)` almacena la firma. Audita el cambio. |
| **Eliminar firma** | `deleteFirma(id)` pone `firmaBase64 = undefined`. Audita el cambio. |
| **Agregar adjunto** | `addAdjunto(personalId, file)` lee el archivo como DataURL y lo agrega al array. |
| **Eliminar adjunto** | `deleteAdjunto(personalId, adjuntoId)` remueve del array. |

#### Cargos

| Operación | Regla de Negocio |
|-----------|-----------------|
| **Crear** | Valida **unicidad del nombre** (case-insensitive). Lanza `ApiError` con código `CARGO_DUPLICADO`. |
| **Editar** | Valida unicidad del nombre excluyendo el registro actual. |
| **Eliminar** | **No se puede eliminar** si hay personal asignado al cargo. Lanza `ApiError` con código `CARGO_EN_USO`. |

### 7.8 Componentes

| Componente | Función |
|------------|---------|
| `GestionPersonalPage` | Tabla principal con búsqueda, columnas configurables, panel lateral y acciones por fila |
| `PersonalFormPage` | Formulario de creación/edición con secciones opcionales de firma y adjuntos |
| `PersonalDetallePage` | Vista de detalle en pantalla completa (3 columnas: datos, adjuntos, firma) |
| `PersonalDetailSheet` | Panel lateral con datos del perfil, adjuntos y firma (gestión en tiempo real) |
| `FirmaPersonal` | Componente de captura de firma (dibujo o carga de imagen) |
| `AdjuntosPersonal` | Gestión de documentos adjuntos con preview, descarga y eliminación |
| `GestionCargosModal` | Modal para CRUD de cargos accesible desde el formulario de personal |

### 7.9 Flujo Funcional

```
Listado (/gestion-personal)
  ├── [Buscar] → Filtrar por nombre o cargo
  ├── [+ Nuevo Perfil] → /gestion-personal/nuevo
  │     ├── Datos básicos (nombres, apellidos, cargo)
  │     ├── [Gestionar Cargos] → Modal GestionCargosModal
  │     ├── Documentos Adjuntos (opcional)
  │     ├── Firma Digital (opcional, dibujar o cargar)
  │     └── Guardar → Crear perfil → Subir firma y adjuntos → Redirigir
  ├── [Clic en fila] → Panel lateral (PersonalDetailSheet)
  │     ├── Ver datos del perfil
  │     ├── Gestionar adjuntos (agregar/eliminar en tiempo real)
  │     ├── Gestionar firma (capturar/eliminar en tiempo real)
  │     └── [Pantalla completa] → /gestion-personal/:id
  └── [Eliminar] → Confirmación → Eliminar perfil

Integración con Cursos:
  └── Formulario de Curso (/cursos/nuevo o /cursos/:id/editar)
      ├── Selector "Entrenador" → Consume personal filtrado por tipo 'entrenador'
      └── Selector "Supervisor" → Consume personal filtrado por tipo 'supervisor'
```

---

## 8. Portal Estudiante (Admin)

### 8.1 Propósito

Módulo administrativo accesible en `/portal-estudiante` que permite gestionar centralizadamente la configuración del portal público del estudiante. Comprende dos áreas funcionales: **Configuración** (catálogo de documentos y habilitación por nivel) y **Monitoreo** (seguimiento de progreso por matrícula).

### 8.2 Tipos y Entidades

```typescript
interface PortalDocumentoConfigAdmin extends DocumentoPortalConfig {
  habilitadoPorNivel: Record<TipoFormacion, boolean>;
}

interface PortalConfigGlobal {
  portalActivoPorDefecto: boolean;
  documentos: PortalDocumentoConfigAdmin[];
}
```

Tipos base del portal:

```typescript
type DocumentoPortalKey = 'info_aprendiz' | 'evaluacion' | string;
type EstadoDocPortal = 'bloqueado' | 'pendiente' | 'completado';
type TipoDocPortal = 'firma_autorizacion' | 'evaluacion' | 'formulario' | 'solo_lectura';

interface DocumentoPortalConfig {
  key: DocumentoPortalKey;
  nombre: string;
  tipo: TipoDocPortal;
  requiereFirma: boolean;
  dependeDe: DocumentoPortalKey[];
  orden: number;
}

interface DocumentoPortalEstado {
  key: DocumentoPortalKey;
  estado: EstadoDocPortal;
  enviadoEn?: string;
  firmaBase64?: string;
  firmaFecha?: string;
  puntaje?: number;
  respuestas?: unknown;
  metadata?: Record<string, unknown>;
  intentos?: DocumentoPortalEstado[];
}
```

### 8.3 Pestaña Configuración

#### Catálogo de Documentos

Tabla administrable con las siguientes funcionalidades:
- **CRUD de documentos**: Crear, editar y eliminar documentos del catálogo via `DocumentoConfigDialog`.
- **Ordenamiento drag-and-drop**: Los documentos pueden reordenarse arrastrándolos, lo que define el orden de aparición en el portal público.
- **Dependencias lógicas**: Cada documento puede configurarse para depender de otros documentos (el estudiante debe completar las dependencias antes de acceder).
- **Tipos de documento**: `firma_autorizacion`, `evaluacion`, `formulario`, `solo_lectura`.
- **Sincronización de formulario**: El dialog de configuración utiliza un `useEffect` para resetear los campos locales al abrir/cambiar entre documentos, evitando datos estancados.

#### Habilitación por Nivel de Formación

Grid que cruza documentos × niveles de formación (`TipoFormacion`). Permite activar/desactivar cada documento para cada nivel (reentrenamiento, jefe de área, trabajador autorizado, coordinador T.A.).

#### Toggle Global

Switch "Portal activo por defecto" que determina si las nuevas matrículas tendrán el portal habilitado automáticamente. **Protección**: desactivar requiere confirmación via `ConfirmDialog` para prevenir deshabilitaciones accidentales.

### 8.4 Pestaña Monitoreo

Vista de tabla que muestra el estado de progreso de cada matrícula en el portal.

#### Resumen estadístico

Tres chips sobre la tabla:
- **Total matrículas**: Conteo general.
- **Todo completo**: Matrículas con todos los documentos completados.
- **Con pendientes**: Matrículas con al menos un documento pendiente.

#### Tabla de monitoreo

| Columna | Descripción |
|---------|-------------|
| Estudiante | Nombre + cédula |
| Curso | Número de curso |
| Nivel | Tipo de formación |
| Progreso | Barra `<Progress>` + ratio `completados/total` |
| Documentos (dinámicas) | Badge por documento: Completado (verde), Pendiente (ámbar), Bloqueado (gris) |
| Acceso | Badge Activo/Inactivo |

**Filtros**: Búsqueda por nombre/cédula/curso, filtro por curso, nivel de formación, y documento pendiente.

**Contador de resultados**: Texto "Mostrando X matrículas" bajo los filtros.

#### Dialog de detalle (`MonitoreoDetalleDialog`)

Al hacer clic en una fila, se abre un dialog con:
- Datos del estudiante y curso.
- Switch para habilitar/deshabilitar el portal de esa matrícula.
- Lista de documentos con estado, fecha de envío, puntaje (si aplica) y firma (si capturada).
- Botón "Reabrir" para documentos completados (con confirmación).
- **Refresco en tiempo real**: Tras mutaciones (toggle portal, reabrir documento), se invoca `onDataChange` que ejecuta `refetch()` y actualiza la fila seleccionada con datos frescos.

### 8.5 Componentes

| Componente | Función |
|------------|---------|
| `PortalAdminPage` | Página principal con tabs Configuración/Monitoreo y toggle global con confirmación |
| `DocumentosCatalogoTable` | Tabla de catálogo con drag-and-drop |
| `DocumentoConfigDialog` | Dialog de creación/edición de documentos con useEffect de sincronización |
| `NivelesHabilitacionGrid` | Grid documentos × niveles con toggles |
| `MonitoreoTable` | Tabla de monitoreo con chips de resumen, progreso y filtros |
| `MonitoreoDetalleDialog` | Dialog de detalle con mutaciones y refresco en tiempo real |

### 8.6 Datos del Catálogo (`portalAdminConfig.ts`)

Array mutable `portalDocumentosCatalogo` con los documentos preconfigurados:

| Key | Nombre | Tipo | Depende de |
|-----|--------|------|------------|
| `info_aprendiz` | Información del Aprendiz | `firma_autorizacion` | — |
| `evaluacion` | Evaluación y Encuesta | `evaluacion` | `info_aprendiz` |

Variable `portalActivoPorDefecto` controla el estado global del portal.

---

## 9. Portal Estudiante (Público)

### 9.1 Propósito

Interfaz pública mobile-first accesible en `/estudiante` que permite a los estudiantes completar documentos de su proceso de formación (firmas, evaluaciones, formularios) desde cualquier dispositivo.

### 9.2 Flujo de Acceso

```
/estudiante (AccesoEstudiantePage)
  └── Ingresar número de cédula
      └── Buscar matrícula vigente
          ├── Reglas de resolución:
          │   ├── Curso no cerrado
          │   ├── Fecha actual ≤ fecha de fin del curso
          │   └── Prioridad: curso con fecha de inicio más reciente
          ├── [Encontrada] → Crear sesión → Redirigir a /estudiante/inicio
          └── [No encontrada] → Mensaje de error
```

### 9.3 Sesión del Portal (`PortalEstudianteContext`)

Contexto React persistido en `localStorage` que almacena:

```typescript
interface PortalSession {
  matriculaId: string;
  personaId: string;
  cedula: string;
  nombreEstudiante: string;
  cursoNombre: string;
  cursoFechaInicio?: string;
  cursoFechaFin?: string;
}
```

**Operaciones**: `setSession()` (guarda en localStorage), `clearSession()` (limpia localStorage), acceso via hook `usePortalEstudianteSession()`.

**Protección de rutas**: `PortalGuard` verifica existencia de sesión antes de renderizar rutas internas. Redirige a `/estudiante` si no hay sesión activa.

### 9.4 Panel de Documentos (`PanelDocumentosPage`)

Dashboard del estudiante que muestra:
- **Header**: Nombre, cédula y botón "Salir".
- **Info del curso**: Nombre y fechas.
- **Barra de progreso**: Porcentaje y conteo de documentos completados.
- **Mensaje de finalización**: Card con ícono de celebración cuando todos los documentos están completos.
- **Lista de documentos**: Cards clickeables con:
  - Ícono según tipo de documento.
  - Badge de estado (Bloqueado/Pendiente/Completado).
  - Dependencias: texto "Completa primero: [nombre]" para documentos bloqueados.
  - Fecha de envío para documentos completados.

### 9.5 Despacho Genérico de Documentos (`DocumentoRendererPage`)

Ruta única `/estudiante/documentos/:documentoKey` que actúa como orquestador central:

1. Extrae `documentoKey` de la URL.
2. Consulta la config del documento via `useDocumentosPortal`.
3. Identifica el `TipoDocPortal` en el catálogo.
4. Despacha al componente especializado usando un registro de renderers:

```typescript
const RENDERERS: Record<TipoDocPortal, React.ComponentType> = {
  firma_autorizacion: InfoAprendizPage,
  evaluacion: EvaluacionPage,
  formulario: FormularioPlaceholder,
  solo_lectura: SoloLecturaPlaceholder,
};
```

**Manejo de estados**:
- Documento bloqueado → Redirige a `/estudiante/inicio`.
- Documento no encontrado → Mensaje de error con key.
- Cargando → Skeleton.

**Escalabilidad**: Agregar un nuevo documento solo requiere (1) crearlo en el catálogo admin y (2) opcionalmente registrar un renderer si es un tipo nuevo.

### 9.6 Tipos de Documento y Renderers

| Tipo | Renderer | Descripción |
|------|----------|-------------|
| `firma_autorizacion` | `InfoAprendizPage` | Muestra datos del aprendiz y captura firma de autorización |
| `evaluacion` | `EvaluacionPage` | Cuestionario dinámico con preguntas del formato de formación |
| `formulario` | Placeholder | Formulario en construcción (extensible) |
| `solo_lectura` | Placeholder | Documento de solo lectura (extensible) |

### 9.7 Subsistema de Evaluación

El `EvaluacionPage` consume un formato de formación con bloques `evaluation_quiz`:
- Las preguntas se cargan dinámicamente del formato asociado al tipo de curso.
- Los resultados se almacenan en `portalEstudiante.documentos[evaluacion]` con puntaje, respuestas y metadata.
- Si el estudiante no aprueba, el documento queda en estado `pendiente` y se acumulan los intentos previos.
- El umbral de aprobación depende del formato (configurable).

### 9.8 Subsistema de Inicialización (`portalInitService`)

Función `initPortalEstudiante(matricula, curso)` que inicializa la estructura `portalEstudiante` en una matrícula si no existe (compatibilidad con datos legacy):
- Crea `{ habilitado: portalActivoPorDefecto, documentos: [] }`.
- Se invoca automáticamente al resolver la matrícula vigente.

---

## 10. Módulo de Certificación

### 10.1 Propósito

Módulo completo para la gestión del ciclo de certificación de estudiantes. Abarca la configuración de plantillas SVG, la definición de tipos de certificado con reglas de validación, la generación individual y masiva de certificados, y el manejo de excepciones para casos bloqueados.

### 10.2 Entidades

#### `PlantillaCertificado`

```typescript
interface PlantillaCertificado {
  id: string;
  nombre: string;
  svgRaw: string;                    // SVG completo con tokens {{placeholder}}
  tokensDetectados: string[];        // Tokens extraídos automáticamente del SVG
  activa: boolean;
  version: number;
  historial: PlantillaVersion[];     // Historial de versiones del SVG
  createdAt: string;
  updatedAt: string;
}

interface PlantillaVersion {
  version: number;
  svgRaw: string;
  fecha: string;
  modificadoPor: string;
}
```

#### `TipoCertificado`

Configuración que define las **reglas de emisión** para cada clase de certificado:

```typescript
interface TipoCertificado {
  id: string;
  nombre: string;
  tipoFormacion: TipoFormacion;      // jefe_area, trabajador_autorizado, reentrenamiento, coordinador_ta
  plantillaId: string;               // Plantilla SVG vinculada
  reglas: ReglaTipoCertificado;      // Reglas de validación
  reglaCodigo: string;               // Patrón para código único
  createdAt: string;
  updatedAt: string;
}

interface ReglaTipoCertificado {
  requierePago: boolean;
  requiereDocumentos: boolean;
  requiereFormatos: boolean;
  incluyeEmpresa: boolean;
  incluyeFirmas: boolean;
}
```

#### `CertificadoGenerado`

```typescript
interface CertificadoGenerado {
  id: string;
  matriculaId: string;
  cursoId: string;
  personaId: string;
  plantillaId: string;
  tipoCertificadoId: string;
  codigo: string;
  estado: 'elegible' | 'generado' | 'bloqueado' | 'revocado';
  snapshotDatos: Record<string, unknown>;
  svgFinal: string;
  version: number;
  fechaGeneracion: string;
  revocadoPor?: string;
  motivoRevocacion?: string;
  fechaRevocacion?: string;
  autorizadoExcepcional?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### `SolicitudExcepcionCertificado`

```typescript
interface SolicitudExcepcionCertificado {
  id: string;
  matriculaId: string;
  solicitadoPor: string;
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  resueltoPor?: string;
  fechaSolicitud: string;
  fechaResolucion?: string;
}
```

### 10.3 Plantillas SVG y Mapeo de Etiquetas

El sistema emplea un modelo de **Mapeo de Etiquetas** para personalizar certificados:

1. **Carga de SVG**: El administrador sube un archivo SVG con tokens `{{placeholder}}`.
2. **Detección automática**: `plantillaService.detectarTokens()` extrae todos los tokens `{{...}}` del SVG.
3. **Mapeo visual**: En `PlantillaEditorPage`, los elementos `<text>` con atributo `id` se vinculan a campos del sistema.
4. **Versionado**: Cada modificación incrementa la versión y almacena el SVG anterior en `historial`.
5. **Rollback**: Permite restaurar versiones anteriores via `plantillaService.rollback()`.

**Tokens predefinidos en la plantilla estándar:**
- `nombreCompleto`, `tipoDocumento`, `numeroDocumento`
- `tipoFormacion`, `numeroCurso`, `duracionDias`, `horasTotales`
- `fechaInicio`, `fechaFin`
- `empresaNombre`, `empresaNit`, `empresaCargo`
- `entrenadorNombre`, `supervisorNombre`
- `codigoCertificado`, `fechaGeneracion`

### 10.4 Tipos de Certificado — Gestión Integrada

La gestión de Tipos de Certificado está **integrada en la página de Plantillas** (`PlantillasPage`) como pestaña independiente, eliminando la necesidad de una página separada.

**Funcionalidades de la pestaña "Tipos de Certificado":**
- **Tabla** con columnas: Nombre, Tipo de Formación, Pago, Docs, Formatos, Regla Código, Acciones.
- **Crear nuevo tipo**: Dialog con campos para nombre, tipo de formación, plantilla vinculada, regla de código, y 5 switches de validación.
- **Editar tipo existente**: Mismo dialog con datos precargados.
- **Eliminar tipo**: Con diálogo de confirmación destructivo.

**Reglas de validación (switches):**

| Regla | Descripción |
|-------|-------------|
| `requierePago` | Requiere pago completo antes de emitir |
| `requiereDocumentos` | Requiere documentos completos |
| `requiereFormatos` | Requiere formatos firmados |
| `incluyeEmpresa` | Incluye datos de empresa en el certificado |
| `incluyeFirmas` | Incluye firmas del entrenador/supervisor |

### 10.5 Ciclo de Certificación

```
1. ELEGIBILIDAD
   └── Validar requisitos según TipoCertificado.reglas:
       ├── Pago completo (si requierePago)
       ├── Documentos completos (si requiereDocumentos)
       └── Formatos firmados (si requiereFormatos)

2. GENERACIÓN
   ├── Individual: Desde matrícula
   └── Masiva: Desde curso
       ├── Reemplazar tokens en SVG
       ├── Generar código único según reglaCodigo
       ├── Snapshot de datos al momento
       └── Estado: "generado"

3. BLOQUEO → EXCEPCIÓN
   └── Matrícula no cumple requisitos
       ├── Solicitar excepción (editor)
       ├── Aprobar excepción (admin) → Genera con autorizadoExcepcional=true
       └── Rechazar excepción

4. REVOCACIÓN / REEMISIÓN
   └── Certificado emitido puede revocarse y reemitirse con nueva versión
```

### 10.6 Componentes

| Componente | Función |
|------------|---------|
| `PlantillasPage` | Página principal con tabs: Plantillas SVG y Tipos de Certificado. CRUD completo de ambas entidades. |
| `PlantillaEditorPage` | Editor de mapeo de etiquetas SVG |
| `PlantillaVersionHistory` | Historial de versiones con rollback |
| `PlantillaTestDialog` | Dialog para probar plantilla con datos de prueba |
| `HistorialCertificadosPage` | Tabla de certificados generados |

### 10.7 Navegación

Menú **desplegable (Collapsible)** en el sidebar con dos subentradas:
- **Historial**: `/certificacion/historial`
- **Plantillas**: `/certificacion/plantillas` (incluye gestión de Tipos de Certificado)

---

## 11. Módulo de Cartera

### 11.1 Objetivo

El módulo de **Cartera** gestiona los procesos de facturación, seguimiento de pagos y control de saldos derivados de las matrículas. Permite consolidar múltiples matrículas bajo un mismo responsable de pago, gestionar facturación agrupada o individual, registrar pagos y abonos con soportes, y mantener trazabilidad del estado financiero.

### 11.2 Entidades

#### ResponsablePago

Representa la entidad o persona responsable del pago.

```typescript
interface ResponsablePago {
  id: string;
  tipo: 'empresa' | 'independiente' | 'arl';
  nombre: string;
  nit: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
  direccionFacturacion?: string;
  observaciones?: string;
}
```

#### GrupoCartera

Agrupa matrículas que comparten el mismo responsable de pago.

```typescript
interface GrupoCartera {
  id: string;
  responsablePagoId: string;           // FK → ResponsablePago
  estado: 'pendiente' | 'facturado' | 'abonado' | 'pagado' | 'vencido';
  totalValor: number;
  totalAbonos: number;
  saldo: number;
  matriculaIds: string[];
  observaciones?: string;
  createdAt: string;
}
```

**Recálculo automático de estado:**
- `pagado`: saldo ≤ 0
- `vencido`: alguna factura no pagada con `fechaVencimiento` pasada
- `abonado`: tiene pagos pero saldo > 0
- `facturado`: tiene facturas pero sin pagos
- `pendiente`: sin facturas

#### Factura

```typescript
interface Factura {
  id: string;
  grupoCarteraId: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaVencimiento: string;
  subtotal: number;
  total: number;
  estado: 'pendiente' | 'parcial' | 'pagada';
  archivoFactura?: string;
  matriculaIds: string[];
}
```

#### RegistroPago

```typescript
interface RegistroPago {
  id: string;
  facturaId: string;
  fechaPago: string;
  valorPago: number;
  metodoPago: 'transferencia' | 'efectivo' | 'consignacion' | 'tarjeta';
  soportePago?: string;
  observaciones?: string;
}
```

#### ActividadCartera

Registro de seguimiento (llamadas, promesas de pago, eventos del sistema).

```typescript
interface ActividadCartera {
  id: string;
  grupoCarteraId: string;
  tipo: 'llamada' | 'promesa_pago' | 'comentario' | 'sistema';
  descripcion: string;
  fecha: string;
  usuario?: string;
}
```

### 11.3 Operaciones del Servicio (`carteraService`)

| Operación | Descripción |
|-----------|-------------|
| `getGrupos()` | Lista todos los grupos con recálculo de estados |
| `getGrupoById(id)` | Grupo individual con recálculo |
| `getResponsables()` | Lista todos los responsables de pago |
| `getResponsableById(id)` | Responsable individual |
| `createResponsable(data)` | Crea responsable de pago |
| `getFacturasByGrupo(grupoId)` | Facturas de un grupo |
| `createFactura(data)` | Crea factura, recalcula grupo, registra actividad automática |
| `updateFactura(id, data)` | Actualiza factura, recalcula saldos, registra actividad |
| `getPagosByGrupo(grupoId)` | Pagos asociados a facturas del grupo |
| `registrarPago(data)` | Registra pago, recalcula factura y grupo, registra actividad automática |
| `updatePago(id, data)` | Actualiza pago, recalcula saldos, registra actividad |
| `getActividadesByGrupo(grupoId)` | Historial de actividades ordenado por fecha desc |
| `registrarActividad(data)` | Registra actividad manual (llamada, promesa, comentario) |

### 11.4 Componentes

| Componente | Función |
|------------|---------|
| `CarteraPage` | Bandeja principal con tabla de grupos, búsqueda, filtros por tipo y estado, icono de alerta para vencidos |
| `GrupoCarteraDetallePage` | Vista detalle: info de contacto, resumen financiero, matrículas asociadas, facturación, pagos, seguimiento |
| `CrearFacturaDialog` | Dialog para crear factura con selección de matrículas y cálculo automático de subtotal |
| `EditarFacturaDialog` | Dialog pre-poblado para editar factura existente (número, fechas, total) |
| `RegistrarPagoDialog` | Dialog para registrar pago con selección de factura, método de pago y soporte |
| `EditarPagoDialog` | Dialog pre-poblado para editar pago existente (valor, fecha, método, observaciones) |
| `ActividadCarteraSection` | Timeline de actividades con iconos por tipo y formulario inline para agregar actividades manuales |

### 11.5 Alertas de Vencimiento

- **Bandeja**: Icono `AlertTriangle` en filas con estado `vencido`.
- **Detalle**: Banner `Alert` destructivo cuando hay facturas vencidas, indicando cantidad y saldo pendiente.
- **Filas de factura**: Fondo rojo sutil (`bg-red-50/50`) y fecha de vencimiento en color destructivo.
- **StatusBadge**: Variante destructiva para el estado `vencido`.

### 11.6 Edición Inline

Las tablas de facturación y pagos en la vista de detalle permiten edición directa: al hacer clic en una fila se abre un dialog de edición pre-poblado. Los cambios recalculan automáticamente los saldos de factura y grupo, y registran una actividad de sistema.

### 11.7 Flujo Operativo

```
1. Matrícula creada → Asignada a grupo de cartera por responsable
2. Grupo visible en bandeja → Clic navega a detalle
3. Crear factura → Seleccionar matrículas → Total auto-calculado
4. Registrar pago → Seleccionar factura → Recálculo automático de saldos
5. Seguimiento → Registrar llamadas, promesas de pago, comentarios
6. Detección automática de vencimiento → Alertas visuales
```

### 11.8 Navegación

Entrada directa en sidebar: **Cartera** (`/cartera`). Detalle por grupo: `/cartera/:id`.

---

## 12. Dashboard

### 12.1 Métricas Globales

| Métrica | Cálculo |
|---------|---------|
| **Total Personas** | `personas.length` |
| **Total Matrículas** | `matriculas.length` + pendientes (`estado === 'pendiente' \|\| 'creada'`) |
| **Total Cursos** | `cursos.length` + activos (`estado === 'abierto' \|\| 'en_progreso'`) |
| **Tasa de Certificación** | `(certificadas + completas) / total * 100` |

### 11.2 Secciones

- **Tarjetas de estadísticas**: 4 cards clickeables que navegan al módulo correspondiente.
- **Acciones rápidas**: Botones para crear persona, matrícula o curso.
- **Matrículas recientes**: Últimas 5 matrículas con tipo de formación y badge de estado.

---

## 13. Componentes Compartidos

### 13.1 DataTable

Tabla genérica reutilizable con:
- **Ordenamiento interactivo**: Por defecto ordena por `createdAt` descendente. Props `defaultSortKey` y `defaultSortDirection` permiten personalizar el criterio inicial.
- Columnas con `sortable: true` muestran iconos de dirección: `ArrowUpDown` (inactiva), `ArrowUp` (ascendente), `ArrowDown` (descendente).
- Click en header alterna la dirección de ordenamiento; click en otra columna cambia el criterio.
- Interfaz `Column<T>` ampliada con `sortable?: boolean`, `sortKey?: string` (campo de datos real) y `sortValue?: (item: T) => string | number` (extractor personalizado).
- Selección múltiple con checkboxes
- Acciones por fila (`RowActions`)
- Acciones en lote (`BulkActionsBar`)
- Columnas configurables (`ColumnSelector`)
- Toolbar con búsqueda y filtros (`TableToolbar`)

### 13.2 DetailSheet

Panel lateral deslizable (Sheet de Radix UI) con:
- Título y subtítulo
- Navegación entre registros (anterior/siguiente)
- Contador de posición ("3 de 15 matrículas")
- Botón de pantalla completa
- Footer configurable (para botones de guardar/cancelar)
- **Detección de portales**: El handler de clic externo (`handleClickOutside`) detecta portales abiertos de Radix (poppers, selects, menús, **dialogs**) para evitar cierres accidentales del panel al interactuar con modales o dropdowns superpuestos.

### 13.3 EditableField

Campo editable inline que soporta:
- **Tipos**: `text`, `select`, `date`
- **Modo vista**: Muestra valor formateado con icono opcional
- **Modo edición**: Input/Select/DatePicker según tipo
- **Badge mode**: Muestra valor como Badge
- **Opciones**: Array de `{ value, label }` para selects

### 13.4 ComentariosSection

Sistema de comentarios con:
- Historial cronológico (más recientes primero)
- Crear, editar y eliminar comentarios
- Soporte para múltiples secciones (`cartera`, `observaciones`)
- Vinculación por `matriculaId` + `seccion`
- Registro de usuario y timestamp
- Indicador de "editado" con fecha

### 13.5 Otros Componentes Compartidos

| Componente | Descripción |
|------------|-------------|
| `SearchInput` | Input de búsqueda con icono y debounce |
| `FilterPopover` | Popover con opciones de filtro |
| `ColumnSelector` | Selector de columnas visibles. Acepta prop opcional `defaultColumns` para habilitar el botón "Restablecer" que restaura la visibilidad por defecto. Footer con tres acciones: Mostrar todas / Restablecer / Ocultar todas. |
| `StatusBadge` | Badge de estado con colores semánticos |
| `ConfirmDialog` | Diálogo de confirmación para acciones destructivas |
| `BulkActionsBar` | Barra flotante de acciones masivas |
| `CopyableCell` | Celda con botón de copiar al portapapeles |
| `DocumentHeader` | Encabezado estándar para documentos PDF |

---

## 14. Capa de Servicios y Datos

### 14.1 Servicios

#### `api.ts` — Utilidades Base

```typescript
delay(ms)           // Promise que resuelve después de ms + random(0-500ms)
simulateApiCall(data, ms)  // Envuelve datos con delay
ApiError             // Error con statusCode y code (ej: 404, 'NOT_FOUND')
```

#### `personaService.ts`

| Método | Parámetros | Retorno | Validación |
|--------|-----------|---------|------------|
| `getAll()` | — | `Persona[]` | — |
| `getById(id)` | `string` | `Persona \| null` | — |
| `getByDocumento(doc)` | `string` | `Persona \| null` | — |
| `search(query)` | `string` | `Persona[]` | Busca en documento, nombres, apellidos, email |
| `create(data)` | `PersonaFormData` | `Persona` | Unicidad de documento |
| `update(id, data)` | `string, Partial` | `Persona` | Existencia |
| `delete(id)` | `string` | `void` | Existencia |

#### `matriculaService.ts`

| Método | Descripción | Validación |
|--------|-------------|------------|
| `getAll()` | Todas las matrículas | — |
| `getById(id)` | Matrícula por ID | — |
| `getByPersonaId(id)` | Matrículas de una persona | — |
| `getByCursoId(id)` | Matrículas de un curso | — |
| `getByEstado(estado)` | Filtrar por estado | — |
| `getHistorialByPersona(id)` | Matrícula previa más reciente (completa/certificada/cerrada) | — |
| `create(data)` | Crear matrícula | Curso válido, no cerrado, capacidad, no duplicada |
| `update(id, data)` | Actualización parcial | Existencia |
| `updateDocumento(mId, dId, data)` | Actualizar documento específico | Existencia de ambos |
| `capturarFirma(id, base64)` | Guardar firma digital | Existencia |
| `registrarPago(id, datos)` | Registrar pago con cálculo de saldo | Existencia |
| `cambiarEstado(id, estado)` | Cambiar estado | Existencia |
| `delete(id)` | Eliminar y desvincular del curso | Existencia |

#### `cursoService.ts`

| Método | Descripción | Validación |
|--------|-------------|------------|
| `getAll()` | Todos los cursos | — |
| `getById(id)` | Curso por ID | — |
| `getByEstado(estado)` | Filtrar por estado | — |
| `search(query)` | Buscar por nombre o entrenador | — |
| `create(data)` | Crear curso | — |
| `update(id, data)` | Actualización parcial | Existencia |
| `cambiarEstado(id, estado)` | Cambiar estado | No cerrar con matrículas pendientes |
| `getEstadisticas(id)` | Totales de matrículas | — |
| `delete(id)` | Eliminar | No eliminar con matrículas |
| `agregarEstudiantes(cId, mIds)` | Agregar matrículas al curso | Existencia, filtra duplicados |
| `removerEstudiante(cId, mId)` | Remover matrícula del curso | Existencia |

#### `nivelFormacionService.ts`

| Método | Descripción | Validación |
|--------|-------------|------------|
| `getAll()` | Todos los niveles de formación | — |
| `getById(id)` | Nivel por ID | — |
| `search(query)` | Buscar por nombre del nivel | — |
| `create(data)` | Crear nivel | Auditoría |
| `update(id, data)` | Actualización parcial | Existencia, auditoría |
| `delete(id)` | Eliminar nivel | Existencia, auditoría |
| `addCampoAdicional(nId, campo)` | Agregar campo adicional al nivel | Existencia del nivel |
| `updateCampoAdicional(nId, cId, data)` | Editar campo adicional | Existencia de ambos |
| `deleteCampoAdicional(nId, cId)` | Eliminar campo adicional | Existencia de ambos |

#### `personalService.ts`

| Método | Descripción | Validación |
|--------|-------------|------------|
| `getAll()` | Todo el personal | — |
| `getById(id)` | Personal por ID | — |
| `getByTipoCargo(tipo)` | Personal filtrado por tipo de cargo | — |
| `create(data)` | Crear perfil de personal | Auditoría |
| `update(id, data)` | Actualización parcial | Existencia, auditoría |
| `delete(id)` | Eliminar perfil | Existencia, auditoría |
| `updateFirma(id, base64)` | Guardar firma digital del personal | Existencia, auditoría |
| `deleteFirma(id)` | Eliminar firma digital | Existencia, auditoría |
| `addAdjunto(personalId, file)` | Agregar documento adjunto (lectura como DataURL) | Existencia, auditoría |
| `deleteAdjunto(personalId, adjuntoId)` | Eliminar documento adjunto | Existencia de ambos, auditoría |
| `getAllCargos()` | Todos los cargos | — |
| `createCargo(data)` | Crear cargo | Unicidad de nombre |
| `updateCargo(id, data)` | Editar cargo | Existencia, unicidad de nombre |
| `deleteCargo(id)` | Eliminar cargo | No eliminar si tiene personal asignado (`CARGO_EN_USO`) |

#### `comentarioService.ts`

| Método | Descripción |
|--------|-------------|
| `getByMatriculaSeccion(mId, seccion)` | Comentarios de una matrícula y sección, ordenados por fecha descendente |
| `create(data)` | Crear comentario con timestamp automático |
| `update(id, texto)` | Editar texto, marcar `editadoEn` |
| `delete(id)` | Eliminar comentario |

#### `documentoService.ts`

| Función | Descripción |
|---------|-------------|
| `getDocumentosRequeridos(nivel, tipo)` | Genera lista dinámica de documentos según nivel de formación |

#### `driveService.ts`

| Método | Descripción |
|--------|-------------|
| `uploadDocumento(mId, tipo, file, meta)` | Simula subida individual a Google Drive. Retorna URL ficticia. |
| `uploadConsolidado(mId, file, tipos, meta)` | Simula subida de PDF consolidado. Retorna URL + tipos incluidos. |

### 14.2 Servicios del Portal

#### `portalAdminService.ts`

| Método | Descripción |
|--------|-------------|
| `getConfigGlobal()` | Retorna configuración global (toggle + documentos ordenados) |
| `saveDocumentoConfig(doc)` | Crear o actualizar documento en el catálogo |
| `deleteDocumentoConfig(key)` | Eliminar documento y limpiar dependencias |
| `togglePortalGlobal(activo)` | Activar/desactivar portal por defecto |
| `updateOrdenDocumentos(keys)` | Reordenar documentos según array de keys |
| `updateDependencias(key, dependeDe)` | Actualizar dependencias de un documento |
| `updateHabilitacionNivel(key, nivel, activo)` | Toggle de habilitación por nivel |

#### `portalEstudianteService.ts`

| Método | Descripción |
|--------|-------------|
| `buscarMatriculaVigente(cedula)` | Busca matrícula vigente para una cédula (curso no cerrado, fecha vigente, prioriza más reciente) |
| `getPortalConfig(tipoFormacion?)` | Retorna documentos del catálogo filtrados por nivel |
| `getDocumentosEstado(matriculaId)` | Config + estados con resolución de dependencias |
| `enviarDocumento(matriculaId, key, payload)` | Guarda resultado de un documento (firma, evaluación, etc.) con acumulación de intentos |
| `getInfoAprendizData(matriculaId)` | Datos de persona, matrícula y curso para el formato InfoAprendiz |
| `getEvaluacionFormato(matriculaId)` | Formato de evaluación con bloques quiz para el tipo de curso |

#### `portalMatriculaService.ts`

| Función | Descripción |
|---------|-------------|
| `togglePortalMatricula(matriculaId, habilitado)` | Habilitar/deshabilitar portal para una matrícula |
| `resetDocumentoMatricula(matriculaId, documentoKey)` | Reabrir un documento completado (reset a pendiente) |

#### `portalMonitoreoService.ts`

| Función | Descripción |
|---------|-------------|
| `getMonitoreoData(filtros?)` | Lista de monitoreo con estados por matrícula. Filtros: búsqueda, curso, nivel, documento pendiente |
| `getFilterOptions()` | Opciones de filtro dinámicas (cursos, niveles, documentos) |

#### `portalInitService.ts`

| Función | Descripción |
|---------|-------------|
| `initPortalEstudiante(matricula, curso)` | Inicializa `portalEstudiante` en matrícula si no existe (compatibilidad legacy) |

### 14.3 Servicios de Certificación

#### `certificadoService.ts`

| Método | Descripción |
|--------|-------------|
| `getAll()` | Todos los certificados generados |
| `getById(id)` | Certificado por ID |
| `getByMatricula(matriculaId)` | Certificados de una matrícula |
| `getByCurso(cursoId)` | Certificados de un curso |
| `create(data)` | Crear certificado |
| `generar(params)` | Generar certificado con SVG final, snapshot y código. Estado inicial: `generado` |
| `revocar(id, revocadoPor, motivo)` | Revocar certificado con registro de motivo |
| `reemitir(params)` | Reemitir: revoca anterior y crea nueva versión incrementada |

#### `plantillaService.ts`

| Método | Descripción |
|--------|-------------|
| `getAll()` | Todas las plantillas |
| `getById(id)` | Plantilla por ID |
| `getActiva()` | Plantilla activa |
| `create(data)` | Crear plantilla con detección automática de tokens |
| `update(id, data)` | Actualizar plantilla. Si cambia el SVG: re-detecta tokens, incrementa versión, agrega al historial |
| `rollback(id, version)` | Restaurar SVG de una versión anterior (crea nueva versión) |
| `detectarTokens(svg)` | Extrae tokens `{{...}}` únicos del SVG |

#### `tipoCertificadoService.ts`

| Método | Descripción |
|--------|-------------|
| `getAll()` | Todos los tipos de certificado |
| `getById(id)` | Tipo por ID |
| `getByTipoFormacion(tipo)` | Tipos filtrados por tipo de formación |
| `create(data)` | Crear tipo de certificado |
| `update(id, data)` | Actualizar tipo de certificado |
| `delete(id)` | Eliminar tipo de certificado |

#### `excepcionCertificadoService.ts`

| Método | Descripción |
|--------|-------------|
| `getAll()` | Todas las excepciones |
| `getById(id)` | Excepción por ID |
| `getByMatricula(matriculaId)` | Excepciones de una matrícula |
| `solicitar(matriculaId, solicitadoPor, motivo)` | Crear solicitud de excepción (estado: `pendiente`) |
| `aprobar(id, resueltoPor)` | Aprobar excepción |
| `rechazar(id, resueltoPor)` | Rechazar excepción |

### 14.4 Servicio de Cartera (`carteraService.ts`)

| Método | Descripción |
|--------|-------------|
| `getGrupos()` | Lista grupos con recálculo de estados |
| `getGrupoById(id)` | Grupo individual con recálculo |
| `getResponsables()` | Lista responsables de pago |
| `getResponsableById(id)` | Responsable individual |
| `createResponsable(data)` | Crea responsable |
| `getFacturasByGrupo(grupoId)` | Facturas de un grupo |
| `createFactura(data)` | Crea factura + actividad sistema |
| `updateFactura(id, data)` | Actualiza factura + recálculo + actividad |
| `getPagosByGrupo(grupoId)` | Pagos del grupo |
| `registrarPago(data)` | Registra pago + recálculo + actividad |
| `updatePago(id, data)` | Actualiza pago + recálculo + actividad |
| `getActividadesByGrupo(grupoId)` | Historial de actividades |
| `registrarActividad(data)` | Registra actividad manual |

### 14.5 Datos Mock

#### `mockData.ts` — Arrays mutables principales:

| Array | Contenido Inicial |
|-------|-------------------|
| `mockPersonas` | 4 personas con datos completos |
| `mockCursos` | 7 cursos en distintos estados |
| `mockMatriculas` | 4 matrículas con distintos niveles de completitud |
| `mockNivelesFormacion` | Niveles de formación precargados |
| `mockPersonalStaff` | Perfiles de personal con adjuntos inicializados |
| `mockCargos` | Cargos precargados (Entrenador, Supervisor, etc.) |
| `mockComentarios` | 3 comentarios de ejemplo en 2 secciones |
| `mockAuditLogs` | Logs iniciales de ejemplo |

#### `mockCertificados.ts` — Arrays de certificación:

| Array | Contenido Inicial |
|-------|-------------------|
| `mockPlantillas` | 1 plantilla estándar CEFIH con SVG y 16 tokens predefinidos |
| `mockTiposCertificado` | Array vacío (se crean desde la UI) |
| `mockCertificados` | Array vacío (se generan en ejecución) |
| `mockExcepcionesCertificado` | Array vacío |

---

## 15. Hooks (React Query)

### 15.1 Hooks de Personas (`usePersonas.ts`)

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `usePersonas()` | Query | `['personas']` | Todas las personas |
| `usePersona(id)` | Query | `['persona', id]` | Persona por ID |
| `usePersonaByDocumento(doc)` | Query | `['persona', 'documento', doc]` | Buscar por documento (6+ chars) |
| `useSearchPersonas(query)` | Query | `['personas', 'search', query]` | Buscar personas (2+ chars) |
| `useCreatePersona()` | Mutation | Invalida `['personas']` | Crear persona |
| `useUpdatePersona()` | Mutation | Invalida `['personas']`, `['persona', id]` | Actualizar persona |
| `useDeletePersona()` | Mutation | Invalida `['personas']` | Eliminar persona |

### 15.2 Hooks de Matrículas (`useMatriculas.ts`)

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `useMatriculas()` | Query | `['matriculas']` | Todas las matrículas |
| `useMatricula(id)` | Query | `['matricula', id]` | Matrícula por ID |
| `useMatriculasByPersona(pId)` | Query | `['matriculas', 'persona', pId]` | Matrículas de una persona |
| `useMatriculasByCurso(cId)` | Query | `['matriculas', 'curso', cId]` | Matrículas de un curso |
| `useMatriculasByEstado(estado)` | Query | `['matriculas', 'estado', estado]` | Filtrar por estado |
| `useHistorialByPersona(pId)` | Query | `['matriculas', 'historial', pId]` | Matrícula previa más reciente |
| `useCreateMatricula()` | Mutation | Invalida matrículas + cursos | Crear matrícula |
| `useUpdateMatricula()` | Mutation | Invalida matrículas + matrícula específica | Actualizar matrícula |
| `useUpdateDocumento()` | Mutation | Invalida matrícula + matrículas | Actualizar documento |
| `useCapturarFirma()` | Mutation | Invalida matrícula + matrículas | Capturar firma |
| `useRegistrarPago()` | Mutation | Invalida matrícula + matrículas | Registrar pago |
| `useCambiarEstadoMatricula()` | Mutation | Invalida matrícula + matrículas | Cambiar estado |
| `useDeleteMatricula()` | Mutation | Invalida matrículas + cursos | Eliminar matrícula |
| `useUploadDocumento()` | Mutation | Invalida matrícula + matrículas | Subir documento (Drive + updateDocumento) |

### 15.3 Hooks de Cursos (`useCursos.ts`)

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `useCursos()` | Query | `['cursos']` | Todos los cursos |
| `useCurso(id)` | Query | `['curso', id]` | Curso por ID |
| `useCursosByEstado(estado)` | Query | `['cursos', 'estado', estado]` | Filtrar por estado |
| `useSearchCursos(query)` | Query | `['cursos', 'search', query]` | Buscar cursos (2+ chars) |
| `useCursoEstadisticas(id)` | Query | `['curso', id, 'estadisticas']` | Estadísticas del curso |
| `useCreateCurso()` | Mutation | Invalida `['cursos']` | Crear curso |
| `useUpdateCurso()` | Mutation | Invalida cursos + curso específico | Actualizar curso |
| `useCambiarEstadoCurso()` | Mutation | Invalida cursos + curso específico | Cambiar estado |
| `useDeleteCurso()` | Mutation | Invalida `['cursos']` | Eliminar curso |
| `useAgregarEstudiantesCurso()` | Mutation | Invalida cursos + curso + matrículas | Agregar estudiantes |
| `useRemoverEstudianteCurso()` | Mutation | Invalida cursos + curso + matrículas | Remover estudiante |

### 15.4 Hooks de Niveles de Formación (`useNivelesFormacion.ts`)

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `useNivelesFormacion()` | Query | `['niveles-formacion']` | Todos los niveles |
| `useNivelFormacion(id)` | Query | `['nivel-formacion', id]` | Nivel por ID |
| `useSearchNiveles(query)` | Query | `['niveles-formacion', 'search', query]` | Buscar niveles (2+ chars) |
| `useCreateNivelFormacion()` | Mutation | Invalida `['niveles-formacion']` | Crear nivel |
| `useUpdateNivelFormacion()` | Mutation | Invalida niveles + nivel específico | Actualizar nivel |
| `useDeleteNivelFormacion()` | Mutation | Invalida `['niveles-formacion']` | Eliminar nivel |

### 15.5 Hooks de Personal (`usePersonal.ts`)

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `usePersonalList()` | Query | `['personal']` | Todo el personal |
| `usePersonal(id)` | Query | `['personal', id]` | Personal por ID |
| `usePersonalByTipoCargo(tipo)` | Query | `['personal', 'tipoCargo', tipo]` | Personal filtrado por tipo de cargo |
| `useCreatePersonal()` | Mutation | Invalida `['personal']` | Crear perfil |
| `useUpdatePersonal()` | Mutation | Invalida personal + perfil específico | Actualizar perfil |
| `useDeletePersonal()` | Mutation | Invalida `['personal']` | Eliminar perfil |
| `useUpdateFirma()` | Mutation | Invalida personal + perfil específico | Guardar firma digital |
| `useDeleteFirma()` | Mutation | Invalida personal + perfil específico | Eliminar firma digital |
| `useAddAdjunto()` | Mutation | Invalida personal + perfil específico | Agregar documento adjunto |
| `useDeleteAdjunto()` | Mutation | Invalida personal + perfil específico | Eliminar documento adjunto |
| `useCargos()` | Query | `['cargos']` | Todos los cargos |
| `useCreateCargo()` | Mutation | Invalida `['cargos']` | Crear cargo |
| `useUpdateCargo()` | Mutation | Invalida `['cargos']` | Editar cargo |
| `useDeleteCargo()` | Mutation | Invalida `['cargos']` | Eliminar cargo |

### 15.6 Hooks de Comentarios (`useComentarios.ts`)

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `useComentarios(mId, seccion)` | Query | `['comentarios', mId, seccion]` | Comentarios por matrícula y sección |
| `useCreateComentario()` | Mutation | Invalida comentarios de la sección | Crear comentario |
| `useUpdateComentario()` | Mutation | Invalida `['comentarios']` | Editar comentario |
| `useDeleteComentario()` | Mutation | Invalida `['comentarios']` | Eliminar comentario |

### 15.7 Hooks del Portal Admin (`usePortalAdmin.ts`)

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `usePortalAdminConfig()` | Query | `['portal-admin-config']` | Configuración global del portal |
| `useSaveDocumentoConfig()` | Mutation | Invalida `['portal-admin-config']` | Guardar documento en catálogo |
| `useDeleteDocumentoConfig()` | Mutation | Invalida `['portal-admin-config']` | Eliminar documento del catálogo |
| `useTogglePortalGlobal()` | Mutation | Invalida `['portal-admin-config']` | Toggle portal activo por defecto |
| `useUpdateOrdenDocumentos()` | Mutation | Invalida `['portal-admin-config']` | Reordenar documentos |
| `useUpdateHabilitacionNivel()` | Mutation | Invalida `['portal-admin-config']` | Toggle habilitación por nivel |

### 15.8 Hooks del Portal Estudiante (`usePortalEstudiante.ts`)

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `useBuscarMatriculaVigente(cedula)` | Query | `['portal-estudiante', 'matricula-vigente', cedula]` | Buscar matrícula vigente (6+ chars) |
| `useDocumentosPortal(matriculaId)` | Query | `['portal-estudiante', 'documentos', matriculaId]` | Config + estados de documentos |
| `useInfoAprendizData(matriculaId)` | Query | `['portal-estudiante', 'info-aprendiz', matriculaId]` | Datos para formato InfoAprendiz |
| `useEvaluacionFormato(matriculaId)` | Query | `['portal-estudiante', 'evaluacion-formato', matriculaId]` | Formato de evaluación con quiz |
| `useEnviarDocumento()` | Mutation | Invalida documentos + info-aprendiz + evaluación | Enviar documento completado |

### 15.9 Hooks de Monitoreo (`usePortalMonitoreo.ts`)

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `usePortalMonitoreo(filtros?)` | Query | `['portal-monitoreo', filtros]` | Datos de monitoreo filtrados |
| `useTogglePortalMatricula()` | Mutation | Invalida `['portal-monitoreo']` | Toggle portal de una matrícula |
| `useResetDocumentoMatricula()` | Mutation | Invalida `['portal-monitoreo']` | Reabrir documento completado |

### 15.10 Hooks de Certificación

#### `useCertificados.ts`

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `useCertificados()` | Query | `['certificados']` | Todos los certificados |
| `useCertificado(id)` | Query | `['certificados', id]` | Certificado por ID |
| `useCertificadosByMatricula(mId)` | Query | `['certificados', 'matricula', mId]` | Certificados de una matrícula |
| `useCertificadosByCurso(cId)` | Query | `['certificados', 'curso', cId]` | Certificados de un curso |
| `useCreateCertificado()` | Mutation | Invalida `['certificados']` | Crear certificado |
| `useGenerarCertificado()` | Mutation | Invalida certificados + matrículas | Generar certificado completo |
| `useRevocarCertificado()` | Mutation | Invalida `['certificados']` | Revocar certificado |
| `useReemitirCertificado()` | Mutation | Invalida certificados + matrículas | Reemitir certificado (nueva versión) |

#### `usePlantillas.ts`

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `usePlantillas()` | Query | `['plantillas']` | Todas las plantillas |
| `usePlantilla(id)` | Query | `['plantillas', id]` | Plantilla por ID |
| `usePlantillaActiva()` | Query | `['plantillas', 'activa']` | Plantilla activa |
| `useCreatePlantilla()` | Mutation | Invalida `['plantillas']` | Crear plantilla |
| `useUpdatePlantilla()` | Mutation | Invalida `['plantillas']` | Actualizar plantilla |
| `useRollbackPlantilla()` | Mutation | Invalida `['plantillas']` | Rollback a versión anterior |

#### `useTiposCertificado.ts`

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `useTiposCertificado()` | Query | `['tipos-certificado']` | Todos los tipos |
| `useTipoCertificado(id)` | Query | `['tipos-certificado', id]` | Tipo por ID |
| `useTiposCertificadoByFormacion(tipo)` | Query | `['tipos-certificado', 'formacion', tipo]` | Tipos filtrados por formación |
| `useCreateTipoCertificado()` | Mutation | Invalida `['tipos-certificado']` | Crear tipo |
| `useUpdateTipoCertificado()` | Mutation | Invalida `['tipos-certificado']` | Actualizar tipo |
| `useDeleteTipoCertificado()` | Mutation | Invalida `['tipos-certificado']` | Eliminar tipo |

#### `useExcepcionesCertificado.ts`

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `useExcepcionesCertificado()` | Query | `['excepciones-certificado']` | Todas las excepciones |
| `useExcepcionesByMatricula(mId)` | Query | `['excepciones-certificado', 'matricula', mId]` | Excepciones por matrícula |
| `useSolicitarExcepcion()` | Mutation | Invalida `['excepciones-certificado']` | Solicitar excepción |
| `useAprobarExcepcion()` | Mutation | Invalida `['excepciones-certificado']` | Aprobar excepción |
| `useRechazarExcepcion()` | Mutation | Invalida `['excepciones-certificado']` | Rechazar excepción |

---

## 16. Relación entre Módulos

### 16.1 Diagrama de Entidades

```
┌──────────┐     1:N     ┌────────────┐     N:1     ┌──────────┐
│  Persona │─────────────│  Matrícula  │─────────────│  Curso   │
│          │             │            │             │          │
│ id       │             │ personaId  │             │ id       │
│ nombres  │             │ cursoId    │             │ nombre   │
│ apellidos│             │ estado     │             │ estado   │
│ documento│             │ documentos │             │ matrIds  │
│ ...      │             │ pagado     │             │ ...      │
└──────────┘             │ ...        │             └────┬─────┘
                         └─────┬──────┘                  │
                               │ 1:N                     │ N:1 (entrenador/supervisor)
                    ┌──────────┴───────────┐       ┌─────▼─────┐     N:1     ┌──────────┐
                    │                      │       │ Personal  │─────────────│  Cargo   │
              ┌─────▼─────┐         ┌──────▼─────┐│           │             │          │
              │ Documento │         │ Comentario ││ nombres   │             │ nombre   │
              │ Requerido │         │            ││ apellidos │             │ tipo     │
              │           │         │ seccion    ││ firmaB64  │             └──────────┘
              │ tipo      │         │ texto      ││ adjuntos  │
              │ estado    │         │ usuario    │└───────────┘
              │ fechas    │         │ timestamp  │
              └───────────┘         └────────────┘

┌──────────────────┐                    ┌─────────────────────┐
│ NivelFormacion   │                    │     AuditLog        │
│                  │                    │                     │
│ nombreNivel      │                    │ entidadTipo         │ ← persona | matricula | curso |
│ duracionHoras    │                    │                     │   comentario | nivel_formacion |
│ documentosReq    │                    │                     │   personal | cargo
│ camposAdicionales│                    │ entidadId           │
│ observaciones    │                    │ accion              │ ← crear | editar | eliminar
└──────────────────┘                    │ camposModificados   │
                                        │ valorAnterior/Nuevo │
                                        │ usuario + timestamp │
                                        └─────────────────────┘

┌─────────────────────┐     N:1     ┌──────────────────┐
│ CertificadoGenerado │─────────────│ TipoCertificado  │
│                     │             │                  │
│ matriculaId         │             │ nombre           │
│ cursoId             │             │ tipoFormacion    │
│ personaId           │             │ plantillaId ─────┼──→ PlantillaCertificado
│ codigo              │             │ reglas           │
│ estado              │             │ reglaCodigo      │
│ svgFinal            │             └──────────────────┘
│ snapshotDatos       │
└─────────────────────┘

┌──────────────────────────────┐
│ SolicitudExcepcionCertificado│
│                              │
│ matriculaId                  │
│ estado (pendiente/aprobada/  │
│         rechazada)           │
│ motivo                       │
└──────────────────────────────┘
```

### 16.2 Relaciones

| Relación | Cardinalidad | Descripción |
|----------|-------------|-------------|
| Persona → Matrícula | 1:N | Una persona puede tener múltiples matrículas (en diferentes cursos o períodos) |
| Curso → Matrícula | 1:N | Un curso contiene múltiples matrículas/estudiantes |
| Matrícula → Documento | 1:N | Cada matrícula tiene documentos requeridos dinámicos |
| Matrícula → Comentario | 1:N | Comentarios por sección (cartera, observaciones) |
| Curso → Personal | N:1 | Un curso referencia un entrenador y opcionalmente un supervisor del módulo de Personal |
| Personal → Cargo | N:1 | Cada perfil de personal tiene un cargo asignado |
| Todas → AuditLog | N:1 | Registro transversal de todas las operaciones CRUD |

### 16.3 Interacciones entre Módulos

1. **Crear matrícula** → Valida existencia del curso → Actualiza `matriculasIds` del curso.
2. **Eliminar matrícula** → Remueve ID de `matriculasIds` del curso.
3. **Agregar estudiante a curso** → Actualiza `cursoId` en la matrícula correspondiente.
4. **Remover estudiante de curso** → Limpia `cursoId` de la matrícula (pone `''`).
5. **Cerrar curso** → Verifica que no haya matrículas pendientes/creadas.
6. **Eliminar curso** → Verifica que no tenga matrículas asociadas.
7. **Crear/editar curso** → Selecciona entrenador y supervisor desde el módulo de Personal (filtrado por tipo de cargo).
8. **Formatos de matrículas** → Consultan firma digital del entrenador/supervisor desde Personal para insertar en documentos generados.
9. **Dashboard** → Consume datos de los tres módulos principales para calcular métricas globales.
10. **Portal Estudiante (Admin)** → Consume `portalDocumentosCatalogo` para configuración y `mockMatriculas` para monitoreo.
11. **Portal Estudiante (Público)** → Resuelve matrícula vigente cruzando personas, matrículas y cursos. Consume catálogo de documentos filtrado por nivel de formación del curso.
12. **Certificación** → Consume plantillas SVG, tipos de certificado, y datos de matrícula/persona/curso para generar certificados. Las excepciones cruzan con matrículas para autorización especial.

---

## 17. Catálogos y Datos de Referencia

Definidos en `src/data/formOptions.ts`:

| Catálogo | Opciones | Uso |
|----------|----------|-----|
| `TIPOS_DOCUMENTO` | CC, CE, PA, PE, PP | Tipo de documento de identidad |
| `GENEROS` | M, F | Género |
| `NIVELES_EDUCATIVOS` | 10 niveles (analfabeta → doctorado) | Nivel educativo |
| `GRUPOS_SANGUINEOS` | 8 tipos (O+, O-, A+, A-, B+, B-, AB+, AB-) | Grupo sanguíneo |
| `AREAS_TRABAJO` | Administrativo, Operativa | Área de trabajo |
| `SECTORES_ECONOMICOS` | 20 sectores (Construcción, Telecomunicaciones, etc.) | Sector económico |
| `PAISES` | 45+ países (Colombia primero) | País de nacimiento |
| `NIVELES_PREVIOS` | Trabajador Autorizado, Avanzado | Nivel de formación previa |
| `TIPOS_VINCULACION` | Empresa, Independiente | Tipo de vinculación laboral |
| `NIVELES_FORMACION_EMPRESA` | Jefe de Área, Trabajador Autorizado, Reentrenamiento, Coordinador T.A. | Nivel de formación en empresa |
| `FORMAS_PAGO` | Efectivo, Transferencia, Consignación, Tarjeta, Otro | Forma de pago |
| `EPS_OPTIONS` | 25 EPS colombianas + "Otra" | Entidad Promotora de Salud |
| `ARL_OPTIONS` | 11 ARL colombianas + "Otra" | Administradora de Riesgos Laborales |
| `TIPOS_CARGO` | Entrenador, Supervisor, Administrativo, Instructor, Otro | Tipo de cargo de personal |
| `CATALOGO_DOCUMENTOS` | 6 tipos de documentos requeridos para niveles de formación | Documentos requeridos configurables |
| `TIPOS_CAMPO_LABELS` | 12 tipos de campo adicional con etiquetas | Tipos de campos personalizados |

---

## 18. Auditoría y Trazabilidad

### 18.1 Entidad: `AuditLog`

```typescript
interface AuditLog {
  id: string;
  entidadTipo: 'persona' | 'matricula' | 'curso' | 'comentario' | 'nivel_formacion' | 'personal' | 'cargo';
  entidadId: string;
  accion: 'crear' | 'editar' | 'eliminar';
  camposModificados?: string[];           // Solo en ediciones
  valorAnterior?: Record<string, unknown>; // Solo en ediciones
  valorNuevo?: Record<string, unknown>;    // Solo en ediciones
  usuarioId: string;
  usuarioNombre: string;
  timestamp: string;                       // ISO datetime
}
```

### 18.2 Eventos Auditados

| Entidad | Crear | Editar | Eliminar |
|---------|-------|--------|----------|
| Persona | ✓ | ✓ (con diff) | ✓ |
| Matrícula | ✓ | ✓ (con diff) | ✗ |
| Curso | ✓ | ✓ (con diff, incluye gestión de estudiantes) | ✗ |
| Comentario | ✓ | ✓ (con diff de texto) | ✓ |
| Nivel de Formación | ✓ | ✓ (con diff) | ✓ |
| Personal | ✓ | ✓ (incluye firma y adjuntos) | ✓ |
| Cargo | ✓ | ✓ (con diff) | ✓ |

### 17.3 Cobertura de Auditoría

- **Cambios de estado**: Se registran como ediciones con `camposModificados: ['estado']` y los valores anterior/nuevo.
- **Gestión de estudiantes en cursos**: Se registra como edición con `camposModificados: ['matriculasIds']` indicando qué matrículas se agregaron o removieron.
- **Edición de campos**: Se registra el objeto completo anterior y los campos nuevos modificados.
- **Firma digital de personal**: Se registra como edición con `camposModificados: ['firmaBase64']`.
- **Adjuntos de personal**: Se registra como edición con `camposModificados: ['adjuntos']`.

---

## 19. Historial de Cambios

### v1.2 — 20 de Febrero 2026

#### Formato Evaluación Reentrenamiento (FIH04-019)

**Sección de Datos del Participante — Layout 3 columnas**
- El grid de datos del participante se reorganizó de 2 a **3 columnas** para lectura más compacta.
- Distribución de campos:
  - Fila 1: Fecha / Tipo de documento / Número de documento
  - Fila 2: Nombre completo (span 3 columnas)
  - Fila 3: Nivel de formación / Empresa
- El campo **Empresa** muestra `"Independiente"` cuando `matricula.empresaNombre` está vacío o ausente.
- El campo **Nivel de formación** se toma siempre de `matricula.empresaNivelFormacion` (sin redefinición).
- El componente `FieldCell` ahora soporta prop `span3?: boolean` que aplica `col-span-3 field-span3`.
- Se agregaron reglas CSS `.grid-3` y `.field-span3` a `PRINT_STYLES` para la impresión.

**Tabla de Preguntas y Respuestas — Letra de opción**
- La columna "Respuesta seleccionada" ahora incluye la **letra correspondiente** prefijada al texto de la opción.
- Formato: `a. Verdadero`, `b. Falso`, `a. Texto opción`, `b. Texto opción`, etc.
- Las preguntas Verdadero/Falso muestran `a. Verdadero` o `b. Falso`.
- Las preguntas de 4 opciones muestran `a.`, `b.`, `c.` o `d.` según el índice seleccionado.

**Colores semánticos en PDF**
- El ratio `X/15` y el porcentaje se muestran en **verde** (`#059669`) si aprobado, **rojo** (`#dc2626`) si no aprobado.
- El badge `✓ Aprobado` / `✗ No aprobado` tiene fondo verde o rojo respectivamente en el PDF impreso.
- Se implementa inyectando las clases `.aprobado` / `.no-aprobado` dinámicamente en el HTML antes de llamar a `window.print()`.

**Filtrado de contenido en PDF**
- Se ocultó la fila "Respuestas correctas X de 15 — Mínimo requerido: 70%" en el PDF impreso mediante:
  ```css
  .resultado-compacto > div:nth-child(3),
  .resultado-compacto > div:nth-child(4) { display: none; }
  ```
- En pantalla (vista administrativa) esa fila permanece visible.

**Optimización de espacio en impresión**
- Reducción de `body { padding: 10mm }` → `6mm` en `@media print`.
- Reducción de `font-size: 12px` → `11px` en `@media print`.
- Reducción de márgenes de sección: `margin-top: 24px` → `14px` en `@media print`.
- Reducción de padding de celdas de tabla: `7px 4px` → `5px 4px` en `@media print`.
- El `.section-group` ya no tiene `break-inside: avoid` en print, permitiendo que las secciones se dividan entre páginas y se reduzca el número de hojas.
- El bloque `.resultado-compacto` mantiene `break-inside: avoid` para no fragmentarse entre páginas.

**Archivos modificados:**
- `src/components/matriculas/formatos/EvaluacionReentrenamientoDocument.tsx`
- `src/components/matriculas/formatos/EvaluacionReentrenamientoPreviewDialog.tsx`

---

### v1.3 — 22 de Febrero 2026

**ColumnSelector: botón "Restablecer"**
- Nueva prop opcional `defaultColumns` que habilita un botón "Restablecer" en el footer del popover.
- Al hacer clic, restaura la visibilidad de columnas a sus valores por defecto definidos en `defaultColumns`.
- El footer ahora muestra tres acciones: Mostrar todas / Restablecer / Ocultar todas.

**DataTable: ordenamiento interactivo**
- Ordenamiento por defecto por `createdAt` descendente en todas las tablas.
- Nuevas props `defaultSortKey` y `defaultSortDirection` en `DataTableProps<T>`.
- Columnas con `sortable: true` muestran iconos de dirección (`ArrowUp`, `ArrowDown`, `ArrowUpDown` de Lucide).
- Click en header alterna dirección; click en otra columna cambia criterio de ordenamiento.
- Interfaz `Column<T>` ampliada con propiedades `sortable`, `sortKey` y `sortValue`.
- Funciones auxiliares `getSortValue()` y `compareValues()` con soporte para comparación numérica y `localeCompare` en español.

**CursosListView: columna "Fecha Creación"**
- Nueva columna `fechaCreacion` como primera columna visible por defecto en la tabla de cursos.
- Formateada con `format(new Date(c.createdAt), "dd/MM/yyyy")`.
- Ordenable por `createdAt` con `sortable: true` y `sortKey: "createdAt"`.

**PersonasPage y MatriculasPage: columnas ordenables**
- Columnas con ordenamiento interactivo habilitado en ambos módulos.

**Archivos modificados:**
- `src/components/shared/DataTable.tsx`
- `src/components/shared/ColumnSelector.tsx`
- `src/components/cursos/CursosListView.tsx`
- `src/pages/personas/PersonasPage.tsx`
- `src/pages/matriculas/MatriculasPage.tsx`

---

### v1.4 — 23 de Febrero 2026

#### Módulo de Niveles de Formación

Nuevo módulo completo para configurar dinámicamente los niveles de formación del centro:

- **Entidad `NivelFormacion`**: nombre, duración (horas/días), documentos requeridos (del catálogo), campos adicionales personalizados y observaciones.
- **Campos Adicionales (`CampoAdicional`)**: 12 tipos de campo (texto, numérico, select, fecha, booleano, archivo, URL, etc.) con soporte de alcance (`solo_nivel` / `todos_los_niveles`) y opciones configurables para selects.
- **CRUD completo**: Crear, editar, eliminar niveles con auditoría. Gestión individual de campos adicionales dentro de cada nivel.
- **Componentes**: `NivelesPage` (tabla con búsqueda), `NivelDetallePage`, `NivelFormPage`, `CampoAdicionalModal` (con preview en tiempo real), `CampoPreview`.

**Archivos creados/modificados:**
- `src/types/nivelFormacion.ts`
- `src/services/nivelFormacionService.ts`
- `src/hooks/useNivelesFormacion.ts`
- `src/pages/niveles/NivelesPage.tsx`, `NivelDetallePage.tsx`, `NivelFormPage.tsx`
- `src/components/niveles/CampoAdicionalModal.tsx`, `CampoPreview.tsx`

#### Módulo de Gestión de Personal

Nuevo módulo completo para administrar perfiles de staff interno del centro de formación:

- **Entidades**: `Personal` (perfil con firma y adjuntos), `Cargo` (nombre único + tipo), `AdjuntoPersonal` (archivo con metadata).
- **Tipos de cargo**: Entrenador, Supervisor, Administrativo, Instructor, Otro.
- **Firma digital**: Componente `FirmaPersonal` con dos modos (dibujo con `react-signature-canvas` y carga de imagen PNG). Opcional en creación y edición.
- **Documentos adjuntos**: Componente `AdjuntosPersonal` para gestión de archivos (hoja de vida, contratos, etc.) con preview inline, descarga y eliminación. Opcional en creación y edición.
- **Formulario de creación**: Permite opcionalmente adjuntar documentos y capturar firma durante la creación del perfil. Los archivos se suben secuencialmente tras crear el registro base.
- **Panel lateral (DetailSheet)**: Muestra datos del perfil, adjuntos y firma con gestión en tiempo real desde el listado principal.
- **Gestión de cargos**: Modal `GestionCargosModal` con CRUD de cargos, validación de unicidad de nombre y protección contra eliminación de cargos en uso.
- **Integración con Cursos**: Los selectores de entrenador y supervisor en el formulario de cursos consumen registros de personal filtrados por tipo de cargo.
- **Integración con Matrículas**: La firma centralizada del personal es la fuente para los formatos de documentos generados (firma del entrenador/supervisor).

**Archivos creados/modificados:**
- `src/types/personal.ts`
- `src/services/personalService.ts`
- `src/hooks/usePersonal.ts`
- `src/pages/personal/GestionPersonalPage.tsx`, `PersonalDetallePage.tsx`, `PersonalFormPage.tsx`
- `src/components/personal/FirmaPersonal.tsx`, `AdjuntosPersonal.tsx`, `PersonalDetailSheet.tsx`, `GestionCargosModal.tsx`

#### Actualizaciones generales

- **Sidebar de navegación**: Nuevas entradas "Gestión de Personal" y "Niveles de Formación" en `AppSidebar`.
- **Enrutamiento**: 8 nuevas rutas para los módulos de Niveles y Personal.
- **Auditoría ampliada**: `TipoEntidad` extendido con `'nivel_formacion' | 'personal' | 'cargo'`. Todas las operaciones CRUD de los nuevos módulos generan logs de auditoría.
- **Datos mock**: Nuevos arrays `mockNivelesFormacion`, `mockPersonalStaff` y `mockCargos` en `mockData.ts`.

---

### v1.5 — 1 de Marzo 2026

#### Portal Estudiante (Admin) — Módulo nuevo

Nuevo módulo completo de administración del portal público del estudiante:

- **Configuración centralizada**: Catálogo de documentos con drag-and-drop para ordenamiento, dependencias lógicas entre documentos, y habilitación granular por nivel de formación (TipoFormacion).
- **Tipos de documento**: `firma_autorizacion`, `evaluacion`, `formulario`, `solo_lectura` — extensibles.
- **Grid de habilitación**: Matriz documentos × niveles con toggles individuales.
- **Toggle global protegido**: Switch "Portal activo por defecto" con `ConfirmDialog` obligatorio al desactivar.
- **Sincronización de formulario**: `DocumentoConfigDialog` utiliza `useEffect` para resetear campos locales al abrir/cambiar entre documentos.

#### Portal Estudiante (Admin) — Monitoreo

- **Chips de resumen**: Total matrículas, todo completo, con pendientes.
- **Columna de progreso**: Barra `<Progress>` + ratio `completados/total` por fila.
- **Columna "Acceso"**: Badge Activo/Inactivo (reemplaza "Portal Sí/No").
- **Contador de resultados**: "Mostrando X matrículas".
- **Dialog de detalle con refresco en tiempo real**: Tras toggle portal o reabrir documento, `onDataChange` ejecuta `refetch()` y actualiza la fila seleccionada con datos frescos del query invalidado.
- **Filtros**: Búsqueda por nombre/cédula/curso, filtro por curso, nivel de formación, documento pendiente.

#### Portal Estudiante (Público) — Módulo nuevo

Interfaz pública mobile-first para que estudiantes completen documentos de formación:

- **Acceso por cédula**: Resolución automática de matrícula vigente (curso no cerrado, fecha vigente, prioriza más reciente).
- **Sesión persistida**: `PortalEstudianteContext` con localStorage y `PortalGuard` para protección de rutas.
- **Panel de documentos**: Dashboard con progreso, lista de documentos con estados (bloqueado/pendiente/completado), dependencias visuales.
- **Despacho genérico** (`DocumentoRendererPage`): Ruta `/estudiante/documentos/:documentoKey` con registro de renderers por `TipoDocPortal`. Escalable sin modificar rutas.
- **Evaluaciones dinámicas**: Quiz consumido desde formatos de formación con acumulación de intentos y cálculo de aprobación configurable.
- **Inicialización legacy**: `portalInitService` garantiza compatibilidad con matrículas sin estructura `portalEstudiante`.

**Archivos creados:**
- `src/types/portalEstudiante.ts`, `src/types/portalAdmin.ts`
- `src/services/portalAdminService.ts`, `src/services/portalEstudianteService.ts`, `src/services/portalMatriculaService.ts`, `src/services/portalMonitoreoService.ts`, `src/services/portalInitService.ts`
- `src/hooks/usePortalAdmin.ts`, `src/hooks/usePortalEstudiante.ts`, `src/hooks/usePortalMonitoreo.ts`
- `src/contexts/PortalEstudianteContext.tsx`
- `src/data/portalAdminConfig.ts`, `src/data/portalEstudianteConfig.ts`
- `src/pages/portal-admin/PortalAdminPage.tsx`
- `src/pages/estudiante/AccesoEstudiantePage.tsx`, `PanelDocumentosPage.tsx`, `DocumentoRendererPage.tsx`, `EvaluacionPage.tsx`, `InfoAprendizPage.tsx`, `PortalGuard.tsx`
- `src/components/portal-admin/DocumentoConfigDialog.tsx`, `DocumentosCatalogoTable.tsx`, `NivelesHabilitacionGrid.tsx`, `MonitoreoTable.tsx`, `MonitoreoDetalleDialog.tsx`

**Archivos modificados:**
- `src/App.tsx` — Nuevas rutas del portal admin y estudiante
- `src/components/layout/AppSidebar.tsx` — Entrada "Portal Estudiante" en sidebar

---

### v1.6 — 8 de Marzo 2026

#### Módulo de Certificación — Módulo nuevo

Nuevo módulo completo para gestión del ciclo de certificación:

- **Plantillas SVG**: Carga, detección automática de tokens `{{...}}`, versionado con historial y rollback. Editor de mapeo de etiquetas (`PlantillaEditorPage`).
- **Tipos de Certificado**: CRUD integrado en la página de Plantillas (pestaña "Tipos de Certificado"). Define nombre, tipo de formación, plantilla vinculada, regla de código, y 5 switches de validación (pago, documentos, formatos, empresa, firmas).
- **Certificados generados**: Generación individual/masiva con snapshot de datos, SVG final con tokens reemplazados, y código único. Estados: elegible → generado → revocado.
- **Excepciones**: Flujo solicitar/aprobar/rechazar para matrículas que no cumplen requisitos. Generación con `autorizadoExcepcional=true`.
- **Revocación y reemisión**: Certificados pueden revocarse con motivo y reemitirse con nueva versión.

#### Consolidación de gestión

- **Tipos de Certificado integrados en Plantillas**: La gestión de tipos de certificado se consolidó dentro de `PlantillasPage` como segunda pestaña, eliminando la página independiente `TiposCertificadoPage`.
- **Sidebar simplificado**: Se eliminó la subentrada "Tipos de Certificado" del menú desplegable de Certificación. Queda: Historial y Plantillas.

**Archivos creados:**
- `src/types/certificado.ts`
- `src/data/mockCertificados.ts`
- `src/services/certificadoService.ts`, `src/services/plantillaService.ts`, `src/services/tipoCertificadoService.ts`, `src/services/excepcionCertificadoService.ts`
- `src/hooks/useCertificados.ts`, `src/hooks/usePlantillas.ts`, `src/hooks/useTiposCertificado.ts`, `src/hooks/useExcepcionesCertificado.ts`
- `src/pages/certificacion/PlantillasPage.tsx`, `PlantillaEditorPage.tsx`, `HistorialCertificadosPage.tsx`
- `src/components/certificacion/PlantillaTestDialog.tsx`, `PlantillaVersionHistory.tsx`
- `src/components/matriculas/CertificacionSection.tsx`, `ExcepcionesPanel.tsx`, `RevocacionDialog.tsx`, `HistorialVersiones.tsx`
- `src/utils/certificadoGenerator.ts`, `src/utils/certificadoPdf.ts`

**Archivos modificados:**
- `src/App.tsx` — Nuevas rutas de certificación
- `src/components/layout/AppSidebar.tsx` — Menú desplegable "Certificación" con Historial y Plantillas

**Archivos eliminados:**
- `src/pages/certificacion/TiposCertificadoPage.tsx` — Funcionalidad integrada en PlantillasPage

---

*Documento generado como referencia integral del sistema SAFA. Para dudas técnicas o funcionales, consultar el código fuente en el directorio `src/`.*
