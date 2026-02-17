

## Encabezado Reutilizable para Documentos de Formatos

### Resumen

Crear un componente reutilizable `DocumentHeader` que renderice un encabezado tipo grid/tabla estructurada para todos los documentos generados. Se implementara primero en el formato "Informacion del Aprendiz" con valores fijos que en el futuro seran editables desde un modulo "Formatos".

### Estructura visual del encabezado

```text
+-------------------+-------------------------------+---------------------------------------------+
|                   |                               | FREDDY IVAN HOYOS INSTRUCTORES Y            |
|    [LOGO]         |   INFORMACION DEL APRENDIZ    | FACILITADORES LTDA.                         |
|   (centrado       |   (centrado, mayusculas,      +---------------------------------------------+
|    vertical y     |    tipografia destacada)       | SISTEMA DE GESTION INTEGRADO                |
|   horizontalmente)|                               +---------------------------------------------+
|                   +---------------+---------------+ SUBSISTEMA: Alturas                         |
|                   | Codigo:       | Version:      +----------------------+----------------------+
|                   | FIH04-013     | 021           | CREACION: 22/03/2018 | EDICION: 17/02/2025  |
+-------------------+---------------+---------------+----------------------+----------------------+
```

### Archivos nuevos

**`src/assets/logo-empresa.png`**
- Copiar la imagen subida por el usuario al directorio de assets del proyecto

**`src/components/shared/DocumentHeader.tsx`**
- Componente reutilizable con las siguientes props:
  - `nombreDocumento`: string (ej: "INFORMACION DEL APRENDIZ")
  - `codigo`: string (ej: "FIH04-013")
  - `version`: string (ej: "021")
  - `fechaCreacion`: string (ej: "22/03/2018")
  - `fechaEdicion`: string (ej: "17/02/2025")
  - `empresaNombre`: string (valor por defecto fijo)
  - `sistemaGestion`: string (valor por defecto: "SISTEMA DE GESTION INTEGRADO")
  - `subsistema`: string (ej: "Alturas")
- Renderiza un grid de 3 columnas con bordes estilo tabla
- Bloque izquierdo: logo importado desde `@/assets/logo-empresa.png`, centrado en ambos ejes
- Bloque central: nombre del documento en mayusculas con tipografia destacada; fila inferior dividida en Codigo y Version
- Bloque derecho: filas apiladas con nombre de empresa (negrita, mayusculas), sistema de gestion, subsistema, y una fila dividida con fechas de creacion y edicion
- Usa clases CSS vanilla (no Tailwind) para compatibilidad con el sistema de impresion `window.print()`

### Archivos modificados

**`src/components/matriculas/formatos/InfoAprendizDocument.tsx`**
- Importar `DocumentHeader`
- Reemplazar el bloque actual del titulo (lineas 184-191, el `<div className="text-center mb-4">` con `<h1>` y subtitulo borrador) por el nuevo componente `<DocumentHeader>` con los valores:
  - nombreDocumento: "INFORMACION DEL APRENDIZ"
  - codigo: "FIH04-013"
  - version: "021"
  - fechaCreacion: "22/03/2018"
  - fechaEdicion: "17/02/2025"
  - subsistema: "Alturas"
- Mantener la logica de "Borrador" (marca de agua y subtitulo) debajo del encabezado

**`src/components/matriculas/formatos/InfoAprendizPreviewDialog.tsx`**
- Agregar estilos CSS para el encabezado en `PRINT_STYLES`:
  - `.doc-header`: grid de 3 columnas con bordes solidos
  - `.doc-header-logo`: celda del logo con centrado flex
  - `.doc-header-center`: celda central con nombre del documento
  - `.doc-header-right`: celda derecha con filas internas
  - Tipografias y espaciados consistentes con el resto del documento
  - `break-inside: avoid` para evitar corte en impresion

### Valores iniciales fijos

| Campo | Valor |
|-------|-------|
| Nombre documento | INFORMACION DEL APRENDIZ |
| Codigo | FIH04-013 |
| Version | 021 |
| Fecha creacion | 22/03/2018 |
| Fecha edicion | 17/02/2025 |
| Empresa | FREDDY IVAN HOYOS INSTRUCTORES Y FACILITADORES LTDA. |
| Sistema | SISTEMA DE GESTION INTEGRADO |
| Subsistema | Alturas |

Estos valores se mantendran como constantes/props por defecto hasta que se construya el modulo "Formatos" en el roadmap.

