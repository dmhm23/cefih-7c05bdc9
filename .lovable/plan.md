# Plan de correcciones del constructor de formatos (7 problemas)

## Diagnostico por problema

### 1. Error al guardar formato con `signature_capture`

**Causa raiz**: El `FormatoPreviewDocument.tsx` no tiene un case para `signature_capture` en su `renderBloque()`, lo que no causa el error de guardado directamente. El error de guardado probablemente viene de que el bloque `signature_capture` no tiene `codigo` ni `version` del bloque `document_header` propagados correctamente en `props` al momento del insert, o de la serializacion del logo en base64 dentro de `bloques` (JSONB) que puede exceder limites. Necesito verificar el error exacto en la red. Sin embargo, el preview si falla silenciosamente al no renderizar `signature_capture`.

**Solucion**: Agregar case `signature_capture` en `FormatoPreviewDocument.tsx`. Investigar y corregir el error de persistencia al guardar (probablemente el campo `logoUrl` en base64 dentro del JSON de bloques es demasiado grande para Supabase, o hay un tipo incompatible).

### 2. Consentimiento de salud guardado en matricula no disponible como token/campo automatico

**Causa raiz**: Los campos `consentimiento_salud`, `restriccion_medica`, `alergias`, `consumo_medicamentos`, `embarazo` de la tabla `matriculas` no estan en el `AUTO_FIELD_CATALOG` ni en `resolveAutoField.ts`. El bloque `health_consent` es un componente de captura, no un token de lectura de datos ya guardados.

**Solucion**: Agregar tokens de autocompletado para los campos de salud de la matricula: `consentimiento_salud`, `restriccion_medica` (si/no + detalle), `alergias` (si/no + detalle), `consumo_medicamentos` (si/no + detalle), `embarazo`. Agregar los cases correspondientes en `resolveAutoField.ts`.

### 3. Bloque `data_authorization` demasiado complejo — deberia ser un checkbox simple

**Causa raíz**: El bloque data_authorization tiene un inspector con **“Puntos del resumen”** —presentados como una lista ítem por ítem— y un campo de **“Texto completo”**. Sin embargo, el usuario quiere simplificar esta estructura, ya que solo necesita un párrafo para el texto legal y un checkbox para la aceptación.

**Solución**: El usuario decidió eliminar ese bloque y creará las autorizaciones directamente con el bloque **checkbox**. En su lugar, se propone añadir al bloque checkbox, dentro de propiedades, un campo de **descripción** antes del valor de la etiqueta, y también la posibilidad de habilitar mediante un **toggle** un **popover opcional** para incluir un texto más extenso. Esto permitiría mostrar la información completa cuando la descripción funcione solo como un resumen breve.

### 4. Cuatro tipos de firma: confusion sobre cual usar

**Causa raiz**: Coexisten `signature_aprendiz`, `signature_entrenador_auto`, `signature_supervisor_auto` (legacy) y `signature_capture` (nuevo). Los tres primeros son legacy y estan acoplados a nombres fijos. El nuevo `signature_capture` es el correcto y configurable.

**Solucion**: Eliminar los tres bloques legacy del catalogo (`BlockCatalog.tsx`), del inspector, de los tipos y del renderer. Solo debe quedar `signature_capture` con su configuracion de `tipoFirmante` y `mode`. Esto es parte de la eliminacion legacy que ya estaba prevista.

### 5. "Firmas requeridas" en configuracion del formato: se usa o se elimina?

**Causa raiz**: Los tres checkboxes `requiereFirmaAprendiz/Entrenador/Supervisor` en `FormatoConfigSheet.tsx` son metadata legacy que no se conecta con el motor dinamico de bloques. Con `signature_capture`, la informacion de que firmas se requieren ya esta implicita en los bloques del formato.

**Solucion**: Eliminar la seccion "Firmas Requeridas" de `FormatoConfigSheet.tsx` y los campos correspondientes del store/config. La presencia de bloques `signature_capture` en el formato determina que firmas se necesitan. Limpiar tambien las columnas de BD (`requiere_firma_aprendiz`, etc.) en una migracion futura, o simplemente dejar de usarlas.

### 6. Token `empresa_nivel_formacion` desactualizado

**Causa raiz**: En `autoFieldCatalog.ts` linea 29, existe `empresa_nivel_formacion` con label "Nivel de formacion empresa" que apunta a `matricula.empresaNivelFormacion` (campo legacy). Deberia apuntar a `matricula.nivelFormacionId` y resolver el nombre del nivel desde la tabla `niveles_formacion`.

**Solucion**: Renombrar el token a `nivel_formacion` con label "Nivel de formacion", actualizar `resolveAutoField.ts` para resolver desde `nivelFormacionId` consultando el nombre del nivel (ya hay logica parcial con `resolveNivelFormacionLabel`).

### 7. Vista previa muestra encabezado por defecto en vez del configurado en el bloque

**Causa raiz**: En `FormatoPreviewDocument.tsx` lineas 438-448, si el formato tiene `usaEncabezadoInstitucional` activado Y no detecta un bloque `document_header`, renderiza un `DocumentHeader` por defecto con datos estaticos. PERO: `DocumentHeader.tsx` siempre usa `logoEmpresa` importado de `@/assets/logo-empresa.png` (linea 1), ignorando completamente el `logoUrl` que el usuario configura en el bloque.

Cuando el usuario SI agrega un bloque `document_header` al canvas, el case en `renderBloque` (linea 401-417) renderiza `DocumentHeader` pasando `hp.empresaNombre`, `hp.sistemaGestion`, etc., pero **no pasa `logoUrl**` — el componente `DocumentHeader` no acepta `logoUrl` como prop, siempre usa el import estatico.

**Solucion**: Modificar `DocumentHeader.tsx` para aceptar un prop `logoUrl` opcional. Si se proporciona, usarlo en vez del import estatico. Luego en `FormatoPreviewDocument.tsx`, pasar `hp.logoUrl` al renderizar el bloque `document_header`. Tambien pasar `hp.borderColor` para que los bordes personalizados funcionen.

---

## Fases de implementacion

### Fase 1: Corregir errores criticos (guardado + preview)

1. Agregar case `signature_capture` en `FormatoPreviewDocument.tsx`
2. Modificar `DocumentHeader.tsx` para aceptar `logoUrl` y `borderColor` como props opcionales
3. Pasar `logoUrl` y `borderColor` desde el bloque `document_header` en el preview

### Fase 2: Simplificar bloques y eliminar legacy de firmas

1. Eliminar `signature_aprendiz`, `signature_entrenador_auto`, `signature_supervisor_auto` del catalogo, inspector, tipos, preview y renderer dinamico
2. Eliminar la seccion "Firmas Requeridas" de `FormatoConfigSheet.tsx`
3. Eliminar `requiereFirmaAprendiz/Entrenador/Supervisor` del store config (mantener en BD sin usar, para no romper datos existentes)

### Fase 3: Simplificar bloque de autorizacion de datos

1. Eliminar el bloque `data_authorization` del catalogo y tipos
2. Añadir al inspector  del bloque checkbox, dentro de propiedades, un campo de **descripción** antes del valor de la etiqueta, y también la posibilidad de habilitar mediante un **toggle** un **popover opcional** para incluir un texto más extenso.

### Fase 4: Tokens de salud y nivel de formacion

1. Agregar tokens de consentimiento de salud al `AUTO_FIELD_CATALOG`: `consentimiento_salud`, `restriccion_medica`, `alergias`, `consumo_medicamentos`, `embarazo` con sus detalles
2. Agregar los cases en `resolveAutoField.ts`
3. Actualizar el token `empresa_nivel_formacion` a `nivel_formacion` con resolucion desde `nivelFormacionId`

### Fase 5: Investigar y corregir error de guardado

1. Verificar si el logo en base64 dentro del JSONB de bloques causa problemas de tamano
2. Si es asi, implementar subida del logo a storage y guardar solo la URL publica en el bloque
3. Verificar errores de tipo en la serializacion

---

## Archivos que se modifican


| Archivo                                                 | Cambio                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/components/formatos/FormatoPreviewDocument.tsx`    | Agregar case `signature_capture`, pasar `logoUrl`/`borderColor` al header  |
| `src/components/shared/DocumentHeader.tsx`              | Aceptar `logoUrl` y `borderColor` opcionales                               |
| `src/components/formatos/editor/BlockCatalog.tsx`       | Eliminar 3 bloques legacy de firma, eliminar `data_authorization`          |
| `src/components/formatos/editor/InspectorFields.tsx`    | Eliminar inspectors legacy de firma, eliminar `DataAuthorizationInspector` |
| `src/components/formatos/editor/FormatoConfigSheet.tsx` | Eliminar seccion "Firmas Requeridas"                                       |
| `src/stores/useFormatoEditorStore.ts`                   | Eliminar `requiereFirma*` del config default                               |
| `src/data/autoFieldCatalog.ts`                          | Agregar tokens de salud, actualizar nivel de formacion                     |
| `src/utils/resolveAutoField.ts`                         | Agregar cases de salud, actualizar nivel                                   |
| `src/types/formatoFormacion.ts`                         | Eliminar tipos legacy de firma, limpiar `data_authorization`               |
| `src/data/bloqueConstants.ts`                           | Eliminar entries legacy                                                    |
| `src/data/tokenSources.ts`                              | Actualizar token de nivel                                                  |


### Archivos que NO se tocan

- Componentes legacy del portal (se mantienen hasta validacion e2e)
- Migraciones de BD (los campos legacy se dejan, solo se dejan de usar)

---

## Sobre lo legacy

Los problemas 4 y 5 (bloques legacy de firma y "Firmas Requeridas") son directamente deuda legacy. La solucion es eliminarlos del constructor y reemplazarlos con `signature_capture`, que ya esta implementado y es configurable.

El problema 3 (bloque `data_authorization`) tambien es legacy complejo que se puede eliminar y fortalecer el bloque ckeckbox.