

## Reorganizacion del Modulo de Cursos: Secciones "Todos los cursos" + "Calendario"

### Resumen

Reorganizar la ruta `/cursos` para que contenga dos secciones internas navegables mediante tabs: **"Todos los cursos"** (la vista actual de listado/gestion) y **"Calendario"** (nueva vista tipo Google Calendar). La vista Calendario mostrara los cursos como eventos en una grilla temporal con modos Mes/Semana/Dia, filtros por entrenador y supervisor, y un panel de resumen de horas ejecutadas por entrenador.

---

### 1. Crear pagina contenedora con Tabs

**Archivo**: `src/pages/cursos/CursosPage.tsx` (modificar)

Convertir la pagina actual en un contenedor con dos tabs usando `@radix-ui/react-tabs`:

- **Tab "Todos los cursos"**: Contiene todo el contenido actual de CursosPage (tabla, filtros, toolbar, detail sheet). Se extrae a un componente interno `CursosListView`.
- **Tab "Calendario"**: Renderiza el nuevo componente `CursosCalendarioView`.

El tab activo se controlara con estado local. El encabezado ("Cursos" + descripcion) permanece fuera de los tabs como titulo del modulo.

---

### 2. Extraer vista de listado

**Archivo**: `src/components/cursos/CursosListView.tsx` (crear)

Mover toda la logica actual de `CursosPage` (tabla, filtros, busqueda, column selector, detail sheet, bulk actions) a este componente. No cambia funcionalidad, solo se encapsula.

---

### 3. Crear componente de Calendario

**Archivo**: `src/components/cursos/CursosCalendarioView.tsx` (crear)

Calendario construido desde cero (sin libreria externa) con la siguiente estructura:

**3.1. Toolbar del calendario**
- Selector de modo: Mes / Semana / Dia (botones tipo toggle group)
- Navegacion temporal: botones "<" y ">" para avanzar/retroceder, boton "Hoy" para volver al periodo actual
- Etiqueta del periodo actual (ej: "Marzo 2024", "10-16 Mar 2024", "Lunes 11 Mar")

**3.2. Filtros**
- Filtro por entrenador (principal): dropdown multi-select con checkboxes. Opciones: "Todos", y cada entrenador unico extraido de los cursos. Colores asignados por entrenador.
- Filtro por supervisor: dropdown simple (preparado para datos futuros, por ahora vacio con placeholder)

**3.3. Grilla del calendario**

- **Vista Mes**: Grilla 7 columnas (Lun-Dom) x 5-6 filas. Cada celda muestra el dia y los cursos que caen en ese rango de fechas como barras de color (color por entrenador). Si un curso dura multiples dias, la barra se extiende horizontalmente.
- **Vista Semana**: 7 columnas con franjas horarias verticales (8:00-18:00). Los cursos se muestran como bloques en la franja correspondiente. Dado que los cursos no tienen hora especifica, se mostraran como bloques de dia completo en la parte superior.
- **Vista Dia**: Una sola columna con la franja horaria del dia. Cursos del dia como bloques.

Cada bloque/evento muestra:
- Nombre del curso (truncado si es largo)
- Nombre del entrenador
- Color asignado al entrenador

Al hacer clic en un evento, navegar a `/cursos/:id`.

**3.4. Panel de resumen de horas por entrenador**

Sidebar o seccion inferior que muestra para el mes actual (o periodo seleccionado):
- Lista de entrenadores con:
  - Nombre
  - Cantidad de cursos asignados
  - Horas ejecutadas (suma de `horasTotales` de cursos en el periodo)
  - Barra de progreso visual (preparada para un tope mensual que se definira despues, por ahora se muestra solo el total)

---

### 4. Logica de colores por entrenador

Definir un array de colores predefinidos y asignarlos ciclicamente a cada entrenador unico. Esto se usara tanto en los eventos del calendario como en el filtro para diferenciar visualmente.

```text
Colores: azul, verde, naranja, morado, rosa, teal, rojo, amarillo
```

---

### 5. Agregar campo `supervisorId`/`supervisorNombre` al tipo Curso (preparacion)

**Archivo**: `src/types/curso.ts` (modificar)

Agregar campos opcionales:
- `supervisorId?: string`
- `supervisorNombre?: string`

Esto permite que el filtro por supervisor funcione cuando se agreguen datos. No se modifican los mock data por ahora.

---

### 6. Mock data: agregar mas variedad de cursos

**Archivo**: `src/data/mockData.ts` (modificar)

Agregar 3-4 cursos adicionales con diferentes entrenadores, fechas y estados para que la vista calendario tenga contenido visual significativo. Incluir cursos en diferentes meses para probar navegacion temporal.

---

### Resumen de archivos

| Archivo | Accion |
|---------|--------|
| `src/pages/cursos/CursosPage.tsx` | Refactorizar: tabs contenedoras |
| `src/components/cursos/CursosListView.tsx` | Crear: extraer listado actual |
| `src/components/cursos/CursosCalendarioView.tsx` | Crear: calendario completo |
| `src/types/curso.ts` | Agregar campos supervisor opcionales |
| `src/data/mockData.ts` | Agregar cursos adicionales para demo |

---

### Seccion tecnica

**Calendario sin librerias externas**: Se construira con CSS Grid y logica de fechas usando `date-fns` (ya instalado). Las funciones clave son:
- `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek` para calcular la grilla mensual
- `eachDayOfInterval` para generar los dias de la grilla
- `isWithinInterval`, `isSameDay` para determinar que cursos caen en cada celda
- `format` para etiquetas de fecha

**Rendimiento**: Los cursos se filtran una sola vez por periodo visible y se distribuyen en las celdas mediante un `useMemo`.

**Estructura del evento en la grilla**:
```text
+------------------------------------------+
| Lun 11  | Mar 12  | Mie 13  | Jue 14 ...
|---------|---------|---------|--------
| [== Trabajo en Alturas - Carlos ==]      |
|         | [Reentrenamiento - Maria]       |
+------------------------------------------+
```

