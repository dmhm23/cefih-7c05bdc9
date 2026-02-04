
# Plan: Reconstruccion del Formulario de Datos Personales

## Resumen

Se rediseñara la seccion "Datos Personales" del formulario `/personas/nuevo` para incluir los campos especificados, con selectores simples y selectores con busqueda integrada para listas largas.

---

## Cambios en el Modelo de Datos

### Actualizacion de `src/types/persona.ts`

Se agregaran los nuevos campos al interface `Persona`:

```typescript
// Nuevos tipos
type TipoDocumento = 'CC' | 'CE' | 'PA' | 'PE' | 'PP';
type Genero = 'M' | 'F';
type NivelEducativo = 'primaria' | 'secundaria' | 'bachiller' | 'tecnico' | 
                       'tecnologo' | 'universitario' | 'especializacion' | 
                       'maestria' | 'doctorado';
type AreaTrabajo = 'administrativo' | 'operativa';

interface Persona {
  // Campos existentes que se mantienen
  id: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  // ... otros campos existentes

  // Nuevos campos
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;  // Renombrado de 'cedula'
  genero: Genero;
  paisNacimiento: string;
  nivelEducativo: NivelEducativo;
  areaTrabajo: AreaTrabajo;
  sectorEconomico: string;
}
```

---

## Nuevos Componentes a Crear

### 1. `src/components/ui/combobox.tsx`

Componente reutilizable que combina `Popover` + `Command` para crear selectores con busqueda. Se usara para:
- Pais de nacimiento
- Nivel educativo  
- Sector economico

### 2. `src/data/formOptions.ts`

Archivo de constantes con todas las opciones de los selectores:

```typescript
export const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'CC - Cedula de Ciudadania' },
  { value: 'CE', label: 'CE - Cedula de Extranjeria' },
  { value: 'PA', label: 'PA - Pasaporte' },
  { value: 'PE', label: 'PE - Permiso Especial' },
  { value: 'PP', label: 'PP - Permiso de Proteccion' },
];

export const GENEROS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
];

export const NIVELES_EDUCATIVOS = [
  { value: 'primaria', label: 'Primaria' },
  { value: 'secundaria', label: 'Secundaria' },
  // ... resto de niveles
];

export const AREAS_TRABAJO = [
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'operativa', label: 'Operativa' },
];

export const SECTORES_ECONOMICOS = [
  { value: 'construccion', label: 'Construccion' },
  { value: 'infraestructura_vial', label: 'Infraestructura vial y transporte' },
  // ... los 20 sectores especificados
];

export const PAISES = [
  { value: 'CO', label: 'Colombia' },  // Primera opcion sugerida
  { value: 'VE', label: 'Venezuela' },
  { value: 'EC', label: 'Ecuador' },
  // ... lista completa de paises
];
```

---

## Estructura del Formulario Actualizado

### Seccion: Datos Personales (Card)

| Campo | Tipo de Input | Ancho |
|-------|---------------|-------|
| Tipo de documento | Select simple | 50% |
| No. Documento | Input text | 50% |
| Nombres | Input text | 50% |
| Apellidos | Input text | 50% |
| Genero | Select simple | 50% |
| Pais de nacimiento | Combobox con busqueda | 50% |
| Fecha de nacimiento | Input date | 50% |
| Nivel educativo | Combobox con busqueda | 50% |
| Area de trabajo | Select simple | 50% |
| Sector economico | Combobox con busqueda | 50% |

---

## Archivos a Modificar/Crear

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/types/persona.ts` | Modificar | Agregar nuevos tipos y campos |
| `src/data/formOptions.ts` | Crear | Constantes de opciones |
| `src/components/ui/combobox.tsx` | Crear | Selector con busqueda reutilizable |
| `src/pages/personas/PersonaFormPage.tsx` | Modificar | Actualizar campos del formulario |
| `src/data/mockData.ts` | Modificar | Actualizar datos de ejemplo |
| `src/services/personaService.ts` | Verificar | Asegurar compatibilidad |
| `src/hooks/usePersonas.ts` | Verificar | Asegurar compatibilidad |

---

## Implementacion del Combobox

Se creara un componente generico que reciba:
- Lista de opciones
- Placeholder
- Texto de busqueda
- Opcion sugerida (para pais Colombia)

```text
+---------------------------+
| Colombia              [v] |
+---------------------------+
| [Buscar pais...]          |
|---------------------------|
| > Colombia   (sugerido)   |
| Argentina                 |
| Brasil                    |
| Chile                     |
| ...                       |
+---------------------------+
```

---

## Validacion con Zod

Se actualizara el schema de validacion:

```typescript
const personaSchema = z.object({
  tipoDocumento: z.enum(['CC', 'CE', 'PA', 'PE', 'PP']),
  numeroDocumento: z.string().min(6, "Minimo 6 caracteres"),
  nombres: z.string().min(2, "Ingrese el nombre"),
  apellidos: z.string().min(2, "Ingrese los apellidos"),
  genero: z.enum(['M', 'F']),
  paisNacimiento: z.string().min(1, "Seleccione el pais"),
  fechaNacimiento: z.string().min(1, "Seleccione la fecha"),
  nivelEducativo: z.string().min(1, "Seleccione el nivel"),
  areaTrabajo: z.enum(['administrativo', 'operativa']),
  sectorEconomico: z.string().min(1, "Seleccione el sector"),
  // ... campos existentes (email, telefono, etc.)
});
```

---

## Consideraciones de UX

1. **Colombia como sugerencia principal**: Al abrir el selector de pais, Colombia aparece primero y resaltado
2. **Busqueda instantanea**: Los combobox filtran mientras el usuario escribe
3. **Accesibilidad**: Navegacion por teclado en todos los selectores
4. **Validacion visual**: Bordes rojos en campos con error
5. **Labels claros**: Cada campo indica si es obligatorio (*)

---

## Seccion Tecnica

### Patron Combobox (Popover + Command)

```typescript
// Estructura basica del componente
<Popover>
  <PopoverTrigger>
    <Button variant="outline">
      {selectedValue || placeholder}
      <ChevronsUpDown />
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandInput placeholder="Buscar..." />
      <CommandList>
        <CommandEmpty>Sin resultados</CommandEmpty>
        <CommandGroup>
          {options.map(option => (
            <CommandItem key={option.value}>
              {option.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

### Lista de Paises

Se incluira una lista completa de paises latinoamericanos y principales paises del mundo, con Colombia posicionada primero para facilitar la seleccion rapida.
