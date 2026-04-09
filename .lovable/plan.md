

# Plan: Generar automáticamente el número del curso

## Problema

El campo "Número del Curso" es manual. Debe generarse automáticamente con la estructura `{prefijo}{sep}{codigoTipoFormacion}{sep}{anio2d}{sep}{mes2d}{sep}{consecutivo}` usando la configuración del nivel de formación seleccionado y la fecha de inicio.

## Solución

### 1. `src/services/cursoService.ts` — Nuevo método para contar cursos del mismo nivel/mes/año

```typescript
async countByNivelAndMonth(nivelFormacionId: string, year: number, month: number): Promise<number> {
  // Consulta cursos del mismo nivel cuya fecha_inicio cae en el mismo año y mes
  const startOfMonth = `${year}-${String(month).padStart(2,'0')}-01`;
  const endOfMonth = new Date(year, month, 0).toISOString().slice(0,10); // último día del mes
  
  const { count, error } = await supabase
    .from('cursos')
    .select('id', { count: 'exact', head: true })
    .eq('nivel_formacion_id', nivelFormacionId)
    .is('deleted_at', null)
    .gte('fecha_inicio', startOfMonth)
    .lte('fecha_inicio', endOfMonth);
    
  if (error) handleSupabaseError(error);
  return count ?? 0;
}
```

### 2. `src/pages/cursos/CursoFormPage.tsx` — Generar código automáticamente

- Agregar función `generarNumeroCurso(nivelId, fechaInicio)` que:
  1. Obtiene la `ConfiguracionCodigoEstudiante` del nivel seleccionado
  2. Llama a `cursoService.countByNivelAndMonth(nivelId, year, month)`
  3. Construye el código: `prefijo + sep + codigoTipoFormacion + sep + año2d + sep + mes2d + sep + consecutivo`
  4. Hace `form.setValue("numeroCurso", codigoGenerado)`

- Ejecutar `generarNumeroCurso` cuando cambia el nivel (`handleTipoFormacionChange`) o la fecha de inicio
- Cambiar el campo `numeroCurso` en el formulario a `disabled` con `className="bg-muted"`
- Mantener el texto descriptivo "Calculado automáticamente"
- Relajar la validación zod de `numeroCurso` a `.optional()` (se genera internamente, no requiere input del usuario)

### 3. Lógica del consecutivo

```
cursosExistentes = await cursoService.countByNivelAndMonth(nivelId, 2026, 4);
// Si hay 4 cursos previos → consecutivo = 05
consecutivo = String(cursosExistentes + 1).padStart(2, '0');
```

### 4. Ejemplo de resultado

Nivel con config: `prefijo="FIH"`, `codigoTipoFormacion="TA"`, `separador="-"`
Fecha inicio: 2026-04-09, 4 cursos previos ese mes → `FIH-TA-26-04-05`

## Lo que NO se afecta

- La lógica del código de estudiante (`generarCodigoEstudiante`) permanece intacta
- El `numeroCurso` se persiste en el campo `nombre` del curso como ya ocurre
- La `ConfiguracionCodigoEstudiante` del nivel sigue usándose también para el código de estudiante

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/services/cursoService.ts` | Nuevo método `countByNivelAndMonth` |
| `src/pages/cursos/CursoFormPage.tsx` | Auto-generar código, campo readonly, recalcular en cambio de nivel/fecha |

**Total: 2 archivos editados, 0 migraciones**

