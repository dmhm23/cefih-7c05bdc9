

# Plan: Corregir edición en un solo clic en EditableField

## Diagnóstico

Hay dos problemas en `EditableField`:

1. **Campos de texto**: El auto-focus depende de un `useEffect` que verifica `inputRef.current`. Cuando React re-renderiza al cambiar `isEditing` a `true`, hay una ventana donde el ref puede no estar listo, forzando un segundo clic. La solución es agregar `autoFocus` directamente al `<Input>`, que es más confiable que el `useEffect`.

2. **Campos de moneda (currency)**: Doble problema:
   - No se pasa ningún `ref` al `<CurrencyInput>`, por lo que nunca recibe foco automáticamente.
   - El `onChange` ejecuta `setIsEditing(false)` inmediatamente, cerrando el campo al primer cambio de valor. Debería usar el mismo patrón `onBlur` que los campos de texto.

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/shared/EditableField.tsx` | **1)** Agregar `autoFocus` al `<Input>` del tipo `text` (línea 129) como respaldo al `useEffect`. **2)** En el tipo `currency`: crear un `currencyRef` con `useRef`, pasarlo al `<CurrencyInput>`, agregar `autoFocus`, y reemplazar el `onChange` que cierra la edición por un patrón `onBlur`/`onKeyDown` (Enter para confirmar, Escape para cancelar), manteniendo el valor local hasta que se confirme. |

**Total: 1 archivo editado, 0 migraciones**

## Detalle técnico

### Tipo `text` — agregar `autoFocus`
```tsx
<Input
  ref={inputRef}
  autoFocus
  value={localValue}
  ...
/>
```

### Tipo `currency` — refactorizar a patrón onBlur
```tsx
<CurrencyInput
  ref={currencyRef}
  autoFocus
  value={localNumValue}
  onChange={(v) => setLocalNumValue(v)}  // solo actualiza estado local
  onBlur={() => {
    onChange(String(localNumValue ?? 0));
    setIsEditing(false);
  }}
  onKeyDown={handleCurrencyKeyDown}  // Enter → confirmar, Escape → cancelar
  placeholder="0"
  className="h-8 text-sm"
/>
```

Esto requiere agregar `onBlur` y `onKeyDown` como props opcionales a `CurrencyInput` (se pasan directamente al `<Input>` interno).

