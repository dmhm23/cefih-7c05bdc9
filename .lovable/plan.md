

## Plan: Pestañas personalizadas en TodoWidget

### Cambio único en `src/components/dashboard/TodoWidget.tsx`

Reemplazar los componentes Radix `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` por navegación manual con estado local:

1. Eliminar imports de `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
2. Agregar `const [activeTab, setActiveTab] = useState<'tareas' | 'historial'>('tareas')`.
3. Renderizar dos `<button>` con estilos condicionales:
   - **Activo**: `text-foreground border-b-2 border-primary font-medium`
   - **Inactivo**: `text-muted-foreground/60` sin borde
4. Debajo, un `<Separator />` como línea horizontal tenue.
5. Contenido condicional según `activeTab` (mismo JSX actual de cada tab).

