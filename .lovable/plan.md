

## Plan: Cambiar "Cambiar" → "Quitar" con icono X en rojo

### Cambio único en `src/pages/matriculas/MatriculaFormPage.tsx` (líneas 406-411)

Reemplazar el botón actual:
```tsx
<Button variant="ghost" size="sm" ...>
  Cambiar
</Button>
```

Por:
```tsx
<Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" ...>
  <X className="h-4 w-4 mr-1" />
  Quitar
</Button>
```

- Importar `X` de `lucide-react` (probablemente ya importado).
- Texto en rojo, icono X a la izquierda.
- Un solo archivo, una sola línea de cambio.

