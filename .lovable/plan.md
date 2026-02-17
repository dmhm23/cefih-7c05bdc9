## Tres mejoras en la vista de detalle de Matricula

### 1. Modal de persona al hacer clic en el nombre del estudiante

**Problema:** Al hacer clic en el nombre del estudiante (linea 214-219 de `MatriculaDetallePage.tsx`), se navega a `/personas/:id`, sacando al usuario de la vista de matricula.

**Solucion:** Reemplazar la navegacion por un `Dialog` que muestre los datos personales del estudiante (datos de identificacion, contacto, contacto de emergencia) directamente en un modal, sin salir de la vista actual, en caso que se edite, entonces que le sea redirigido, al guardar cambios que le permita regresar facilmente a la matricula que estaba antes.

**Archivo:** `src/pages/matriculas/MatriculaDetallePage.tsx`

- Agregar estado `personaModalOpen` (boolean).
- Cambiar el `onClick` del div del estudiante para abrir el modal en vez de navegar.
- Agregar un `Dialog` con los datos de la persona (`persona` ya esta disponible via `usePersona`), mostrando: tipo/numero de documento, nombres, apellidos, genero, fecha nacimiento, email, telefono, contacto de emergencia.
- Incluir un enlace "Ver perfil completo" al final del modal que si lleve a `/personas/:id` si el usuario lo desea.
- Agregar `DialogTitle` y `DialogDescription` para resolver el error de accesibilidad que aparece en consola.

---

### 2. Reemplazar icono de "actualizar" por texto claro

**Problema:** En los cards de documentos, el icono `RefreshCw` (linea 281-284 de `DocumentosCarga.tsx`) no comunica su funcion. Parece un boton de "actualizar/refrescar" en vez de "reemplazar archivo".

**Solucion:** Agregar texto "Eliminar" junto al icono para que la accion sea explicita.

**Archivo:** `src/components/matriculas/DocumentosCarga.tsx`

- En linea 282, cambiar el div que solo muestra `<RefreshCw />` para incluir el texto "Eliminar" al lado del icono de 'x', usando el mismo estilo que el boton "Cargar" de documentos pendientes.
- Que las opciones estén contenidas en un botón con icono 'dotshorizontales'  que desplegue un dropdown con opcion como eliminar, vista previa.

---

### 3. Vista previa de documentos: solucion al bloqueo de Chrome

**Problema:** La vista previa usa `<iframe src={blobURL}>` para PDFs (linea 176). Chrome bloquea la carga de blob URLs en iframes dentro de contextos sandboxed (como el iframe de preview de Lovable), mostrando "This page has been blocked by Chrome".

**Solucion tecnica:** Reemplazar el `<iframe>` por un `<object>` con fallback, y para el caso de que tambien falle, convertir el blob a Data URL (base64) que no tiene restricciones de sandboxing. Adicionalmente, agregar un boton "Abrir en nueva pestaña" como alternativa garantizada.

**Archivo:** `src/components/matriculas/DocumentosCarga.tsx`

Cambios en la funcion `storePreview`:

- Leer el archivo como Data URL (`FileReader.readAsDataURL`) en vez de usar `URL.createObjectURL`.
- Almacenar el Data URL en el estado `previews`, eliminando la necesidad de blob URLs.
- Esto resuelve el bloqueo de Chrome ya que los Data URLs no estan sujetos a las mismas restricciones de sandboxing.

Cambios en `renderPreviewPanel`:

- Usar el Data URL directamente en el `<iframe>` para PDFs.
- Agregar un boton "Abrir en nueva pestaña" (`window.open(dataUrl)`) como alternativa.
- Mantener el fallback para imagenes y otros tipos de archivo.

Limpiar el `URL.revokeObjectURL` ya que con Data URLs no es necesario.

---

### Detalle tecnico

`**src/pages/matriculas/MatriculaDetallePage.tsx`:**

- Nuevo estado: `personaModalOpen`.
- Nuevo `Dialog` con `DialogTitle` + `DialogDescription` (resuelve los warnings de accesibilidad de consola).
- Contenido del modal: grid con los campos de la persona usando etiquetas y valores (solo lectura, no editable desde aqui).

`**src/components/matriculas/DocumentosCarga.tsx`:**

- Linea 282: agregar texto "Reemplazar" al icono.
- Funcion `storePreview`: cambiar de `URL.createObjectURL` a `FileReader.readAsDataURL`.
- Eliminar llamadas a `URL.revokeObjectURL` (no aplican con Data URLs).
- Actualizar `renderPreviewPanel` para usar Data URLs y agregar boton de abrir en nueva pestana.
- Aplicar el mismo cambio para `consolidadoPreview`.