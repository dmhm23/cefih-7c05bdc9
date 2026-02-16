

## Cambios en "Informacion del Aprendiz"

### 1. Eliminar campos de la seccion "Ficha de Matricula"

Se eliminaran los siguientes campos del grid:
- **Celular del estudiante** (linea 202)
- **EPS** (linea 215)
- **ARL** (linea 216)

Tambien se eliminaran las variables `epsDisplay` y `arlDisplay` (lineas 169-174) y los imports de `EPS_OPTIONS` y `ARL_OPTIONS` (linea 19) ya que dejan de usarse.

### 2. Redisenar la seccion "Autorizacion de Uso de Datos"

Reemplazar el bloque actual (lineas 317-321) que solo dice "Pendiente del estudiante" por una seccion interactiva con:

- Un **resumen en viñetas** con los 6 puntos clave de la autorizacion, redactados de forma clara y concisa.
- Un enlace **"Si lo desea, puede leer la informacion completa dando clic aqui"** que abre un `Dialog` con el texto legal completo proporcionado por el usuario.
- Un **Select dropdown** con opciones "Autorizo" (valor por defecto) y "No autorizo".
- La seccion mostrara la badge "Pendiente" mientras el estudiante no haya firmado (`firmaCapturada === false`).

### Detalles tecnicos

**Archivo modificado:** `src/components/matriculas/formatos/InfoAprendizDocument.tsx`

**Cambios especificos:**

1. **Imports**: Agregar `Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription` desde `@/components/ui/dialog`.

2. **Estado nuevo**: Agregar `autorizacionDatos` (boolean, default `true` = "Autorizo") y `showTextoCompleto` (boolean para controlar el dialog).

3. **Auto-save**: Incluir `autorizacionDatos` en el payload de `triggerSave`.

4. **Seccion Autorizacion (lineas 317-321)**: Reemplazar por:
   - Resumen con `ul` de 6 items (Datos Sensibles, Publicidad y Cobros, Prohibicion de Celulares, Salud y Seguridad, Firma Digital, Sus Derechos).
   - Enlace que abre el Dialog con el texto legal completo.
   - Select con "Autorizo" / "No autorizo", valor por defecto "Autorizo".
   - Badge "Pendiente" si `!matricula.firmaCapturada`.

5. **Dialog**: Contenedor modal con scroll para el texto legal completo (los literales a-i y la nota final).

6. **Eliminacion de campos**: Quitar `FieldCell` de celular, EPS y ARL del grid de Ficha de Matricula. Limpiar imports y variables no usadas.

