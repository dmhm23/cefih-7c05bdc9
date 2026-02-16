

## Ajustes visuales en Información del Aprendiz

### 1. Consentimiento de salud con Select (Si/No) en lugar de Switch

Reemplazar los componentes `Switch` por un `Select` con dos opciones: "Si" y "No". Esto aplica a las 5 preguntas de salud (restriccion medica, alergias, consumo medicamentos, embarazo, lectoescritura). Los inputs de detalle siguen apareciendo condicionalmente cuando la respuesta es "Si".

### 2. Espaciado antes de cada seccion (12px)

Actualmente `SectionTitle` tiene `mt-5` (20px). Cambiar a `mt-3` (12px) para un espaciado consistente de 12px antes de cada subtitulo. Mantener `first:mt-0` para que la primera seccion no tenga margen superior.

### 3. Tamanios de texto

- **Subtitulos** (`SectionTitle` > `h2`): cambiar de `text-xs` a `text-base`
- **Texto general del documento**: ya usa `text-sm` en la mayoria de campos. Verificar que `FieldCell` values, health rows, y tablas de evaluacion usen `text-sm` consistentemente. Los labels de campos (`field-label`) pueden mantenerse en `text-[10px]` ya que son etiquetas auxiliares.

### Archivo modificado

**`src/components/matriculas/formatos/InfoAprendizDocument.tsx`**

- Linea 7: reemplazar import de `Switch` por import de `Select, SelectTrigger, SelectValue, SelectContent, SelectItem`
- Linea 89-99 (`SectionTitle`): cambiar `h2` de `text-xs` a `text-base`, ajustar `mt-5` a `mt-3`
- Lineas 234-285: reemplazar cada `Switch` por un `Select` con opciones "Si"/"No"
- Las tablas de evaluacion y print versions no cambian

