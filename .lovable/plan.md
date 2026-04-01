

## Plan: Activar estudiante mock en el portal

### Problema

Todos los cursos mock tienen `fechaFin` anterior a hoy (2026-04-01), por lo que el servicio `buscarMatriculaVigente` rechaza todos los accesos.

### Solución

1. **Extender fecha del curso `c1`** en `src/data/mockData.ts`: cambiar `fechaFin` de `'2026-03-28'` a `'2026-04-30'` para que esté vigente.

2. **Inicializar `portalEstudiante`** en la matrícula `m5` (personaId `p5`, cursoId `c1`) agregando directamente el objeto `portalEstudiante: { habilitado: true, documentos: [] }` para que el portal lo reconozca de inmediato.

### Datos de acceso

- **Cédula**: `1045678901`
- **Nombre**: Diego Alejandro Castillo Vargas
- **Curso**: Trabajador Autorizado - #TA-2026-001

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/data/mockData.ts` | Extender `fechaFin` de `c1` a `2026-04-30`; agregar `portalEstudiante` a matrícula `m5` |

