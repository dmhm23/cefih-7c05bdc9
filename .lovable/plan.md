

## Plan: Actualizar README.md con documentacion completa del proyecto SAFA

### Objetivo

Reemplazar el README generico de Lovable con una documentacion profesional que refleje la naturaleza, alcance y estructura real del proyecto SAFA.

### Estructura propuesta del nuevo README

1. **Encabezado y descripcion** -- SAFA: Sistema de Administracion para Centros de Formacion en Trabajo Seguro en Alturas. Marco normativo (Resolucion 4272/2021).

2. **Modulos funcionales** -- Tabla con los 11 modulos:
   - Dashboard, Personas, Empresas, Matriculas, Cursos, Niveles de Formacion, Gestion de Personal, Gestion de Formatos, Portal Estudiante (Admin + Publico), Certificacion, Cartera

3. **Stack tecnologico** -- React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui (Radix), React Router v6, TanStack React Query v5, React Hook Form + Zod, Zustand, dnd-kit, Recharts, react-signature-canvas, date-fns

4. **Arquitectura** -- Frontend-first con backend emulado (mock services con delays simulados). Patron: Pages → Hooks (React Query) → Services → Mock Data. Preparado para migracion a API REST real.

5. **Estructura del proyecto** -- Arbol simplificado de carpetas clave:
   - `src/pages/` (12 secciones)
   - `src/components/` (modulo-specific + shared + ui)
   - `src/services/` (20 servicios)
   - `src/hooks/` (15 hooks)
   - `src/types/` (11 tipos)
   - `src/data/` (mock data + catalogos)
   - `src/utils/` (utilidades)
   - `Docs/` (documentacion tecnica)

6. **Instalacion y desarrollo** -- Instrucciones npm/bun para clonar, instalar dependencias, ejecutar dev server, build y tests.

7. **Documentacion adicional** -- Referencias a `Docs/DOCUMENTACION_SISTEMA.md` (manual tecnico v1.8) y `REGLAS_NEGOCIO_v3.md` (190+ reglas de negocio).

8. **Despliegue** -- Via Lovable (Share → Publish). URL publicada: cefih.lovable.app

### Archivo afectado

| Archivo | Cambio |
|---|---|
| `README.md` | Reescritura completa |

### Notas
- Se mantiene en espanol consistente con el resto del proyecto
- No se incluyen credenciales ni datos sensibles
- Se preserva la referencia a Lovable como plataforma de desarrollo

