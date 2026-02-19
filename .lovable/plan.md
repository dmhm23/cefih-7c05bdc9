
## Plan: Navegación con Contexto de Origen

### Problema raíz
Los botones "volver" usan `navigate("/ruta-raiz")` en lugar de regresar al punto real de origen. La solución es pasar el contexto de origen como `state` de React Router al navegar hacia adelante, y leerlo al volver.

Este patrón ya es nativo en React Router (`useLocation` + `navigate` con `state`) y no requiere librerías adicionales.

---

### Flujo que se corrige

**Caso 1: Matrículas → Perfil del matriculado**

```text
/matriculas/m1  --[Ver perfil completo]--> /personas/p1  --[← Atrás]--> /matriculas/m1  ✓
```

Actualmente el botón "← Atrás" en `/personas/:id` siempre va a `/personas`.

**Caso 2: Cursos → Matrícula del estudiante**

```text
/cursos/c1  --[ExternalLink]--> /matriculas/m1  --[← Atrás]--> /cursos/c1  ✓
```

Actualmente el botón "← Atrás" en `/matriculas/:id` siempre va a `/matriculas`.

---

### Implementación

El patrón es de dos partes: **quien navega** pasa `state: { from: currentPath }`, y **quien recibe** lee ese state para volver.

#### Parte A — Pasar el contexto al navegar (3 puntos de salida)

**1. `src/pages/matriculas/MatriculaDetallePage.tsx` — línea 307**

El botón "Ver perfil completo" navega a `/personas/:id`. Cambiar para pasar el origen:

```tsx
// Antes:
onClick={() => navigate(`/personas/${matricula.personaId}`)}

// Después:
onClick={() => navigate(`/personas/${matricula.personaId}`, {
  state: { from: `/matriculas/${matricula.id}`, fromLabel: "Matrícula" }
})}
```

**2. `src/components/cursos/EnrollmentsTable.tsx` — línea 156**

El botón ExternalLink navega a `/matriculas/:id`. Cambiar para pasar el origen:

```tsx
// Antes:
onClick={() => navigate(`/matriculas/${m.id}`)}

// Después:
onClick={() => navigate(`/matriculas/${m.id}`, {
  state: { from: `/cursos/${curso.id}`, fromLabel: "Curso" }
})}
```

**3. `src/pages/personas/PersonaDetallePage.tsx` — línea 283**

El click en una matrícula de la lista lateral navega a `/matriculas/:id`. Cambiar:

```tsx
// Antes:
onClick={() => navigate(`/matriculas/${m.id}`)}

// Después:
onClick={() => navigate(`/matriculas/${m.id}`, {
  state: { from: `/personas/${id}`, fromLabel: "Persona" }
})}
```

---

#### Parte B — Leer el contexto al volver (2 páginas de destino)

**4. `src/pages/personas/PersonaDetallePage.tsx` — botón ← Atrás (línea 116)**

Leer `location.state.from` y usarlo si existe:

```tsx
const location = useLocation();
const fromPath = location.state?.from || "/personas";
const fromLabel = location.state?.fromLabel;

// Botón:
<Button variant="ghost" size="icon" onClick={() => navigate(fromPath)}>
  <ArrowLeft className="h-4 w-4" />
</Button>
```

**5. `src/pages/matriculas/MatriculaDetallePage.tsx` — botón ← Atrás (línea 275)**

Igual:

```tsx
const location = useLocation();
const fromPath = location.state?.from || "/matriculas";
const fromLabel = location.state?.fromLabel;

// Botón:
<Button variant="ghost" size="icon" onClick={() => navigate(fromPath)}>
  <ArrowLeft className="h-4 w-4" />
</Button>
```

---

### Casos edge cubiertos

| Escenario | Comportamiento |
|-----------|----------------|
| Acceso directo por URL (sin state) | `fromPath` cae al fallback genérico (`/personas` o `/matriculas`) |
| Navegar desde Matrículas → Perfil | Vuelve a `/matriculas/:id` |
| Navegar desde Cursos → Matrícula | Vuelve a `/cursos/:id` |
| Navegar desde Personas → Matrícula | Vuelve a `/personas/:id` |
| Refrescar la página | `location.state` se pierde → usa fallback genérico (comportamiento aceptable) |

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/personas/PersonaDetallePage.tsx` | Leer `state.from` en back button + pasar `state.from` al navegar a matrícula |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Leer `state.from` en back button + pasar `state.from` al navegar a persona |
| `src/components/cursos/EnrollmentsTable.tsx` | Pasar `state.from` al navegar a matrícula |
