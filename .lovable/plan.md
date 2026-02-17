&nbsp;

## **Mejoras en “Documentos Requeridos” - Modo Individual**

&nbsp;

&nbsp;

&nbsp;

### **Problema actual**

&nbsp;

&nbsp;

En el modo **Consolidado**, solo se muestran los documentos con estado “pendiente” en la lista de chequeo, ocultando los ya cargados o verificados. El usuario solicita que al cambiar a modo **Individual**, se muestre la lista completa de **todos los documentos** (incluyendo los ya cargados/verificados) como checklist, y que los campos de **Fecha examen** e **Inicio cobertura** siempre sean visibles para los documentos correspondientes.

&nbsp;

Adicionalmente, en el modo **Consolidado**, el componente de carga de archivo únicamente se activa cuando el usuario selecciona algún documento del checklist. Se solicita que, al hacer clic en **Documento Consolidado**, se muestren simultáneamente el checklist completo y el componente de **Cargar archivo**, sin depender de la selección previa de ítems.

&nbsp;

También se requiere incorporar una **vista previa del documento cargado**, permitiendo visualizar el archivo antes o después de la carga.

&nbsp;

Por otra parte, el botón tipo switch para alternar entre **Consolidado** e **Individual** no es comprensible a primera vista y genera confusión. La opción actual no comunica claramente el modo activo ni el impacto del cambio. Se debe mejorar la interfaz de esta opción para que sea de fácil comprensión, más explícita en su comportamiento y visualmente clara respecto al estado seleccionado.

### **Cambios propuestos**

**Archivo:** src/components/matriculas/DocumentosCarga.tsx

1. **Modo Individual - Mostrar todos los documentos**: Ya muestra todos los documentos. Se mantiene este comportamiento sin filtrar por estado.
2. **Modo Consolidado - Mostrar TODOS los documentos en el checklist**: Cambiar la línea que filtra solo documentos pendientes (documentos.filter(d => d.estado === "pendiente")) para que muestre **todos los documentos**, indicando visualmente cuáles ya están cargados o verificados (con su badge de estado junto al nombre). Los documentos ya cargados se mostrarán con el checkbox deshabilitado y una indicación de su estado actual.
3. **Campos de fecha siempre visibles**: Los campos “Fecha examen” (para examen_medico) e “Inicio cobertura” (para arl) se mostrarán en ambos modos (individual y consolidado) para los documentos que correspondan, sin importar su estado actual.
4. **Mostrar checklist y carga consolidada simultáneamente**: En el modo consolidado, al seleccionar la opción **Documento Consolidado**, se debe renderizar al mismo tiempo el checklist completo y el componente de carga de archivo. Se debe eliminar la lógica que condiciona la visualización del cargador a la selección previa de documentos en el checklist.
5. **Vista previa del documento cargado**: Incorporar un componente de vista previa que permita visualizar el archivo cargado (preferiblemente mediante un visor embebido si es PDF). En caso de no ser PDF, mostrar al menos el nombre del archivo y permitir su descarga. La vista previa debe actualizarse automáticamente cuando el usuario seleccione o reemplace el archivo.
6. **Mejora de UI en selector Consolidado / Individual**: Reemplazar el switch actual por un componente más claro (por ejemplo, tabs segmentadas o botones tipo toggle con labels visibles), asegurando que:
  &nbsp;
  - El modo activo esté claramente resaltado.
  - Exista una etiqueta descriptiva que explique qué significa cada modo.
  - El usuario entienda de inmediato el efecto del cambio sin necesidad de interacción previa.
  &nbsp;

### **Detalle técnico**

- **Línea 154**: Eliminar el filtro .filter(d => d.estado === "pendiente") en el modo consolidado, reemplazándolo por documentos completo.
- Agregar junto a cada checkbox en consolidado la badge de estado (Cargado / Verificado) si el documento ya no está pendiente, y deshabilitar el checkbox para esos casos.
- En el modo consolidado, agregar los inputs de fecha para examen_medico y arl debajo de cada ítem correspondiente, usando la misma lógica de onFechaChange que ya existe en el modo individual.
- El componente “Cargar PDF consolidado” debe renderizarse siempre que el modo sea consolidado, sin depender de la selección del checklist.
- Agregar estado local para almacenar el archivo seleccionado y renderizar un visor (iframe u otro componente equivalente) para la vista previa del documento cargado.
- Reemplazar el componente switch actual por un selector visual más explícito (tabs o segmented control), manteniendo la misma lógica interna de estado (modo) pero mejorando su representación visual.

&nbsp;