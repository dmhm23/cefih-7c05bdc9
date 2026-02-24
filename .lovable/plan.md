

## PARTE 1 — Layout Base Tipo Builder (Arquitectura Estructural)

### Objetivo

Transformar la pantalla actual de `FormatoEditorPage` de un formulario largo con scroll vertical a una arquitectura visual tipo builder profesional, con header sticky, canvas central y panel de soporte lateral. No se altera la logica existente de bloques, guardado ni preview.

---

### Situacion actual

El editor actual (`FormatoEditorPage.tsx`, 660 lineas) vive dentro del `MainLayout` que aporta sidebar + header global. La pagina usa un layout `grid-cols-1 xl:grid-cols-[1fr_320px]` donde el contenido principal son 3 Cards apiladas (Config General, Firmas, Constructor de Bloques) y el panel lateral tiene la paleta de bloques.

El `MainLayout` envuelve el contenido en un `<main>` con `overflow-y-auto p-6`. Todo se percibe como formulario largo.

---

### Estrategia de implementacion

El rediseno se limita a reorganizar la estructura visual del `FormatoEditorPage`. El `MainLayout` se mantiene intacto; el builder vive como contenido de pagina pero ocupa todo el viewport disponible.

---

### Cambios detallados

#### 1. Ruta sin MainLayout

**Archivo:** `src/App.tsx`

Cambiar la ruta del editor para que NO use `WithLayout`. El builder necesita control total del viewport:

```
// Antes
<Route path="/gestion-formatos/nuevo" element={<WithLayout><FormatoEditorPage /></WithLayout>} />
<Route path="/gestion-formatos/:id/editar" element={<WithLayout><FormatoEditorPage /></WithLayout>} />

// Despues
<Route path="/gestion-formatos/nuevo" element={<FormatoEditorPage />} />
<Route path="/gestion-formatos/:id/editar" element={<FormatoEditorPage />} />
```

La lista de formatos (`/gestion-formatos`) sigue con layout normal.

#### 2. Reestructurar FormatoEditorPage completo

**Archivo:** `src/pages/formatos/FormatoEditorPage.tsx`

La estructura visual pasa de ser un `div.space-y-4` a una pantalla full-viewport con 3 zonas:

```text
+----------------------------------------------------------+
| HEADER STICKY (64-72px)                                  |
| Breadcrumb | Nombre formato | Estado | Preview | Guardar |
+----------------------------------------------------------+
| CANVAS (70%)                    | PANEL DERECHO (30%)    |
| fondo gris claro                | fondo blanco           |
|   +------------------------+    | scroll independiente   |
|   | hoja blanca centrada   |    | border-left gris       |
|   | max-w-[900px]          |    | padding 20px           |
|   | shadow, rounded-xl     |    |                        |
|   | padding 24px           |    | [Contenido existente   |
|   |                        |    |  de paleta + config]   |
|   | [Cards de config +     |    |                        |
|   |  bloques existentes]   |    |                        |
|   +------------------------+    |                        |
+----------------------------------------------------------+
```

##### 2a. Header Sticky

- Contenedor `sticky top-0 z-50` con `h-16` (64px), `border-b`, `bg-background`, `shadow-sm`.
- Se agrega sombra condicional: cuando el canvas tiene scroll, la sombra se intensifica (controlado con un state `isScrolled` via `onScroll` del contenedor canvas).
- Contenido del header:
  - **Izquierda**: Breadcrumb con enlace: `SAFA > Gestion de Formatos > Editar` (texto 12px, gris).
  - **Centro**: Nombre del formato (18px semibold). Si esta vacio, mostrar "Sin nombre".
  - **Derecha**:
    - Badge de estado: "Cambios sin guardar" (amarillo) o "Guardado" (verde). Se controla con un state `isDirty` que se activa al cambiar cualquier campo y se resetea al guardar exitosamente.
    - Boton outline: "Vista Previa" con icono Eye.
    - Boton primary: "Guardar Cambios" con icono Save, deshabilitado si `!isDirty`.

##### 2b. Zona principal con dos columnas

- Contenedor flex horizontal que ocupa `h-[calc(100vh-64px)]`.
- **Columna izquierda (canvas)**: `flex-1 overflow-y-auto bg-[#F8F9FB]` con padding generoso.
  - Dentro, un contenedor centrado: `max-w-[900px] mx-auto bg-white rounded-xl shadow-sm border p-6`.
  - Aqui van las 3 Cards existentes (Config General, Firmas, Constructor de Bloques) sin modificaciones funcionales.
- **Columna derecha (panel)**: `w-80 border-l overflow-y-auto bg-background p-5`.
  - Aqui va la paleta de bloques existente (actualmente en el sidebar `Card.sticky`), sin cambios funcionales.
  - Se elimina el `sticky top-4` de la Card porque el panel ya tiene scroll propio.

##### 2c. Dirty state

Agregar un mecanismo simple de deteccion de cambios:

```typescript
const [isDirty, setIsDirty] = useState(false);
const [savedOnce, setSavedOnce] = useState(false);

// Marcar dirty en cada setter
const setNombreD = (v: string) => { setNombre(v); setIsDirty(true); };
// ... igual para todos los campos

// Al guardar exitosamente:
setIsDirty(false);
setSavedOnce(true);
```

El badge muestra:
- Si `isDirty`: "Cambios sin guardar" (amarillo)
- Si `!isDirty && savedOnce`: "Guardado" (verde)
- Si `!isDirty && !savedOnce && isNew`: nada

---

### Resumen de archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Quitar `WithLayout` de las rutas del editor de formatos |
| `src/pages/formatos/FormatoEditorPage.tsx` | Reestructurar layout completo: header sticky + canvas centrado + panel lateral |

### Lo que NO cambia

- Logica de bloques (crear, editar, duplicar, eliminar, mover).
- Logica de guardado (create/update mutations).
- Preview dialog.
- Paleta de bloques (solo se reubica visualmente).
- Cards de configuracion general y firmas (solo se mueven al canvas).
- Ningun otro modulo del sistema.

