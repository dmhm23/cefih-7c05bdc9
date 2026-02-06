

# Plan: Panel Deslizante de Detalle con Edicion Inline

## Resumen

Se creara un panel deslizante (Sheet) que se abre de derecha a izquierda al hacer clic en cualquier registro de la tabla. Este panel mostrara la informacion completa de la entidad y permitira edicion directa sin navegar a otra pagina. El componente sera reutilizable para Personas, Matriculas y Cursos.

---

## Analisis de las Referencias

### Referencia 1 (Lightfield)
- Panel con header compacto
- Campos con icono + label + valor horizontal
- Link para copiar/abrir registro
- Boton expandir

### Referencia 2 (Jotform)
- Navegacion entre registros (flechas con contador "1 de X")
- Header con multiples acciones (descargar, imprimir, ajustes)
- Layout vertical: label arriba, valor abajo
- Iconos de accion por campo (calendario para fechas)
- Valores tipo badge para categorias
- Titulo con numero de orden y fecha de actualizacion

### Caracteristicas Combinadas
| Elemento | Implementacion |
|----------|---------------|
| Navegacion registros | Flechas con "1 de X registros" |
| Header acciones | Expandir, editar en nueva pestaña, cerrar |
| Layout campos | Vertical (label arriba, valor abajo) |
| Edicion inline | Click en valor activa modo edicion |
| Badges | Para campos categoricos |
| Ancho dinamico | Normal (480px) o expandido (720px) |

---

## Arquitectura de Componentes

```text
DetailSheet (Base Reutilizable)
├── DetailSheetHeader
│   ├── Titulo + Subtitulo
│   ├── Navegacion (prev/next)
│   └── Acciones (expand, close)
├── DetailSheetContent (scroll)
│   └── Secciones con EditableField
└── DetailSheetFooter (opcional)
    └── Boton Guardar (cuando hay cambios)
```

---

## Componentes a Crear

### 1. `src/components/shared/DetailSheet.tsx`

Componente base con:
- Navegacion entre registros
- Header con titulo y acciones
- Contenido scrolleable
- Ancho dinamico (expandible)

Props:
```typescript
interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  // Navegacion
  currentIndex: number;
  totalCount: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  // Expansion
  expanded?: boolean;
  onExpandToggle?: () => void;
  // Contenido
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

### 2. `src/components/shared/EditableField.tsx`

Campo con edicion inline:
- Modo lectura: muestra label + valor
- Modo edicion: muestra input apropiado
- Tipos: text, select, combobox, date

Props:
```typescript
interface EditableFieldProps {
  label: string;
  value: string;
  displayValue?: string; // Para mostrar labels de selects
  onChange: (value: string) => void;
  type?: 'text' | 'select' | 'combobox' | 'date';
  options?: { value: string; label: string }[];
  icon?: React.ElementType;
  editable?: boolean;
  badge?: boolean; // Mostrar valor como badge
}
```

### 3. `src/components/personas/PersonaDetailSheet.tsx`

Panel especifico para Personas con secciones:
- Identificacion (tipo doc, numero)
- Datos personales (nombres, genero, fecha nacimiento, RH)
- Datos laborales (nivel educativo, area, sector)
- Contacto (email, telefono)
- Contacto de emergencia
- Lista de matriculas asociadas

### 4. `src/components/matriculas/MatriculaDetailSheet.tsx`

Panel para Matriculas con:
- Datos del estudiante (link clickeable)
- Datos del curso (link clickeable)
- Estado y tipo de formacion
- Documentos requeridos
- Estado de pago

### 5. `src/components/cursos/CursoDetailSheet.tsx`

Panel para Cursos con:
- Informacion general
- Fechas y duracion
- Entrenador
- Capacidad y estudiantes inscritos
- Estado del curso

---

## Diseno Visual del Panel

### Header con Navegacion
```text
+--------------------------------------------------+
| [<] Juan Carlos Rodriguez         [<>] [->] [X]  |
|     CC: 1234567890                               |
|     1 de 25 personas                             |
+--------------------------------------------------+
```

### Seccion de Campos (Layout Vertical)
```text
+--------------------------------------------------+
| IDENTIFICACION                                   |
|                                                  |
| Tipo de Documento                                |
| [CC - Cedula de Ciudadania]  <-- Badge           |
|                                                  |
| Numero de Documento                              |
| 1234567890                                       |
|                                                  |
| DATOS PERSONALES                                 |
|                                                  |
| Nombres                                          |
| Juan Carlos               [Editar al hacer clic] |
|                                                  |
| Apellidos                                        |
| Rodriguez Perez                                  |
|                                                  |
| Fecha de Nacimiento                         [📅] |
| 15 de marzo, 1990                                |
+--------------------------------------------------+
```

### Footer con Guardar
```text
+--------------------------------------------------+
|                    [Cancelar]  [Guardar Cambios] |
+--------------------------------------------------+
```

---

## Modificacion del Sheet Component

Se agregara variante `size` al `SheetContent`:

```typescript
const sheetVariants = cva("fixed z-50 ...", {
  variants: {
    side: { right: "..." },
    size: {
      default: "w-[480px] max-w-[90vw]",
      expanded: "w-[720px] max-w-[90vw]",
    },
  },
  defaultVariants: { side: "right", size: "default" },
});
```

---

## Modificaciones a Paginas

### PersonasPage.tsx
- Agregar estado `selectedIndex` para navegacion
- Cambiar `onRowClick` para abrir Sheet en lugar de navegar
- Renderizar `PersonaDetailSheet`
- Manejar navegacion prev/next

### MatriculasPage.tsx
- Misma logica con `MatriculaDetailSheet`

### CursosPage.tsx
- Misma logica con `CursoDetailSheet`

---

## Flujo de Edicion Inline

```text
1. Usuario abre panel (clic en fila)
2. Campos se muestran en modo lectura
3. Usuario hace clic en un campo
4. Campo se convierte en input editable
5. Usuario modifica y presiona Tab/Enter o hace clic fuera
6. Campo vuelve a modo lectura
7. Boton "Guardar" aparece en footer
8. Usuario guarda o descarta cambios
```

---

## Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/ui/sheet.tsx` | Modificar | Agregar variante size |
| `src/components/shared/DetailSheet.tsx` | Crear | Componente base |
| `src/components/shared/EditableField.tsx` | Crear | Campo con edicion inline |
| `src/components/personas/PersonaDetailSheet.tsx` | Crear | Panel de Personas |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Crear | Panel de Matriculas |
| `src/components/cursos/CursoDetailSheet.tsx` | Crear | Panel de Cursos |
| `src/pages/personas/PersonasPage.tsx` | Modificar | Integrar Sheet |
| `src/pages/matriculas/MatriculasPage.tsx` | Modificar | Integrar Sheet |
| `src/pages/cursos/CursosPage.tsx` | Modificar | Integrar Sheet |

---

## Seccion Tecnica

### Estado del Panel en PersonasPage

```typescript
const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
const [isExpanded, setIsExpanded] = useState(false);

const selectedPersona = selectedIndex !== null 
  ? filteredPersonas[selectedIndex] 
  : null;

const handleNavigate = (direction: 'prev' | 'next') => {
  if (selectedIndex === null) return;
  const newIndex = direction === 'prev' 
    ? Math.max(0, selectedIndex - 1)
    : Math.min(filteredPersonas.length - 1, selectedIndex + 1);
  setSelectedIndex(newIndex);
};
```

### Logica de EditableField

```typescript
const [isEditing, setIsEditing] = useState(false);
const [localValue, setLocalValue] = useState(value);

const handleBlur = () => {
  setIsEditing(false);
  if (localValue !== value) {
    onChange(localValue);
  }
};

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === 'Tab') {
    handleBlur();
  }
  if (e.key === 'Escape') {
    setLocalValue(value);
    setIsEditing(false);
  }
};
```

### Estado de Cambios en PersonaDetailSheet

```typescript
const [formData, setFormData] = useState<Partial<PersonaFormData>>({});
const [isDirty, setIsDirty] = useState(false);

const handleFieldChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  setIsDirty(true);
};

const handleSave = async () => {
  if (isDirty && persona) {
    await updatePersona.mutateAsync({ id: persona.id, data: formData });
    setIsDirty(false);
    setFormData({});
    toast({ title: "Cambios guardados" });
  }
};

const handleClose = () => {
  if (isDirty) {
    // Mostrar confirmacion antes de cerrar
  } else {
    onOpenChange(false);
  }
};
```

---

## Consideraciones de UX

1. Navegacion fluida: Las flechas permiten revisar registros sin cerrar el panel
2. Edicion sin friccion: Un clic activa el modo edicion
3. Feedback visual: Campos editados muestran un indicador sutil
4. Confirmacion de cambios: Si hay cambios sin guardar, se pregunta antes de cerrar
5. Expansion opcional: El usuario puede ampliar el panel si necesita mas espacio
6. Accesibilidad: Focus trap, navegacion por teclado, labels descriptivos


