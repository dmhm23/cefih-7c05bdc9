

## Plan: Configuración de código de estudiante en Niveles + columna Código en Cursos

### Resumen

Agregar un bloque de configuración de código de estudiante dentro de Niveles de Formación, y mostrar el código resuelto automáticamente en la tabla de matriculados del curso.

---

### Cambios

#### 1. `src/types/nivelFormacion.ts` — Nueva interfaz

Agregar `ConfiguracionCodigoEstudiante`:

```typescript
export interface ConfiguracionCodigoEstudiante {
  prefijoCodigo: string;           // Ej: "FIH"
  codigoTipoFormacion: string;     // Ej: "R", "A", "C", "J"
  separadorCodigo: string;         // Ej: "-"
  longitudConsecutivoEstudiante: number; // >= 2
  usarAnioCurso: boolean;
  usarMesCurso: boolean;
  usarConsecutivoCursoMes: boolean;
  activo: boolean;
}
```

Agregar a `NivelFormacion`:
```typescript
configuracionCodigoEstudiante?: ConfiguracionCodigoEstudiante;
```

Agregar constante con valores por defecto para facilitar la inicialización.

#### 2. `src/data/mockData.ts` — Agregar configuración a mocks

Agregar `configuracionCodigoEstudiante` a los 4 niveles mock existentes con valores representativos (prefijo "FIH", código "R"/"J"/"A"/"C" según nivel).

#### 3. `src/pages/niveles/NivelFormPage.tsx` — Nueva sección de formulario

Agregar una **Card "Configuración de Código de Estudiante"** entre Observaciones y los botones de acción:

- Switch para activar/desactivar la configuración
- Inputs: prefijo, código tipo formación, separador
- Input numérico: longitud consecutivo (min 2)
- Switches: usar año, usar mes, usar consecutivo curso/mes
- **Preview en tiempo real** del código generado (read-only), calculado con datos de ejemplo
- Texto de ayuda explicando qué partes son fijas y cuáles vienen del curso/estudiante
- Los campos se manejan como estado local (igual que `camposAdicionales`) y se incluyen en el payload de create/update

#### 4. `src/pages/niveles/NivelDetallePage.tsx` — Mostrar configuración

Agregar una Card de solo lectura "Código de Estudiante" mostrando la configuración actual con el preview del formato. Si no está configurada, mostrar "Sin configurar".

#### 5. `src/utils/codigoEstudiante.ts` — Nuevo archivo: lógica de generación

Función `generarCodigoEstudiante(config, curso, indexEstudiante, consecutivoCurso)` que construye el código completo. Ejemplo: `FIH-R-26-01-01-0001`.

Función `generarPreviewCodigo(config)` que genera un ejemplo con datos ficticios para el preview del formulario.

#### 6. `src/components/cursos/EnrollmentsTable.tsx` — Nueva columna "Código"

- Agregar columna "Código" después de "Nombre"
- Consumir el nivel de formación del curso vía `useNivelFormacion` (el curso tiene `tipoFormacion` que se mapea al nivel)
- Para cada matrícula, calcular el código usando `generarCodigoEstudiante` con la config del nivel
- Estados visuales:
  - Código disponible: texto monoespaciado normal
  - Config faltante: Badge "Sin regla" en gris
  - Config desactivada: Badge "Desactivado" en gris

#### 7. `src/services/nivelFormacionService.ts` — Sin cambios estructurales

El service ya maneja `...data` en create/update, por lo que `configuracionCodigoEstudiante` se persiste automáticamente.

---

### Detalle técnico

**Preview del código en NivelFormPage**: Se calcula en un `useMemo` que toma los valores actuales de la configuración y genera un string de ejemplo. Formato:

```
[prefijo][sep][codigoTipo][sep][año?][sep][mes?][sep][consecutivoCurso?][sep][consecutivoEstudiante]
```

Partes opcionales se omiten si los switches correspondientes están desactivados.

**Resolución del código en EnrollmentsTable**: El índice del estudiante en el array de `matriculas` del curso (ordenado por fecha de creación) determina el consecutivo. El consecutivo del curso en el mes se calcula desde `numeroCurso` o se usa un valor fijo por ahora (futuro: backend lo provee).

**No se modifica** `generarCodigoCertificado` existente; esa función es para certificados. Esta nueva función es para códigos de participante/estudiante.

