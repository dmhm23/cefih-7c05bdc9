

# Plan: Calcular duración de curso de forma inclusiva (inicio y fin cuentan)

## Problema

`differenceInCalendarDays(fin, inicio)` retorna 0 cuando ambas fechas son iguales. La regla de negocio requiere conteo inclusivo: mismo día = 1 día, dos días consecutivos = 2 días. La corrección es sumar 1 al resultado en todos los puntos de cálculo.

## Solución

Cambiar `dias` a `dias + 1` en los 3 lugares donde se calcula:

1. **`CursoFormPage.tsx` línea 163-164**: `if (dias >= 0) form.setValue("duracionDias", dias + 1);`
2. **`CursoFormPage.tsx` línea 380-381**: `return dias >= 0 ? dias + 1 : 0;`
3. **`CourseInfoCard.tsx` línea 57-58**: `return dias >= 0 ? dias + 1 : 0;`

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/cursos/CursoFormPage.tsx` | `+ 1` en ambos cálculos de duración |
| `src/components/cursos/CourseInfoCard.tsx` | `+ 1` en cálculo de duración |

**Total: 2 archivos editados, 0 migraciones**

