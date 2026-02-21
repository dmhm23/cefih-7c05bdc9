

## Correccion: Datos no visibles y columnas nuevas ausentes del dropdown

### Causa raiz

Los tres listados (Matriculas, Cursos, Personas) inicializan `columnConfig` desde localStorage asi:

```
const saved = localStorage.getItem(STORAGE_KEY);
return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
```

Si el usuario ya visito la pagina antes de que se agregaran las columnas nuevas, localStorage tiene una version anterior del config que **no incluye** las columnas nuevas. Como se usa directamente el valor guardado sin fusionarlo con `DEFAULT_COLUMNS`, las columnas nuevas:

1. **No aparecen en el dropdown** del `ColumnSelector` (porque este solo muestra lo que hay en `columnConfig`).
2. **No se renderizan en la tabla** (porque `DataTable` filtra con `columnConfig` y el fallback es `false`).

Adicionalmente, si el localStorage guardado tiene menos columnas que las que existen en el array `columns`, las columnas base originales que SI deberian mostrarse tampoco aparecen si por alguna razon no estan en el config guardado.

### Solucion

Crear una funcion utilitaria `mergeColumnConfig` que fusione el config guardado en localStorage con `DEFAULT_COLUMNS`, garantizando que:

- Columnas nuevas (presentes en DEFAULT pero no en el guardado) se agregan con su visibilidad por defecto (`false`).
- Columnas existentes conservan la visibilidad que el usuario eligio.
- Columnas que ya no existen en DEFAULT se eliminan (limpieza).

Aplicar esta funcion en la inicializacion del state de las tres paginas.

### Cambios por archivo

**1. `src/components/shared/DataTable.tsx`** - Sin cambios. La logica actual (fallback `false`) es correcta.

**2. `src/components/layout/MainLayout.tsx`** - Sin cambios. El `min-w-0` ya esta aplicado.

**3. `src/pages/matriculas/MatriculasPage.tsx`** - Cambiar la inicializacion de `columnConfig`:
```typescript
const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_COLUMNS;
  const parsed: ColumnConfig[] = JSON.parse(saved);
  // Merge: keep user preferences, add new columns, remove stale ones
  const savedKeys = new Set(parsed.map(c => c.key));
  const defaultKeys = new Set(DEFAULT_COLUMNS.map(c => c.key));
  const merged = DEFAULT_COLUMNS.map(def => {
    const existing = parsed.find(c => c.key === def.key);
    return existing ? { ...def, visible: existing.visible } : def;
  });
  return merged;
});
```

**4. `src/components/cursos/CursosListView.tsx`** - Mismo cambio de inicializacion.

**5. `src/pages/personas/PersonasPage.tsx`** - Mismo cambio de inicializacion.

### Resultado esperado

- Todas las columnas (originales y nuevas) aparecen en el dropdown del selector.
- Las columnas originales se muestran por defecto; las nuevas estan ocultas hasta que el usuario las active.
- Los datos de la tabla se muestran correctamente porque todas las columnas base estan presentes en el config.
- El scroll horizontal sigue contenido dentro de la tabla gracias a los cambios ya aplicados en `DataTable` y `MainLayout`.

