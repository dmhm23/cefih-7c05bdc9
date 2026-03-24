

## Plan: Sincronizar nombres de Niveles de Formación en todo el sistema

### Problema actual

Los cursos almacenan `tipoFormacion` como un valor enum hardcoded (`'reentrenamiento'`, `'jefe_area'`, etc.) y resuelven su nombre visible usando el diccionario estático `TIPO_FORMACION_LABELS`. Esto significa que si se renombra un nivel en el módulo de Niveles de Formación, el cambio no se refleja en cursos ni en otros módulos.

El formulario de creación de cursos **ya** usa `useNivelesFormacion()` y guarda el `id` del nivel, pero la visualización sigue usando el mapa hardcoded.

### Solución

Crear una utilidad centralizada `resolveNivelLabel(value)` que busque el nombre del nivel dinámicamente desde `mockNivelesFormacion`, con fallback al diccionario legacy. Reemplazar todas las ocurrencias de `TIPO_FORMACION_LABELS[x]` por esta utilidad o por datos del hook `useNivelesFormacion`.

### Archivos a modificar

#### 1. `src/utils/resolveNivelLabel.ts` (ya existe)
- Renombrar/extender para exportar también una función `resolveNivelCursoLabel(tipoFormacion)` que sirva para cursos (busca por id, luego por legacy key, fallback al valor crudo).

#### 2. Módulo Cursos (5 archivos) — reemplazar `TIPO_FORMACION_LABELS[curso.tipoFormacion]`
- **`CourseHeader.tsx`** (línea 23): usar `resolveNivelCursoLabel(curso.tipoFormacion)`
- **`CourseInfoCard.tsx`** (línea 46): usar resolución dinámica en `displayValue` y construir opciones desde `useNivelesFormacion`
- **`CursoDetailSheet.tsx`** (líneas 68, 194): idem, usar hook + resolución dinámica en título y campo editable
- **`CursosListView.tsx`** (líneas 86, 240): resolver label dinámicamente en tabla y en `getCursoLabel`
- **`CursosCalendarioView.tsx`**: reemplazar uso de `TIPO_FORMACION_LABELS`

#### 3. Certificación y formatos (2 archivos)
- **`PlantillasPage.tsx`** (línea 146): usar resolución dinámica
- **`FormatosPage.tsx`** (línea 36): idem

#### 4. Portal admin (3 archivos)
- **`NivelesHabilitacionGrid.tsx`**, **`DocumentosCatalogoTable.tsx`**, **`DocumentoConfigDialog.tsx`**: usar niveles dinámicos para headers y labels

#### 5. `src/utils/certificadoGenerator.ts` (línea 61)
- Reemplazar `TIPO_FORMACION_LABELS[curso.tipoFormacion]` por resolución dinámica

#### 6. `src/services/portalMonitoreoService.ts` (líneas 67, 107)
- Resolver label dinámicamente

### Detalle técnico

Nueva función en `resolveNivelLabel.ts`:

```ts
export function resolveNivelCursoLabel(value: string | undefined): string {
  if (!value) return "";
  // Buscar por ID en niveles dinámicos
  const byId = mockNivelesFormacion.find(n => n.id === value);
  if (byId) return byId.nombreNivel;
  // Buscar por nombre exacto
  const byName = mockNivelesFormacion.find(n => n.nombreNivel === value);
  if (byName) return byName.nombreNivel;
  // Fallback legacy
  const legacy: Record<string, string> = {
    jefe_area: "Jefe de Área",
    trabajador_autorizado: "Trabajador Autorizado",
    reentrenamiento: "Reentrenamiento",
    coordinador_ta: "Coordinador T.A.",
  };
  return legacy[value] || value;
}
```

En componentes React que necesiten construir opciones de select, se usará `useNivelesFormacion()` para generar las opciones dinámicamente (como ya hace `CursoFormPage`), reemplazando las opciones hardcoded de `TIPO_FORMACION_OPTIONS`.

