

# Plan: Mejora de Vistas de Tablas en los Modulos

## Resumen

Se rediseñaran las vistas de tablas en los modulos de Personas, Matriculas y Cursos siguiendo el patron de diseño de la referencia (Lightfield). El objetivo es crear una interfaz mas limpia, compacta y funcional con filtros visibles y mejor aprovechamiento del espacio.

---

## Analisis de la Referencia

De las imagenes proporcionadas se identifican los siguientes elementos clave:

| Elemento | Descripcion |
|----------|-------------|
| Sin Card wrapper | La tabla ocupa todo el ancho sin contenedor de tarjeta |
| Header compacto | Titulo minimo con tabs/botones inline |
| Barra de herramientas | Filtro a la izquierda, acciones a la derecha |
| Tabla limpia | Filas compactas, headers con iconos sutiles |
| Tags/Badges | Para categorias y estados, con colores semanticos |
| Contador de registros | "X registros" al pie de la tabla |
| Sin titulos redundantes | Eliminar "Listado de..." dentro de la Card |

---

## Cambios por Componente

### 1. `DataTable.tsx` - Mejoras Generales

**Antes:**
- Tabla envuelta en borde redondeado
- Padding amplio en celdas (p-4)
- Sin contador de registros

**Despues:**
- Tabla sin borde externo
- Padding compacto en celdas (px-3 py-2)
- Contador de registros al pie ("X personas")
- Prop opcional para mostrar contador

### 2. Nuevo Componente: `TableToolbar.tsx`

Barra de herramientas unificada con:
- Boton de filtro (izquierda)
- Busqueda y selectores (centro/derecha)
- Boton de crear registro (derecha)

```text
+----------------------------------------------------------+
| [Filtro ▼]                    [Buscar...] [Estado ▼] [+] |
+----------------------------------------------------------+
```

### 3. Nuevo Componente: `FilterPopover.tsx`

Popover que agrupa multiples filtros:
- Sectores economicos (para Personas)
- Tipo de formacion (para Matriculas)
- Estados del curso

---

## Cambios por Pagina

### PersonasPage.tsx

**Eliminar:**
- Card wrapper y CardHeader con titulo "Listado de Personas"
- Columna "EPS" (ya no existe en el modelo)

**Agregar:**
- Barra de herramientas con filtros: Genero, Sector Economico, Nivel Educativo
- Columna Sector como badge con color
- Contador al pie

**Layout propuesto:**
```text
+----------------------------------------------------------+
| Personas                              [+ Nueva Persona]  |
| Gestion de identidad                                     |
+----------------------------------------------------------+
| [Filtro ▼]     [Buscar por cedula, nombre...]            |
+----------------------------------------------------------+
| Documento | Nombre     | Sector         | Telefono | ... |
|-----------|------------|----------------|----------|-----|
| 123456789 | Juan Perez | [Construccion] | 311...   | ... |
| 987654321 | Maria...   | [Energia]      | 300...   | ... |
+----------------------------------------------------------+
| 2 personas                                               |
+----------------------------------------------------------+
```

### MatriculasPage.tsx

**Eliminar:**
- Cards de estadisticas (mover a indicadores inline o eliminar)
- Card wrapper con titulo "Listado de Matriculas"

**Agregar:**
- Barra de herramientas con filtros: Estado, Tipo Formacion, Pago
- Badges para tipo de formacion
- Indicadores de pago mas visuales

### CursosPage.tsx

**Eliminar:**
- Cards de estadisticas
- Card wrapper con titulo "Listado de Cursos"

**Agregar:**
- Barra de herramientas con filtros: Estado, Fechas
- Badge de capacidad (X/Y inscritos)

---

## Nuevo Diseno de Tabla

### Estilos actualizados en table.tsx

```typescript
// TableHead - mas compacto
"h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wide"

// TableCell - padding reducido
"px-3 py-2.5 align-middle text-sm"

// TableRow - hover sutil
"border-b transition-colors hover:bg-muted/30"
```

---

## Archivos a Modificar/Crear

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/ui/table.tsx` | Modificar | Reducir padding, headers compactos |
| `src/components/shared/DataTable.tsx` | Modificar | Agregar contador, quitar borde externo |
| `src/components/shared/TableToolbar.tsx` | Crear | Barra de herramientas unificada |
| `src/components/shared/FilterPopover.tsx` | Crear | Popover de filtros multiples |
| `src/pages/personas/PersonasPage.tsx` | Modificar | Nuevo layout sin cards |
| `src/pages/matriculas/MatriculasPage.tsx` | Modificar | Nuevo layout, filtros inline |
| `src/pages/cursos/CursosPage.tsx` | Modificar | Nuevo layout, filtros inline |

---

## Nuevos Componentes

### TableToolbar.tsx

Props:
- `onFilter`: callback para abrir filtros
- `filterCount`: numero de filtros activos (muestra badge)
- `searchPlaceholder`: placeholder de busqueda
- `searchValue` / `onSearchChange`: control de busqueda
- `children`: selectores adicionales (estado, etc)
- `actions`: botones de accion (crear, exportar)

### FilterPopover.tsx

Props:
- `filters`: array de configuracion de filtros
- `values`: estado actual de filtros
- `onChange`: callback al cambiar filtros
- `onClear`: limpiar todos los filtros

---

## Ejemplo Visual Final - PersonasPage

```text
+------------------------------------------------------------------+
| Personas                                     [+ Nueva Persona]   |
| Gestion de identidad - Hoja de Vida Digital                      |
+------------------------------------------------------------------+
|                                                                  |
| [≡ Filtro]                      [🔍 Buscar por cedula, nombre..] |
|                                                                  |
+------------------------------------------------------------------+
| □ | Documento   | Nombre Completo  | Sector           | Tel     |
|---|-------------|------------------|------------------|---------|
|   | 1234567890  | Juan Perez       | [Construccion]   | 311...  |
|   | 9876543210  | Maria Lopez      | [Energia]        | 300...  |
|   | 5555555555  | Carlos Ruiz      | [Telecomunic..] | 315...  |
+------------------------------------------------------------------+
| 3 personas                                                       |
+------------------------------------------------------------------+
```

---

## Seccion Tecnica

### Estructura del FilterPopover

```typescript
interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date-range';
  options?: { value: string; label: string }[];
}

// Ejemplo de uso
<FilterPopover
  filters={[
    { key: 'genero', label: 'Genero', type: 'select', options: GENEROS },
    { key: 'sector', label: 'Sector', type: 'multiselect', options: SECTORES_ECONOMICOS },
    { key: 'nivelEducativo', label: 'Nivel Educativo', type: 'select', options: NIVELES_EDUCATIVOS },
  ]}
  values={filterValues}
  onChange={setFilterValues}
/>
```

### Logica de Filtrado

Se centralizara la logica de filtrado en cada pagina usando un hook o funcion que combine:
- Busqueda de texto (nombre, documento)
- Filtros de select (genero, estado)
- Filtros multiples (sectores)

### Contador de Registros

El DataTable mostrara automaticamente el contador:
```typescript
<div className="text-sm text-muted-foreground py-2 px-3">
  {data.length} {countLabel || 'registros'}
</div>
```

