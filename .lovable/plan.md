## Campos Adicionales con Modal de Configuracion Estructurada

### Resumen

Reemplazar la experiencia actual de “Añadir campo” (que agrega inline dos inputs nombre/valor sin contexto) por un modal de configuración completo donde el usuario define el nombre, tipo de campo, obligatoriedad y valor por defecto (opcional). Se elimina el campo “Valor” ambiguo actual.

Adicionalmente, antes de guardar el campo, el sistema debe preguntarle al usuario si el campo aplica únicamente al nivel que se está creando/editando o si debe aplicarse a todos los niveles de formación.

---

### 1. Actualizar el modelo de datos

**Archivo:** `src/types/nivelFormacion.ts`

Reemplazar la estructura actual `{ nombre: string; valor: string }` por una mas robusta:

```typescript
export type TipoCampoAdicional =
  | 'texto_corto'
  | 'texto_largo'
  | 'numerico'
  | 'select'
  | 'select_multiple'
  | 'estado'
  | 'fecha'
  | 'fecha_hora'
  | 'booleano'
  | 'archivo'
  | 'url'
  | 'telefono'
  | 'email';

export type AlcanceCampo =
  | 'solo_nivel'
  | 'todos_los_niveles';

export interface CampoAdicional {
  id: string;
  nombre: string;
  tipo: TipoCampoAdicional;
  obligatorio: boolean;
  valorPorDefecto?: string;
  opciones?: string[]; // Solo para select / select_multiple
  alcance: AlcanceCampo; // Define si aplica solo a este nivel o globalmente
}
```

Actualizar `NivelFormacion.camposAdicionales` para usar `CampoAdicional[]`.

Agregar constante con labels legibles:

```typescript
export const TIPOS_CAMPO_LABELS: Record<TipoCampoAdicional, string> = {
  texto_corto: 'Texto corto',
  texto_largo: 'Texto largo',
  numerico: 'Campo numérico',
  select: 'Lista desplegable',
  select_multiple: 'Select múltiple',
  estado: 'Estado (activo/inactivo)',
  fecha: 'Fecha',
  fecha_hora: 'Fecha y hora',
  booleano: 'Campo booleano (switch)',
  archivo: 'Subida de archivo',
  url: 'URL',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
};
```

---

### 2. Actualizar mock data

**Archivo:** `src/data/mockData.ts`

Los niveles precargados tienen `camposAdicionales: []` o `undefined`, por lo que no requieren cambios significativos. Solo asegurar que el tipo sea compatible con la nueva interfaz.

---

### 3. Modal de configuracion de campo

**Archivo:** `src/pages/niveles/NivelFormPage.tsx`

Reemplazar el bloque actual de campos adicionales (lineas 233-278) por:

**A) Lista de campos configurados:** Cada campo creado se muestra como una fila compacta con:

- Nombre del campo
- Badge con el tipo (ej: "Texto corto", "Lista desplegable")
- Badge "Obligatorio" si aplica
- Botones editar y eliminar

**B) Boton "+ Anadir campo"** que abre un Dialog modal con:

- **Nombre del campo** (input texto, obligatorio, validacion de duplicados contra campos existentes)
- **Tipo de campo** (Select con las 13 opciones definidas en `TIPOS_CAMPO_LABELS`)
- **Obligatorio** (Switch, default: no)
- **Valor por defecto** (input opcional, con helper text: "Si se define, este valor se precompletara al crear un curso con este nivel". Se oculta para tipos `archivo` y `booleano` donde no aplica, y para `estado` se muestra como switch activo/inactivo)
- **Opciones** (solo visible si tipo es `select` o `select_multiple`): seccion con inputs para agregar/eliminar opciones de la lista. Minimo 2 opciones requeridas para estos tipos.
- **Alcance del campo** (nuevo bloque obligatorio antes de guardar):
  - Radio o Select con dos opciones:
    - “Aplicar solo a este nivel de formación”
    - “Aplicar a todos los niveles de formación”
  Si el usuario selecciona “Aplicar a todos los niveles”, debe mostrarse una advertencia clara:
  &nbsp;
  > Este campo se agregará a todos los niveles existentes y futuros. ¿Desea continuar?
  &nbsp;
  Puede implementarse una confirmación secundaria (confirm dialog) para evitar configuraciones accidentales.

**C) Modo edicion:** Al hacer clic en "editar" en un campo existente, el mismo modal se abre precargado con los datos del campo para modificarlos.

**Validaciones del modal:**

- Nombre obligatorio y sin duplicados
- Si tipo es `select` o `select_multiple`, al menos 2 opciones
- Tipo obligatorio
- El modal se abre precargado con los datos actuales del campo.
- Si el campo es global, el alcance no debe poder cambiarse sin advertencia explícita.

---

### 4. Schema zod actualizado

En `NivelFormPage.tsx`, el schema cambia de:

```typescript
camposAdicionales: z.array(z.object({ nombre: z.string(), valor: z.string() }))
```

a gestionar los campos como estado local (no dentro del form de react-hook-form), ya que la configuracion se maneja via modal separado. Se inyectan al payload en `onSubmit`.

Se usara un `useState<CampoAdicional[]>` para gestionar los campos, similar a como `customDocs` maneja los documentos personalizados.

El schema Zod ya no validará { nombre, valor }, sino que el modal gestionará validaciones internas antes de añadir el campo al estado.

---

### 5. Vista de detalle actualizada

**Archivo:** `src/pages/niveles/NivelDetallePage.tsx`

En la seccion de campos adicionales (lineas 99-104), mostrar cada campo con:

- Nombre del campo
- Tipo (badge)
- Si es obligatorio (badge)
- Valor por defecto (si tiene)
- Opciones (si es select/select_multiple, listar las opciones disponibles)

---

### 6. Consideraciones de diseno

- Los campos adicionales son **informativos y configuracionales**: definen la estructura que un curso basado en este nivel debera tener. No impactan procesos de certificacion ni matricula en esta fase.
- Son **editables despues de guardar** el nivel (se pueden modificar, agregar o eliminar al editar el nivel).
- Son visibles tanto en creacion como en edicion del nivel.
- Si el campo tiene alcance global:
  - Debe replicarse en todos los niveles existentes.
  - Debe heredarse automáticamente en niveles futuros.
    &nbsp;
  &nbsp;

---

### Archivos a modificar


| Archivo                                  | Cambio                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/types/nivelFormacion.ts`            | Nueva interfaz `CampoAdicional`, tipo `TipoCampoAdicional`, constante `TIPOS_CAMPO_LABELS` |
| `src/data/mockData.ts`                   | Ajustar tipo de `camposAdicionales` si es necesario                                        |
| `src/pages/niveles/NivelFormPage.tsx`    | Reemplazar campos inline por modal de configuracion, estado local, edicion/eliminacion     |
| `src/pages/niveles/NivelDetallePage.tsx` | Renderizar campos con tipo, obligatoriedad y opciones                                      |
| `src/services/nivelFormacionService.ts`  | Sin cambios funcionales, solo asegurar que el tipo sea compatible                          |
