# Documentación del Sistema SAFA

**Sistema de Administración para Centros de Formación en Trabajo Seguro en Alturas**

> Versión: 1.2  
> Última actualización: 20 de Febrero 2026  
> Marco normativo: Resolución 4272 de 2021 (Colombia)

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Módulo de Personas](#3-módulo-de-personas)
4. [Módulo de Matrículas](#4-módulo-de-matrículas)
5. [Módulo de Cursos](#5-módulo-de-cursos)
6. [Dashboard](#6-dashboard)
7. [Componentes Compartidos](#7-componentes-compartidos)
8. [Capa de Servicios y Datos](#8-capa-de-servicios-y-datos)
9. [Hooks (React Query)](#9-hooks-react-query)
10. [Relación entre Módulos](#10-relación-entre-módulos)
11. [Catálogos y Datos de Referencia](#11-catálogos-y-datos-de-referencia)
12. [Auditoría y Trazabilidad](#12-auditoría-y-trazabilidad)
13. [Historial de Cambios](#13-historial-de-cambios)

---

## 1. Introducción

### 1.1 Propósito

SAFA es un sistema de gestión integral para centros de formación y entrenamiento en **trabajo seguro en alturas**, conforme a la Resolución 4272 de 2021 del Ministerio del Trabajo de Colombia. El sistema gestiona el ciclo completo de formación: desde el registro de personas y la matrícula en cursos, pasando por la gestión documental y financiera, hasta la certificación final.

### 1.2 Alcance Funcional

El sistema abarca tres módulos principales:

| Módulo | Función Principal |
|--------|-------------------|
| **Personas** | Registro y gestión de datos personales, laborales y de contacto |
| **Matrículas** | Vinculación persona-curso con gestión documental, financiera y de certificación |
| **Cursos** | Programación, control de capacidad, calendario y estadísticas de cursos |

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
│        ┌─────────────┐                                   │
│        │ delay(ms)   │  ← Simula latencia de red         │
│        └─────────────┘                                   │
└──────────────────────┬──────────────────────────────────┘
                       │ CRUD sobre arrays
┌──────────────────────▼──────────────────────────────────┐
│                   CAPA DE DATOS                           │
│  mockData.ts (arrays en memoria)                         │
│  mockPersonas · mockMatriculas · mockCursos              │
│  mockComentarios · mockAuditLogs                         │
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
│   ├── cursos/          # Componentes específicos de cursos
│   ├── matriculas/      # Componentes específicos de matrículas
│   │   └── formatos/    # Documentos PDF previsualizables
│   ├── personas/        # Componentes específicos de personas
│   ├── shared/          # Componentes reutilizables
│   └── ui/              # shadcn/ui base components
├── data/
│   ├── mockData.ts      # Datos iniciales en memoria
│   └── formOptions.ts   # Catálogos para selectores
├── hooks/               # Custom hooks (React Query)
├── pages/               # Páginas por módulo
│   ├── cursos/
│   ├── matriculas/
│   └── personas/
├── services/            # Capa de servicios (API emulada)
└── types/               # Definiciones TypeScript
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

Todas las rutas protegidas se envuelven en `MainLayout` que provee el sidebar de navegación.

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
| `PersonasPage` | Tabla con búsqueda, filtros (género, sector, nivel educativo), selección múltiple, columnas configurables, y acciones en lote. |
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
| `MatriculasPage` | Tabla con búsqueda, filtros, selección múltiple |
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
| `CursosListView` | Vista de tabla con búsqueda y filtros |
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

## 6. Dashboard

### 6.1 Métricas Globales

| Métrica | Cálculo |
|---------|---------|
| **Total Personas** | `personas.length` |
| **Total Matrículas** | `matriculas.length` + pendientes (`estado === 'pendiente' \|\| 'creada'`) |
| **Total Cursos** | `cursos.length` + activos (`estado === 'abierto' \|\| 'en_progreso'`) |
| **Tasa de Certificación** | `(certificadas + completas) / total * 100` |

### 6.2 Secciones

- **Tarjetas de estadísticas**: 4 cards clickeables que navegan al módulo correspondiente.
- **Acciones rápidas**: Botones para crear persona, matrícula o curso.
- **Matrículas recientes**: Últimas 5 matrículas con tipo de formación y badge de estado.

---

## 7. Componentes Compartidos

### 7.1 DataTable

Tabla genérica reutilizable con:
- Paginación configurable
- Selección múltiple con checkboxes
- Acciones por fila (`RowActions`)
- Acciones en lote (`BulkActionsBar`)
- Columnas configurables (`ColumnSelector`)
- Toolbar con búsqueda y filtros (`TableToolbar`)

### 7.2 DetailSheet

Panel lateral deslizable (Sheet de Radix UI) con:
- Título y subtítulo
- Navegación entre registros (anterior/siguiente)
- Contador de posición ("3 de 15 matrículas")
- Botón de pantalla completa
- Footer configurable (para botones de guardar/cancelar)
- **Detección de portales**: El handler de clic externo (`handleClickOutside`) detecta portales abiertos de Radix (poppers, selects, menús, **dialogs**) para evitar cierres accidentales del panel al interactuar con modales o dropdowns superpuestos.

### 7.3 EditableField

Campo editable inline que soporta:
- **Tipos**: `text`, `select`, `date`
- **Modo vista**: Muestra valor formateado con icono opcional
- **Modo edición**: Input/Select/DatePicker según tipo
- **Badge mode**: Muestra valor como Badge
- **Opciones**: Array de `{ value, label }` para selects

### 7.4 ComentariosSection

Sistema de comentarios con:
- Historial cronológico (más recientes primero)
- Crear, editar y eliminar comentarios
- Soporte para múltiples secciones (`cartera`, `observaciones`)
- Vinculación por `matriculaId` + `seccion`
- Registro de usuario y timestamp
- Indicador de "editado" con fecha

### 7.5 Otros Componentes Compartidos

| Componente | Descripción |
|------------|-------------|
| `SearchInput` | Input de búsqueda con icono y debounce |
| `FilterPopover` | Popover con opciones de filtro |
| `ColumnSelector` | Selector de columnas visibles |
| `StatusBadge` | Badge de estado con colores semánticos |
| `ConfirmDialog` | Diálogo de confirmación para acciones destructivas |
| `BulkActionsBar` | Barra flotante de acciones masivas |
| `CopyableCell` | Celda con botón de copiar al portapapeles |
| `DocumentHeader` | Encabezado estándar para documentos PDF |

---

## 8. Capa de Servicios y Datos

### 8.1 Servicios

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

### 8.2 Datos Mock (`mockData.ts`)

Arrays exportados mutables que sirven como "base de datos" en memoria:

| Array | Contenido Inicial |
|-------|-------------------|
| `mockPersonas` | 4 personas con datos completos |
| `mockCursos` | 7 cursos en distintos estados |
| `mockMatriculas` | 4 matrículas con distintos niveles de completitud |
| `mockComentarios` | 3 comentarios de ejemplo en 2 secciones |
| `mockAuditLogs` | 3 logs iniciales de ejemplo |

---

## 9. Hooks (React Query)

### 9.1 Hooks de Personas (`usePersonas.ts`)

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `usePersonas()` | Query | `['personas']` | Todas las personas |
| `usePersona(id)` | Query | `['persona', id]` | Persona por ID |
| `usePersonaByDocumento(doc)` | Query | `['persona', 'documento', doc]` | Buscar por documento (6+ chars) |
| `useSearchPersonas(query)` | Query | `['personas', 'search', query]` | Buscar personas (2+ chars) |
| `useCreatePersona()` | Mutation | Invalida `['personas']` | Crear persona |
| `useUpdatePersona()` | Mutation | Invalida `['personas']`, `['persona', id]` | Actualizar persona |
| `useDeletePersona()` | Mutation | Invalida `['personas']` | Eliminar persona |

### 9.2 Hooks de Matrículas (`useMatriculas.ts`)

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

### 9.3 Hooks de Cursos (`useCursos.ts`)

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

### 9.4 Hooks de Comentarios (`useComentarios.ts`)

| Hook | Tipo | Query Key | Descripción |
|------|------|-----------|-------------|
| `useComentarios(mId, seccion)` | Query | `['comentarios', mId, seccion]` | Comentarios por matrícula y sección |
| `useCreateComentario()` | Mutation | Invalida comentarios de la sección | Crear comentario |
| `useUpdateComentario()` | Mutation | Invalida `['comentarios']` | Editar comentario |
| `useDeleteComentario()` | Mutation | Invalida `['comentarios']` | Eliminar comentario |

---

## 10. Relación entre Módulos

### 10.1 Diagrama de Entidades

```
┌──────────┐     1:N     ┌────────────┐     N:1     ┌──────────┐
│  Persona │─────────────│  Matrícula  │─────────────│  Curso   │
│          │             │            │             │          │
│ id       │             │ personaId  │             │ id       │
│ nombres  │             │ cursoId    │             │ nombre   │
│ apellidos│             │ estado     │             │ estado   │
│ documento│             │ documentos │             │ matrIds  │
│ ...      │             │ pagado     │             │ ...      │
└──────────┘             │ ...        │             └──────────┘
                         └─────┬──────┘
                               │ 1:N
                    ┌──────────┴───────────┐
                    │                      │
              ┌─────▼─────┐         ┌──────▼─────┐
              │ Documento │         │ Comentario │
              │ Requerido │         │            │
              │           │         │ seccion    │
              │ tipo      │         │ texto      │
              │ estado    │         │ usuario    │
              │ fechas    │         │ timestamp  │
              └───────────┘         └────────────┘

                    ┌─────────────────────┐
                    │     AuditLog        │
                    │                     │
                    │ entidadTipo         │ ← persona | matricula | curso | comentario
                    │ entidadId           │
                    │ accion              │ ← crear | editar | eliminar
                    │ camposModificados   │
                    │ valorAnterior/Nuevo │
                    │ usuario + timestamp │
                    └─────────────────────┘
```

### 10.2 Relaciones

| Relación | Cardinalidad | Descripción |
|----------|-------------|-------------|
| Persona → Matrícula | 1:N | Una persona puede tener múltiples matrículas (en diferentes cursos o períodos) |
| Curso → Matrícula | 1:N | Un curso contiene múltiples matrículas/estudiantes |
| Matrícula → Documento | 1:N | Cada matrícula tiene documentos requeridos dinámicos |
| Matrícula → Comentario | 1:N | Comentarios por sección (cartera, observaciones) |
| Todas → AuditLog | N:1 | Registro transversal de todas las operaciones CRUD |

### 10.3 Interacciones entre Módulos

1. **Crear matrícula** → Valida existencia del curso → Actualiza `matriculasIds` del curso.
2. **Eliminar matrícula** → Remueve ID de `matriculasIds` del curso.
3. **Agregar estudiante a curso** → Actualiza `cursoId` en la matrícula correspondiente.
4. **Remover estudiante de curso** → Limpia `cursoId` de la matrícula (pone `''`).
5. **Cerrar curso** → Verifica que no haya matrículas pendientes/creadas.
6. **Eliminar curso** → Verifica que no tenga matrículas asociadas.
7. **Dashboard** → Consume datos de los tres módulos para calcular métricas globales.

---

## 11. Catálogos y Datos de Referencia

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

---

## 12. Auditoría y Trazabilidad

### 12.1 Entidad: `AuditLog`

```typescript
interface AuditLog {
  id: string;
  entidadTipo: 'persona' | 'matricula' | 'curso' | 'comentario';
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

### 12.2 Eventos Auditados

| Entidad | Crear | Editar | Eliminar |
|---------|-------|--------|----------|
| Persona | ✓ | ✓ (con diff) | ✓ |
| Matrícula | ✓ | ✓ (con diff) | ✗ |
| Curso | ✓ | ✓ (con diff, incluye gestión de estudiantes) | ✗ |
| Comentario | ✓ | ✓ (con diff de texto) | ✓ |

### 12.3 Cobertura de Auditoría

- **Cambios de estado**: Se registran como ediciones con `camposModificados: ['estado']` y los valores anterior/nuevo.
- **Gestión de estudiantes en cursos**: Se registra como edición con `camposModificados: ['matriculasIds']` indicando qué matrículas se agregaron o removieron.
- **Edición de campos**: Se registra el objeto completo anterior y los campos nuevos modificados.

---

## 13. Historial de Cambios

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

*Documento generado como referencia integral del sistema SAFA. Para dudas técnicas o funcionales, consultar el código fuente en el directorio `src/`.*
