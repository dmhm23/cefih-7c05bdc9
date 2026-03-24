

## Plan: Sincronizar columna "Nivel Formación" en la tabla de Matrículas

### Problema
En `src/pages/matriculas/MatriculasPage.tsx` (línea 324), la columna "Nivel Formación" usa el diccionario estático `NIVEL_FORMACION_EMPRESA_LABELS[m.empresaNivelFormacion]`, por lo que no refleja los cambios dinámicos de nombres.

### Cambio

**`src/pages/matriculas/MatriculasPage.tsx`**:
1. Importar `resolveNivelFormacionLabel` desde `@/utils/resolveNivelLabel`
2. En la columna `nivelFormacion` (línea 322-325), reemplazar `NIVEL_FORMACION_EMPRESA_LABELS[m.empresaNivelFormacion]` por `resolveNivelFormacionLabel(m.empresaNivelFormacion)`
3. Limpiar el import de `NIVEL_FORMACION_EMPRESA_LABELS` si ya no se usa en ningún otro lugar del archivo

