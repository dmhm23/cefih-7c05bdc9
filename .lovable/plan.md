
## Plan: Sincronizar fechas de ARL y Examen Médico en la tabla de matrículas

### Causa raíz

La tabla `/matriculas` carga datos vía `useMatriculasPaginated` → `matriculaService.getPage()`, que solo hace `select('*, personas!inner(...)')` sobre `matriculas`. **Nunca trae `documentos_matricula`.** En `rowToMatricula` (línea ~16 de `matriculaService.ts`), `documentos` se inicializa como `[]`.

Resultado: en `MatriculasPage.tsx` líneas 137-142, `getDocumentoFecha` busca `m.documentos.find(d => d.tipo === 'arl')` → siempre `undefined` → siempre devuelve `"-"`. Aunque el usuario haya guardado las fechas correctamente en `documentos_matricula` (verificado en BD: hay filas `arl` con `fecha_inicio_cobertura` y `examen_medico` con `fecha_documento`), el listado nunca las ve.

El mismo problema afecta a `getEstadoDocumental` (línea 144) — la columna "Estado Documental" siempre dice "Pendiente" por la misma razón. Y aplica a `EnrollmentsTable.tsx` (cursos) que usa `useMatriculas` → `getAll`, donde tampoco se traen documentos.

### Solución

Traer las fechas relevantes desde BD junto con cada matrícula y exponerlas al front como campos derivados, sin cargar el array completo de documentos (que sería costoso en listas grandes).

**1. `src/services/matriculaService.ts` — `getPage`**

Agregar un join lateral a `documentos_matricula` filtrando solo los tipos que la tabla necesita:

```ts
.select(`
  *,
  personas!inner(id, nombres, apellidos, numero_documento, telefono),
  documentos_matricula(tipo, estado, fecha_documento, fecha_inicio_cobertura, opcional)
`, { count: 'exact' })
```

En `rowToMatricula`, mapear los documentos embebidos al campo `documentos` (parcial: solo los campos necesarios para la tabla — tipo, estado, fechas, opcional). El resto del shape (`storagePath`, `archivoNombre`, etc.) sigue llegando solo en `getById`.

**2. `src/services/matriculaService.ts` — `getAll` y `getByCursoId` (mismo fix simétrico)**

Aplicar el mismo cambio para que `EnrollmentsTable` y otros consumidores de listas también vean las fechas. Es un join económico (Supabase ya lo soporta con la sintaxis embebida) y elimina deuda silenciosa.

**3. Cómputo de "Estado Documental"**

Con `documentos` ya poblado parcialmente, `getEstadoDocumental` empieza a funcionar correctamente como bonus — sin tocar nada en la página.

**4. Compatibilidad con consolidado**

La fila `tipo='consolidado'` también vendrá en el join. `getDocumentoFecha` busca por `d.tipo === 'arl'` o `'examen_medico'` específicamente, así que no genera ruido. Para `getEstadoDocumental`, el conteo seguirá funcionando porque la fila consolidado tiene `estado='cargado'` y los individuales que cubre permanecen `pendiente` — es coherente con el modelo actual donde, sin lógica adicional, una matrícula cubierta solo por consolidado seguirá apareciendo como "Pendiente" en esta columna. Eso es consistente con lo decidido en la iteración previa (ver "Sin impacto colateral" del plan anterior: "se asume que basta con la consistencia visual en la página de matrícula"). **No se cambia el cómputo aquí**; queda para una iteración futura si se quiere unificar.

### Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/services/matriculaService.ts` | `getPage`, `getAll`, `getByCursoId`: añadir embed `documentos_matricula(tipo, estado, fecha_documento, fecha_inicio_cobertura, opcional)`. En `rowToMatricula` (o en el mapeo local de cada método) poblar `documentos` con los campos parciales. |

### Validación post-cambio

- En `/matriculas`, las matrículas cargadas previamente con ARL o examen médico muestran las fechas correctas en las columnas "Fecha Cobertura ARL" y "Fecha Examen".
- Caso real verificado en BD:
  - matrícula `b1c01c77…` (ARL, `fecha_inicio_cobertura=2026-04-21`) → debe mostrar `21/04/2026` en columna ARL.
  - matrícula `028d3c57…` (examen, `fecha_documento=2025-10-02`) → debe mostrar `02/10/2025` en columna Examen.
- En `/cursos/<id>` la tabla de matriculados también empieza a mostrar fechas (`getArlDate` / `getExamDate` en `EnrollmentsTable.tsx` ya estaban listas).
- Editar una fecha en el detalle de matrícula → recargar `/matriculas` → la nueva fecha aparece.
- "Estado Documental" muestra "Completo" cuando todos los obligatorios individuales están cargados.

### Sin impacto colateral

- No se modifica BD, RLS, tipos generados ni la interfaz `DocumentoRequerido`.
- `getById` sigue intacto — el detalle completo de documentos (storage, archivo) no se duplica.
- El join embebido aumenta levemente el payload por matrícula (≈4 campos × N documentos), pero PostgREST lo resuelve en una sola query.
- No se rompe ningún consumidor: `documentos` pasa de array vacío a array parcial — los campos no incluidos siguen siendo `undefined` igual que antes.
