# SAFA — Sistema de Administración para Centros de Formación en Trabajo Seguro en Alturas

Sistema integral de gestión académica, administrativa y financiera para centros de formación y entrenamiento en Trabajo Seguro en Alturas, alineado con la **Resolución 4272 de 2021** del Ministerio del Trabajo de Colombia.

> **URL publicada:** [cefih.lovable.app](https://cefih.lovable.app)

---

## Módulos funcionales

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Panel con KPIs en tiempo real, gráficos de tendencias y widget de tareas pendientes con Drag & Drop. |
| **Personas** | Registro de estudiantes con datos personales, contacto de emergencia, firma digital y tipo de documento (CC, CE, PA, PE, PP). |
| **Empresas** | Gestión de empresas cliente con contactos, tarifas por nivel de formación y estado activo/inactivo. |
| **Matrículas** | Ciclo de vida completo: creación → documentación → firma → evaluación → certificación. Incluye consentimiento de salud, vinculación laboral y documentos requeridos. |
| **Cursos** | Programación de cursos con entrenador, supervisor, capacidad máxima, fechas MinTrabajo y campos adicionales dinámicos. |
| **Niveles de Formación** | Configuración de niveles (Jefe de Área, Trabajador Autorizado, Reentrenamiento, Coordinador T.A.) con documentos requeridos, campos adicionales y código de estudiante personalizable. |
| **Gestión de Personal** | Registro de entrenadores y personal con cargos, adjuntos y firma digital. |
| **Gestión de Formatos** | Editor visual drag & drop para diseñar formatos de formación (asistencia, evaluación, información del aprendiz, etc.) con sistema de tokens y versionamiento. |
| **Portal Estudiante** | Portal público de acceso por cédula para que los estudiantes completen documentos, evaluaciones y encuestas. Panel de administración para configurar documentos habilitados y monitorear avance. |
| **Certificación** | Generación de certificados con plantillas editables (editor HTML), historial de certificados emitidos y excepciones documentadas. |
| **Cartera** | Gestión financiera con grupos de cartera por responsable de pago, facturación, registro de pagos, seguimiento de saldos y actividades de cobro. |

---

## Stack tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| Estilos | Tailwind CSS 3 + tailwindcss-animate |
| Componentes UI | shadcn/ui (Radix UI) |
| Routing | React Router v6 |
| Estado servidor | TanStack React Query v5 |
| Estado cliente | Zustand |
| Formularios | React Hook Form + Zod |
| Drag & Drop | dnd-kit |
| Gráficos | Recharts |
| Firma digital | react-signature-canvas |
| Fechas | date-fns |
| IDs | uuid |

---

## Arquitectura

```
Pages  →  Hooks (React Query)  →  Services  →  Mock Data
```

- **Frontend-first**: toda la lógica de negocio vive en el frontend con servicios mock que simulan latencia de red.
- **Preparado para migración**: los servicios (`src/services/`) encapsulan el acceso a datos; al integrar un backend real (API REST / Supabase) solo se reemplazan las implementaciones de los servicios sin tocar hooks ni componentes.
- **Auditoría**: sistema de logs que registra crear/editar/eliminar en todas las entidades principales.
- **Integridad referencial**: validaciones de eliminación protegen contra registros huérfanos.

---

## Estructura del proyecto

```
src/
├── pages/                  # 12 secciones de la aplicación
│   ├── Dashboard.tsx
│   ├── personas/           # CRUD de personas
│   ├── empresas/           # CRUD de empresas
│   ├── matriculas/         # Gestión de matrículas
│   ├── cursos/             # Programación de cursos
│   ├── niveles/            # Configuración de niveles
│   ├── personal/           # Gestión de personal
│   ├── formatos/           # Editor de formatos
│   ├── estudiante/         # Portal estudiante (público)
│   ├── portal-admin/       # Administración del portal
│   ├── certificacion/      # Plantillas y certificados
│   └── cartera/            # Gestión financiera
├── components/
│   ├── ui/                 # Componentes shadcn/ui
│   ├── shared/             # DataTable, EditableField, ComentariosSection, etc.
│   ├── layout/             # AppSidebar, MainLayout
│   └── [módulo]/           # Componentes específicos por módulo
├── services/               # 20 servicios (mock con simulación de API)
├── hooks/                  # 15 hooks de React Query
├── types/                  # 11 archivos de tipos TypeScript
├── data/                   # Mock data y catálogos
├── stores/                 # Stores de Zustand
├── utils/                  # Utilidades (fechas, códigos, PDFs, templates)
├── schemas/                # Esquemas de validación Zod
└── contexts/               # React Context (Portal Estudiante)

Docs/
├── DOCUMENTACION_SISTEMA.md   # Manual técnico v1.8
└── (otros documentos)
```

---

## Instalación y desarrollo

```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd safa

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 8080)
npm run dev

# Build de producción
npm run build

# Ejecutar tests
npm run test
```

---

## Documentación adicional

| Documento | Descripción |
|-----------|-------------|
| [`Docs/DOCUMENTACION_SISTEMA.md`](Docs/DOCUMENTACION_SISTEMA.md) | Manual técnico v1.8 — arquitectura, modelos de datos, flujos operativos y decisiones de diseño. |
| `REGLAS_NEGOCIO_v3.md` | Motor de reglas de negocio con 190+ reglas que gobiernan estados, validaciones, permisos y flujos. |

---

## Despliegue

El proyecto se despliega a través de **Lovable**:

1. Abrir el proyecto en [Lovable](https://lovable.dev)
2. Ir a **Share → Publish**
3. La aplicación queda disponible en [cefih.lovable.app](https://cefih.lovable.app)

También soporta dominios personalizados desde **Project → Settings → Domains**.

---

## Licencia

Proyecto privado. Todos los derechos reservados.
