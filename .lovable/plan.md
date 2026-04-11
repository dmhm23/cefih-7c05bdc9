
# Plan: Eliminar tarjeta de Acciones vacía en MatriculaDetallePage

## Análisis

La tarjeta "Acciones" (líneas 1014-1032) tiene los siguientes problemas:

1. **Botones condicionales que rara vez aparecen**: Los botones "Marcar como Completa" y "Generar Certificado" dependen de estados específicos (`pendiente` con 100% progreso, o `completa`) que no siempre se cumplen.

2. **Botón sin funcionalidad**: El botón "Ver Historial" siempre aparece pero tiene un handler vacío (`onClick` no definido), lo que lo hace no funcional.

3. **Sección vacía en la mayoría de casos**: Para la mayoría de matrículas, esta sección solo muestra un botón sin funcionalidad, ocupando espacio visual innecesario.

## Cambio

| Archivo | Líneas | Acción |
|---------|--------|--------|
| `src/pages/matriculas/MatriculaDetallePage.tsx` | 1014-1032 | Eliminar el div completo de Acciones (incluyendo el comentario `{/* Acciones */}` y todo el contenido hasta el cierre `</div>`) |

**Total: 1 archivo editado, 0 migraciones**

## Verificación posterior

- Revisar que la estructura de columnas del layout (sidebar + contenido) siga siendo correcta.
- Confirmar que no hay referencias rotas ni imports sin usar relacionados con `handleCambiarEstado` si es el único uso (se usa también en `MatriculaDetailSheet.tsx`, por lo que debe mantenerse).
