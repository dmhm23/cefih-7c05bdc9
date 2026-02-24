## Parte 0 -- Diagnostico de Formatos Existentes

### Hallazgos

#### Arquitectura actual de los formatos

Cada formato es un **componente React hardcodeado** con su propio Document + PreviewDialog. No existe ningun schema JSON, base de datos de bloques, ni plantilla PDF estatica.


| #   | Formato                    | Codigo    | Document Component                                   | Preview Dialog                               | Datos guardados en                                                                                                   |
| --- | -------------------------- | --------- | ---------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Informacion del Aprendiz   | FIH04-013 | `InfoAprendizDocument.tsx` (486 lineas)              | `InfoAprendizPreviewDialog.tsx`              | Campos directos en `Matricula`: autoevaluacionRespuestas, evaluacionCompetenciasRespuestas, salud, autorizacionDatos |
| 2   | Registro de Asistencia     | FIH04-014 | `RegistroAsistenciaDocument.tsx`                     | `RegistroAsistenciaPreviewDialog.tsx`        | Solo firma de matricula + fecha local en el dialog (no persiste)                                                     |
| 3   | Participacion PTA-ATS      | FIH04-077 | `ParticipacionPtaAtsDocument.tsx`                    | `ParticipacionPtaAtsPreviewDialog.tsx`       | Solo firma de matricula (sin datos propios)                                                                          |
| 4   | Evaluacion Reentrenamiento | FIH04-019 | `EvaluacionReentrenamientoDocument.tsx` (810 lineas) | `EvaluacionReentrenamientoPreviewDialog.tsx` | evaluacionRespuestas, evaluacionPuntaje, encuestaRespuestas en `Matricula`                                           |


#### Como se resuelven los formatos en Matricula

En `MatriculaDetallePage.tsx` (lineas 746-770), los 4 formatos estan **hardcodeados como un array literal** pasado a `FormatosList`:

```
formatos={[
  { id: "info_aprendiz", nombre: "...", estado: ... },
  { id: "registro_asistencia", ... },
  { id: "participacion_pta_ats", ... },
  { id: "evaluacion_reentrenamiento", ... },
]}
```

Cada `id` dispara un Dialog especifico (lineas 837-864) mediante un switch implicito sobre `previewFormato`.

#### Como se genera el PDF

No hay generacion real de PDF. Cada PreviewDialog usa `window.open()` + `document.write()` con estilos CSS inline (`PRINT_STYLES`) para abrir una ventana de impresion del navegador. El contenido se extrae via `documentRef.current.innerHTML`.

#### Donde viven las respuestas

Todas las respuestas se guardan **directamente en el objeto `Matricula**` como campos planos:

- `autoevaluacionRespuestas: string[]`
- `evaluacionCompetenciasRespuestas: string[]`
- `evaluacionRespuestas: number[]` (indices de opcion por pregunta)
- `evaluacionPuntaje: number`
- `encuestaRespuestas: string[]`
- Campos de salud: `restriccionMedica`, `alergias`, etc.
- `autorizacionDatos`, `firmaCapturada`, `firmaBase64`

No existe una tabla separada de "respuestas por formato".

#### Tipo existente `FormatoDocumento`

En `src/types/formato.ts` existe un tipo minimo:

```typescript
type EstadoFormato = 'borrador' | 'completo';
interface FormatoDocumento {
  id: string; nombre: string; estado: EstadoFormato;
  tipo: 'info_aprendiz' | 'registro_asistencia' | 'participacion_pta_ats';
}
```

Este tipo solo se usa en `FormatosList` como interfaz de presentacion. No hay servicio, no hay mock data, no hay CRUD.

---

### Decision de estrategia: Estrategia A (Migracion a schema de bloques)

**Razon:** Los 4 formatos actuales son componentes monoliticos sin separacion datos/presentacion. Envolverlos con un adaptador (Estrategia B) crearia complejidad innecesaria ya que los componentes mezclan logica interactiva (RadioGroups, selects de salud, auto-save) con layout de impresion.

**Estrategia elegida:**

1. Crear el modelo de `FormatoFormacion` con `bloques[]` como schema declarativo.
2. Migrar los 4 formatos existentes como registros pre-cargados en mock data, cada uno con su array de bloques que describe su estructura.
3. Construir un renderer generico que interpreta bloques y genera la misma UI que hoy producen los componentes hardcodeados.
4. Los componentes Document/PreviewDialog actuales se mantienen temporalmente como fallback hasta que el renderer cubra toda su funcionalidad, momento en que se eliminan.

**Beneficios:**

- Los nuevos formatos se crean desde UI sin codigo.
- Los 4 existentes quedan bajo la misma arquitectura.
- La persistencia de respuestas se desacopla de `Matricula` hacia una tabla independiente `FormatoRespuesta`.

**Riesgo mitigado:** Los componentes legacy siguen funcionando durante la migracion; solo se retiran cuando el renderer los reemplaza completamente.

---

### Proximos pasos (Parte 1)

Con este diagnostico completo, la Parte 1 procedera a:

1. Definir `FormatoFormacion` y `Bloque` como tipos TypeScript.
2. Crear `formatoFormacionService.ts` con CRUD mock.
3. Pre-cargar los 4 formatos como registros con bloques.
4. Crear hooks React Query.
5. No tocar UI existente de Matriculas aun.