
# Plan de Desarrollo SAFA - Modulos A, B, C

## Resumen Ejecutivo

Este plan detalla la implementacion de los tres modulos funcionales principales de la plataforma SAFA (Sistema Operativo Administrativo de Formacion en Alturas), siguiendo la estrategia de Backend Emulado y manteniendo el estilo visual minimalista actual.

---

## Fase 0: Arquitectura Base y Fundamentos

### 0.1 Estructura de Carpetas

```text
src/
├── components/
│   ├── ui/                    # Componentes Shadcn (existentes)
│   ├── layout/                # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MainLayout.tsx
│   ├── personas/              # Modulo A
│   ├── matriculas/            # Modulo B
│   └── cursos/                # Modulo C
├── services/                  # Capa de servicios (mocking)
│   ├── api.ts                 # Utilidades base (delay, helpers)
│   ├── personaService.ts
│   ├── matriculaService.ts
│   └── cursoService.ts
├── data/
│   └── mockData.ts            # Datos simulados
├── types/                     # Interfaces TypeScript
│   ├── persona.ts
│   ├── matricula.ts
│   ├── curso.ts
│   └── index.ts
├── hooks/                     # Custom hooks
│   ├── usePersonas.ts
│   ├── useMatriculas.ts
│   └── useCursos.ts
├── pages/
│   ├── dashboard/
│   ├── personas/
│   ├── matriculas/
│   └── cursos/
└── lib/
    └── utils.ts
```

### 0.2 Definicion de Interfaces TypeScript

```typescript
// types/persona.ts
interface Persona {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  direccion: string;
  eps: string;
  arl: string;
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    parentesco: string;
  };
  firma?: string; // Base64
  firmaFecha?: string;
  createdAt: string;
  updatedAt: string;
}

// types/matricula.ts
type EstadoMatricula = 
  | 'creada' 
  | 'pendiente' 
  | 'completa' 
  | 'certificada' 
  | 'cerrada';

type TipoFormacion = 
  | 'inicial' 
  | 'reentrenamiento' 
  | 'avanzado' 
  | 'coordinador';

interface DocumentoRequerido {
  id: string;
  tipo: 'cedula' | 'examen_medico' | 'certificado_eps' | 'otro';
  nombre: string;
  urlDrive?: string;
  estado: 'pendiente' | 'cargado' | 'verificado';
  fechaCarga?: string;
}

interface Matricula {
  id: string;
  personaId: string;
  cursoId: string;
  tipoFormacion: TipoFormacion;
  estado: EstadoMatricula;
  documentos: DocumentoRequerido[];
  firmaCapturada: boolean;
  firmaBase64?: string;
  evaluacionCompletada: boolean;
  evaluacionPuntaje?: number;
  encuestaCompletada: boolean;
  pagado: boolean;
  facturaNumero?: string;
  fechaPago?: string;
  createdAt: string;
  updatedAt: string;
}

// types/curso.ts
type EstadoCurso = 'abierto' | 'en_progreso' | 'cerrado';

interface Curso {
  id: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  duracionDias: number;
  horasTotales: number;
  entrenadorId: string;
  entrenadorNombre: string;
  capacidadMaxima: number;
  estado: EstadoCurso;
  matriculasIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 0.3 Capa de Servicios con Latencia Simulada

```typescript
// services/api.ts
export const delay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms + Math.random() * 500));

export const simulateApiCall = async <T>(data: T): Promise<T> => {
  await delay();
  return data;
};
```

---

## Fase 1: Modulo A - Gestion de Identidad (Personas)

### 1.1 Componentes a Desarrollar

| Componente | Descripcion | Prioridad |
|------------|-------------|-----------|
| BuscadorGlobal | Input de busqueda por cedula con autocompletado | Alta |
| PersonaForm | Formulario con modos lectura/edicion | Alta |
| PersonaDetalle | Vista completa del perfil | Alta |
| FirmaCanvas | Captura de firma con react-signature-canvas | Alta |
| LogAuditoria | Tabla de cambios (solo admin) | Media |
| PersonasList | Listado paginado de personas | Media |

### 1.2 Flujo de Usuario

```text
[Buscador Global]
       |
       v
  +---------+
  | Cedula? |
  +---------+
     /    \
   Si      No
   /        \
  v          v
[Cargar    [Formulario
 Perfil]    Nuevo]
   |          |
   v          v
[Vista     [Guardar
 Lectura]   Persona]
   |          |
   +----+-----+
        |
        v
   [Capturar
    Firma]
```

### 1.3 Pantallas y Rutas

- `/personas` - Listado de todas las personas
- `/personas/buscar` - Buscador global
- `/personas/:id` - Detalle de persona
- `/personas/nuevo` - Crear nueva persona

### 1.4 Reglas de Negocio Implementadas

1. Validacion de cedula unica antes de guardar
2. Campo cedula bloqueado en modo edicion (excepto Superadmin)
3. Firma vinculada a matricula activa, no a persona global
4. Log automatico al modificar campos sensibles

---

## Fase 2: Modulo B - Matricula (Corazon Operativo)

### 2.1 Componentes a Desarrollar

| Componente | Descripcion | Prioridad |
|------------|-------------|-----------|
| MatriculaDashboard | Panel con estado visual del estudiante | Alta |
| ChecklistInteractivo | Lista de requisitos con acciones | Alta |
| SelectorFormacion | Dropdown de tipo de formacion | Alta |
| DocumentUploader | Carga simulada de documentos | Alta |
| EstadoMatriculaBadge | Badge visual segun estado | Alta |
| MatriculaTimeline | Linea de tiempo del proceso | Media |
| PagoForm | Formulario de registro de pago | Media |

### 2.2 Estados y Transiciones

```text
                    +----------+
                    | CREADA   |
                    +----------+
                         |
         (falta documentos/firma)
                         |
                         v
                    +----------+
                    | PENDIENTE|
                    +----------+
                         |
    (docs OK + firma OK + pago OK + evaluacion OK)
                         |
                         v
                    +----------+
                    | COMPLETA |
                    +----------+
                         |
            (certificado generado)
                         |
                         v
                    +-----------+
                    | CERTIFICADA|
                    +-----------+
                         |
               (proceso finalizado)
                         |
                         v
                    +----------+
                    | CERRADA  |
                    +----------+
```

### 2.3 Checklist Interactivo - Items

1. Documentos personales (cedula, EPS)
2. Examen medico vigente
3. Firma del estudiante capturada
4. Pago registrado
5. Evaluacion aprobada
6. Encuesta de satisfaccion

### 2.4 Pantallas y Rutas

- `/matriculas` - Listado de matriculas
- `/matriculas/:id` - Dashboard de matricula individual
- `/matriculas/:id/documentos` - Gestion documental
- `/matriculas/nueva` - Crear nueva matricula

---

## Fase 3: Modulo C - Gestion de Cursos y Grupos

### 3.1 Componentes a Desarrollar

| Componente | Descripcion | Prioridad |
|------------|-------------|-----------|
| CursosTabla | Tabla con filtros por estado/fecha | Alta |
| CursoDetalle | Vista con lista de estudiantes | Alta |
| SemaforoEstudiantes | Indicadores verde/amarillo/rojo | Alta |
| AsignacionMasiva | Modal para agregar multiples estudiantes | Alta |
| CierreCursoPanel | Validacion y cierre de curso | Media |
| AsistenciaPDFBtn | Boton para generar PDF asistencia | Media |

### 3.2 Semaforo de Estados

```text
+------------------+------------------+------------------+
|   VERDE          |   AMARILLO       |   ROJO           |
+------------------+------------------+------------------+
| Todo completo    | En proceso       | Bloqueantes      |
| Listo para       | Faltan items     | No puede         |
| certificar       | menores          | continuar        |
+------------------+------------------+------------------+
```

### 3.3 Validacion de Cierre de Curso

Antes de cerrar un curso, el sistema verifica:
- Todos los estudiantes en estado "Completa" o "Certificada"
- No hay matriculas en estado "Pendiente"
- Todas las firmas de asistencia generadas
- Permisos de trabajo generados para todos

### 3.4 Pantallas y Rutas

- `/cursos` - Listado de cursos
- `/cursos/:id` - Detalle del curso con grupo
- `/cursos/:id/asistencia` - Vista de asistencia
- `/cursos/nuevo` - Crear nuevo curso

---

## Fase 4: Componentes Compartidos

### 4.1 Layout Principal

```text
+------------------------------------------+
|              HEADER                       |
|  [Logo SAFA]  [Buscador Global]  [User]   |
+--------+---------------------------------+
|        |                                 |
| SIDE   |         CONTENIDO               |
| BAR    |                                 |
|        |                                 |
| Personas                                 |
| Matriculas                               |
| Cursos                                   |
| Evaluaciones                             |
| Reportes                                 |
|        |                                 |
+--------+---------------------------------+
```

### 4.2 Componentes UI Reutilizables

- StatusBadge - Badges de estado con colores semanticos
- DataTable - Tabla con ordenamiento, filtros y paginacion
- LoadingSkeleton - Estados de carga consistentes
- EmptyState - Estados vacios con ilustraciones
- ConfirmDialog - Modales de confirmacion
- SearchInput - Input de busqueda con debounce

---

## Seccion Tecnica

### Dependencias Adicionales Requeridas

```json
{
  "dependencies": {
    "react-signature-canvas": "^1.0.6",
    "@react-pdf/renderer": "^3.1.14",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0",
    "@types/react-signature-canvas": "^1.0.2"
  }
}
```

### Estructura de mockData.ts

```typescript
// Ejemplo de estructura
export const mockPersonas: Persona[] = [
  {
    id: 'p1',
    cedula: '1234567890',
    nombres: 'Juan Carlos',
    apellidos: 'Rodriguez Perez',
    // ... otros campos
  }
];

export const mockCursos: Curso[] = [...];
export const mockMatriculas: Matricula[] = [...];
export const mockAuditLogs: AuditLog[] = [...];
```

### Patron de Custom Hooks con TanStack Query

```typescript
// hooks/usePersonas.ts
export const usePersonas = () => {
  return useQuery({
    queryKey: ['personas'],
    queryFn: () => personaService.getAll()
  });
};

export const usePersona = (id: string) => {
  return useQuery({
    queryKey: ['persona', id],
    queryFn: () => personaService.getById(id)
  });
};
```

### Servicios con Simulacion de Latencia

```typescript
// services/personaService.ts
export const personaService = {
  async getAll(): Promise<Persona[]> {
    await delay(800);
    return [...mockPersonas];
  },
  
  async getById(id: string): Promise<Persona | null> {
    await delay(500);
    return mockPersonas.find(p => p.id === id) || null;
  },
  
  async create(persona: Omit<Persona, 'id'>): Promise<Persona> {
    await delay(1000);
    const newPersona = { ...persona, id: uuid() };
    mockPersonas.push(newPersona);
    return newPersona;
  }
};
```

---

## Cronograma de Implementacion Sugerido

| Fase | Componentes | Estimacion |
|------|-------------|------------|
| 0 | Arquitectura base, types, servicios | 2-3 prompts |
| 1 | Modulo A completo | 4-5 prompts |
| 2 | Modulo B completo | 5-6 prompts |
| 3 | Modulo C completo | 4-5 prompts |
| 4 | Layout y componentes compartidos | 2-3 prompts |

---

## Consideraciones de Escalabilidad

1. **Separacion de responsabilidades**: Cada modulo es independiente y puede evolucionar sin afectar los demas
2. **Migracion a backend real**: Solo requiere cambiar los endpoints en la capa de servicios
3. **Sistema de tipos robusto**: Las interfaces TypeScript garantizan consistencia de datos
4. **Estados de carga**: Todos los componentes manejan loading, error y empty states

---

## Siguiente Paso Recomendado

Comenzar con la **Fase 0** (arquitectura base) seguida del **Modulo A** (Personas), ya que es la entidad fundacional sobre la cual se construyen las matriculas y cursos.
