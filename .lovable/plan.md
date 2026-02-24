

## Parte 3 -- Integracion con Matriculas (render dinamico desde configuracion)

### Objetivo

Reemplazar las listas hardcodeadas de formatos en `MatriculaDetallePage.tsx` y `MatriculaDetailSheet.tsx` por una consulta dinamica al servicio `formatoFormacionService.getForMatricula(tipoCurso)`. Los 4 formatos legacy siguen usando sus componentes hardcodeados existentes (via `legacyComponentId`), pero ahora se resuelven dinamicamente segun el tipo de curso.

---

### Cambio 1: Resolver formatos dinamicamente en MatriculaDetallePage

**Archivo:** `src/pages/matriculas/MatriculaDetallePage.tsx`

- Importar `useFormatosMatricula` de `@/hooks/useFormatosFormacion`.
- Llamar `useFormatosMatricula(curso?.tipoFormacion)` para obtener los formatos aplicables.
- Reemplazar el array literal hardcodeado (lineas 746-770) por un `.map()` sobre los formatos devueltos por el hook.
- Para determinar el `estado` de cada formato:
  - Si tiene `legacyComponentId === 'evaluacion_reentrenamiento'`: usa `matricula.evaluacionCompletada`.
  - Para los demas legacy: usa `(!matricula.autorizacionDatos || !matricula.firmaCapturada)` como borrador.
- Para el `onPreview`: mapear `formato.legacyComponentId` al `previewFormato` state (mantiene el switch existente de dialogs legacy).
- Los dialogs de preview legacy (lineas 837-864) se mantienen sin cambios.

---

### Cambio 2: Resolver formatos dinamicamente en MatriculaDetailSheet

**Archivo:** `src/components/matriculas/MatriculaDetailSheet.tsx`

- Mismo patron: importar `useFormatosMatricula`, llamar con `curso?.tipoFormacion`.
- Reemplazar el array hardcodeado (lineas 554-560) por la lista dinamica.
- Misma logica de `estado` y `onPreview` que en el cambio 1.
- Los dialogs de preview legacy (lineas 698-725) se mantienen sin cambios.

---

### Cambio 3: Actualizar FormatosList para aceptar el nuevo formato de datos

**Archivo:** `src/components/matriculas/formatos/FormatosList.tsx`

- Actualizar la interfaz `FormatoItem` para incluir `codigo?: string` (mostrar codigo del formato si existe).
- Sin cambios funcionales mayores; la interfaz sigue recibiendo `id`, `nombre`, `estado`.

---

### Cambio 4: Agregar helper de estado en un util compartido

Para evitar duplicar la logica de resolucion de estado entre las dos vistas, crear una funcion helper:

```typescript
// En un archivo util o inline
function resolveFormatoEstado(
  formato: FormatoFormacion, 
  matricula: Matricula
): EstadoFormato {
  if (formato.legacyComponentId === 'evaluacion_reentrenamiento') {
    return matricula.evaluacionCompletada ? 'completo' : 'borrador';
  }
  if (formato.legacyComponentId) {
    return (!matricula.autorizacionDatos || !matricula.firmaCapturada) 
      ? 'borrador' : 'completo';
  }
  return 'borrador'; // formatos nuevos: pendiente por defecto
}
```

Esta funcion se definira inline o en un util ligero y se usara en ambos archivos.

---

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Reemplazar array hardcodeado por query dinamica con `useFormatosMatricula` |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Reemplazar array hardcodeado por query dinamica con `useFormatosMatricula` |
| `src/components/matriculas/formatos/FormatosList.tsx` | Agregar `codigo` opcional a la interfaz |

### Lo que NO cambia en esta parte

- Los 4 componentes Document y PreviewDialog legacy permanecen intactos.
- La persistencia de respuestas sigue en campos planos de `Matricula`.
- No se construye aun el renderer generico de bloques (eso sera Parte futura).
- El mapeo `legacyComponentId` a dialog especifico se mantiene como puente.

