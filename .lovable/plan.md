

# Plan: Portal Estudiante — Partes 0, 1 y 2

## Resumen

Implementar la base tecnica del portal, el acceso por cedula con resolucion de matricula vigente, y el panel de documentos habilitados. Todo con backend emulado (mock services) siguiendo los patrones existentes del proyecto.

---

## PARTE 0 — Base tecnica

### 0.1 Tipos (`src/types/portalEstudiante.ts`)

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
}

interface PortalEstudianteData {
  habilitado: boolean;
  documentos: DocumentoPortalEstado[];
}
```

### 0.2 Extender tipo Matricula (`src/types/matricula.ts`)

Agregar campo opcional `portalEstudiante?: PortalEstudianteData` al interface `Matricula`.

### 0.3 Configuracion global por defecto (`src/data/portalEstudianteConfig.ts`)

Catalogo de documentos disponibles con dependencias:
- `info_aprendiz`: orden 1, tipo `firma_autorizacion`, sin dependencias
- `evaluacion`: orden 2, tipo `evaluacion`, depende de `info_aprendiz`

### 0.4 Servicio portal (`src/services/portalEstudianteService.ts`)

Funciones mock:
- `buscarMatriculaVigente(cedula)` — filtra mockMatriculas + mockCursos con regla de vigencia
- `getPortalConfig()` — retorna catalogo de documentos
- `getDocumentosEstado(matriculaId)` — calcula estado de cada doc (bloqueado/pendiente/completado)
- `enviarDocumento(matriculaId, documentoKey, payload)` — persiste en mockMatriculas

### 0.5 Hook (`src/hooks/usePortalEstudiante.ts`)

React Query hooks:
- `useBuscarMatriculaVigente(cedula)`
- `useDocumentosPortal(matriculaId)`
- `useEnviarDocumento()`

---

## PARTE 1 — Acceso por cedula

### 1.1 Pagina `/estudiante` (`src/pages/estudiante/AccesoEstudiantePage.tsx`)

- Layout mobile-first, sin sidebar (ruta publica, sin `MainLayout`)
- Logo centrado + titulo "Portal del Estudiante"
- Input de cedula con validacion (solo digitos, min 6 caracteres)
- Boton "Continuar"
- Al buscar: llama `buscarMatriculaVigente(cedula)`
- Si encuentra: guarda contexto en estado + localStorage, navega a `/estudiante/inicio`
- Si no encuentra: muestra alerta "No se encontro matricula vigente"
- Loading state durante busqueda

### 1.2 Contexto de sesion (`src/contexts/PortalEstudianteContext.tsx`)

React context + provider que persiste en localStorage:
- `matriculaId`, `personaId`, `cedula`, `nombreEstudiante`
- `clearSession()` para logout
- Proteccion: si no hay sesion y la ruta es `/estudiante/*` (excepto `/estudiante`), redirige a `/estudiante`

### 1.3 Ruta protegida wrapper

Componente `PortalGuard` que verifica contexto antes de renderizar children.

---

## PARTE 2 — Panel de documentos

### 2.1 Pagina `/estudiante/inicio` (`src/pages/estudiante/PanelDocumentosPage.tsx`)

- Header con nombre del estudiante + cedula + boton "Salir"
- Nombre del curso + fechas
- Lista de cards (una por documento habilitado):
  - Icono segun tipo
  - Nombre del documento
  - Badge de estado: `Bloqueado` (gris), `Pendiente` (amarillo), `Completado` (verde)
  - Boton "Completar" (si pendiente), "Ver" (si completado), deshabilitado (si bloqueado)
  - Si bloqueado: texto "Completa primero: [nombre dependencia]"
- Clic en card navega a `/estudiante/documentos/:documentoKey`
- Barra de progreso: X de Y completados
- Mensaje de felicitacion cuando todos estan completados

### 2.2 Layout mobile-first

- Max-width 480px centrado
- Sin sidebar
- Colores del sistema pero optimizado para movil
- Touch-friendly (botones min 44px)

---

## Rutas a agregar en App.tsx

```
/estudiante                    → AccesoEstudiantePage
/estudiante/inicio             → PanelDocumentosPage (protegida)
/estudiante/documentos/:key    → (placeholder para Partes 3-4)
```

Todas sin `MainLayout` (son publicas, mobile-first).

---

## Archivos nuevos (8)

| Archivo | Descripcion |
|---|---|
| `src/types/portalEstudiante.ts` | Tipos del portal |
| `src/data/portalEstudianteConfig.ts` | Catalogo de documentos por defecto |
| `src/services/portalEstudianteService.ts` | Servicio mock |
| `src/hooks/usePortalEstudiante.ts` | React Query hooks |
| `src/contexts/PortalEstudianteContext.tsx` | Contexto de sesion |
| `src/pages/estudiante/AccesoEstudiantePage.tsx` | Pantalla de acceso |
| `src/pages/estudiante/PanelDocumentosPage.tsx` | Panel de documentos |
| `src/pages/estudiante/PortalGuard.tsx` | Guard de ruta protegida |

## Archivos modificados (2)

| Archivo | Cambio |
|---|---|
| `src/types/matricula.ts` | Agregar `portalEstudiante?` al interface |
| `src/App.tsx` | Agregar 3 rutas publicas del portal |

