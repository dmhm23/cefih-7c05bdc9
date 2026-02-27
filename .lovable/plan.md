

## Fix: Firma no habilita envío + mejora UI botón Limpiar

### Causa raíz

En `FirmaCaptura`, `onBegin` llama `setIsEmpty(false)` y luego `onEnd` llama `handleEnd`. Pero `handleEnd` usa el estado `isEmpty` que aún es `true` en el closure del primer trazo (React no ha re-renderizado). Por eso `onGuardar` nunca se ejecuta en el primer trazo y `firmaBase64` queda `null`.

### Cambios

#### `src/components/matriculas/FirmaCaptura.tsx`

1. **Agregar un `useRef` para rastrear vacío** — `isEmptyRef` se actualiza sincrónicamente, sin depender del ciclo de render.
2. **`onBegin`**: setear `isEmptyRef.current = false` además de `setIsEmpty(false)`.
3. **`handleEnd`**: usar `!isEmptyRef.current` en vez de `!isEmpty`.
4. **`handleClear`**: setear `isEmptyRef.current = true`.
5. **Mejora UI botón Limpiar**: cuando hay firma (`!isEmpty`), mostrar variante `destructive` outline para que se note visualmente el cambio de estado (de gris deshabilitado a rojo activo).

