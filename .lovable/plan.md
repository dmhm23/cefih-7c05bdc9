# Plan final — ARL y Sector Económico: bug fix + sincronización matrícula↔empresa

## Diagnóstico confirmado

**Bug raíz** — `src/pages/matriculas/MatriculaFormPage.tsx`, líneas 306–325:

```ts
useEffect(() => {
  if (tipoVinculacion === "independiente" && selectedPersona) { ... }
  else if (tipoVinculacion === "empresa" || tipoVinculacion === "arl") {
    form.setValue("sectorEconomico", "");   // ← borra
    form.setValue("arl", "");               // ← borra
  }
}, [tipoVinculacion, selectedPersona, form]);
```

Como `selectedPersona` está en deps, **cualquier cambio en la persona (al editarla inline) re-dispara la rama `else if` y borra ARL/sector** aunque el usuario ya los tenga ingresados o autocompletados desde la empresa. Adicionalmente el efecto no distingue "primera selección de tipoVinculacion" vs "re-render", por lo que también puede pisar valores recién traídos del directorio.

**Datos reales en BD (hoy):**

| Métrica | Valor |
|---|---|
| Empresas totales (activas) | 571 |
| Empresas sin ARL | 552 (97 %) |
| Empresas sin sector económico | 554 (97 %) |
| Matrículas totales | 157 |
| Matrículas con `arl = ''` (string vacío) | 2 |
| Matrículas con `sector_economico = ''` | 5 |
| Empresas completables por consenso ARL | 9 |
| Empresas completables por consenso sector | 4 |
| Empresas con conflicto ARL entre matrículas | 1 |
| Matrículas completables desde empresa (ARL) | 7 |
| Matrículas completables desde empresa (sector) | 2 |

El volumen es bajo y manejable.

---

## FASE 1 — Fix del useEffect (bug actual)

**Archivo:** `src/pages/matriculas/MatriculaFormPage.tsx`

1. Sacar `selectedPersona` y `form` de las deps del efecto. Dejar **solo `tipoVinculacion`**.
2. Usar un `useRef<string | null>` (`prevTipoVinculacionRef`) para detectar **transición real** de tipo. Solo limpiar cuando `prev !== nuevo`.
3. **Nunca** limpiar `sectorEconomico` ni `arl` en la rama `empresa | arl`. Esos campos son datos del trabajador/empresa, no del flujo de selección. Solo se limpia cuando el usuario abandona explícitamente una empresa seleccionada (que ya se hace al cambiar de empresa en el `Combobox` de empresa).
4. Mantener la limpieza de campos de identidad de empresa (`empresaId`, `empresaNombre`, `empresaNit`, `empresaRepresentanteLegal`, contactos) solo en transición real.

Resultado: ARL/sector ya no se borran por re-render; solo cuando el usuario explícitamente cambia de empresa (lógica del onChange del Combobox, intacta).

---

## FASE 2 — Normalización empty → NULL

**Archivo:** `src/services/matriculaService.ts` (mappers `create` y `update`).

Aplicar utilidad local `nullIfEmpty(v) = v?.trim() ? v.trim() : null` a los campos:
- `arl`, `arl_otra`
- `sector_economico`, `sector_economico_otro`
- `eps`, `eps_otra`
- `area_trabajo`, `empresa_cargo` (consistencia)

No requiere migración: las columnas ya son nullable. Limpia los 2 + 5 registros existentes con `''` mediante un script de normalización ejecutado una sola vez (insert tool / migration de data).

---

## FASE 3 — Propagación matrícula → empresa (UX)

**Recomendación de UX: diálogo posterior al guardado exitoso de la matrícula.**

Razones:
- No bloquea el guardado (regla 7).
- El usuario ve "Matrícula guardada" y luego una pregunta clara con contexto.
- Permite mostrar el diff ("Empresa X no tiene ARL. ¿Guardar `POSITIVA` también en la empresa?") con dos botones: **Sí, actualizar empresa** / **No, solo matrícula**.
- Más seguro que un checkbox previo (que el usuario podría marcar sin leer) y más explícito que un toast (que se pierde).
- Si hay ambos campos para proponer (ARL + sector), un solo diálogo con dos checkboxes pre-marcados.

**Reglas de disparo:**
- Solo cuando `tipoVinculacion === 'empresa'` y hay `empresaId`.
- Solo si la matrícula tiene valor no vacío en ARL/sector **y** la empresa lo tiene vacío.
- Nunca sobrescribir valores existentes en empresa.
- Nunca propagar `'otra_arl'` / `'otro_sector'` sin el campo libre acompañante (en cuyo caso se desactiva por ahora; se decidirá si guardar el "otra" en empresa en una iteración futura).

**Componente nuevo:** `src/components/matriculas/SincronizarEmpresaDialog.tsx` (basado en `ConfirmDialog`, con dos checkboxes).

**Hook nuevo:** `useSyncMatriculaToEmpresa()` que llama `empresaService.update()` solo con los campos aceptados.

**Integración:** en el `onSubmit` de `MatriculaFormPage` (creación y edición), después del `await createMatricula/updateMatricula`, calcular el diff con la empresa cargada (ya está en `empresas` desde `useEmpresas`) y abrir el diálogo si aplica.

---

## FASE 4 — Backfill matrícula → empresa (tarea administrativa)

**Estrategia:** dry-run + reporte + ejecución manual con backup.

1. **Vista previa** (read-only, ya validada):
   ```sql
   WITH mat_emp AS (
     SELECT empresa_id,
            NULLIF(TRIM(arl),'') AS arl,
            NULLIF(TRIM(sector_economico),'') AS sector
     FROM matriculas
     WHERE deleted_at IS NULL AND empresa_id IS NOT NULL
   )
   SELECT empresa_id,
          COUNT(DISTINCT arl) FILTER (WHERE arl IS NOT NULL) AS arl_distintos,
          MAX(arl) AS arl_unico,
          COUNT(DISTINCT sector) FILTER (WHERE sector IS NOT NULL) AS sec_distintos,
          MAX(sector) AS sec_unico
   FROM mat_emp GROUP BY empresa_id;
   ```
2. **Backup**: snapshot a tabla `_backup_empresas_arl_sector_YYYYMMDD` con `id, arl, sector_economico, snapshot_at`.
3. **Update controlado**: solo donde `arl_distintos = 1 AND empresa.arl IS NULL` (idem sector). Migración SQL que se aplica una sola vez.
4. **Conflictos** (1 empresa hoy con ARL ambigua, 0 con sector): exportar a CSV en `/mnt/documents/conflictos_arl_sector.csv` para revisión manual; **no se actualizan**.

Volumen: 9 empresas ARL + 4 sector. Bajo riesgo.

---

## FASE 5 — Backfill empresa → matrícula

Mismo patrón: dry-run, backup (`_backup_matriculas_arl_sector_YYYYMMDD`), update controlado.

1. **Selección**: matrículas con `arl IS NULL` (o `''`) cuya empresa tiene `arl IS NOT NULL`. Idem sector. Solo 7 + 2 registros hoy.
2. **Sin condición de unanimidad** (la fuente única es la empresa).
3. Ejecutar después de FASE 4 para que las empresas ya estén lo más completas posible.

---

## FASE 6 — Pruebas (manual, en Browser Testing)

1. Crear matrícula con empresa sin ARL → ingresar ARL manual → guardar → diálogo aparece → aceptar → verificar empresa actualizada en `/empresas/:id`.
2. Crear matrícula → ingresar ARL → rechazar diálogo → empresa intacta, matrícula con ARL.
3. Editar matrícula existente, agregar sector → diálogo aparece solo para sector (no ARL si ya estaba).
4. Empresa CON ARL + matrícula con ARL distinta → **no** aparece diálogo (no sobrescribimos).
5. Cambiar `tipoVinculacion` de "empresa" a "independiente" y vuelta a "empresa" → ARL/sector que el usuario tipeó **persisten** (regresión del bug).
6. Editar persona inline mientras el form tiene ARL/sector → valores **persisten** (regresión del bug).
7. Guardar matrícula con ARL = `''` → en BD queda `NULL`, no `''`.
8. Backfill mat→emp dry-run vs ejecución: contar filas afectadas == reporte previo.
9. Backfill emp→mat: matrícula 7 ARL + 2 sector, ninguna otra tocada.
10. Conflictos: empresa con ARL ambigua **no** se actualiza; aparece en CSV.

---

## Archivos a modificar / crear

**Modificar:**
- `src/pages/matriculas/MatriculaFormPage.tsx` — fix useEffect (FASE 1), integrar diálogo post-save (FASE 3).
- `src/services/matriculaService.ts` — `nullIfEmpty` en mappers (FASE 2).

**Crear:**
- `src/components/matriculas/SincronizarEmpresaDialog.tsx` — diálogo post-save.
- `src/hooks/useSyncMatriculaToEmpresa.ts` — wrapper de mutation.

**Migraciones (orden):**
1. Normalización: `UPDATE matriculas SET arl=NULL WHERE arl=''`, idem sector/eps.
2. Backup empresas + backfill mat→emp consenso.
3. Backup matrículas + backfill emp→mat.

**Artefactos:** `/mnt/documents/conflictos_arl_sector.csv` con empresas en conflicto.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Diálogo aparece molestamente cada edición | Solo dispara cuando hay diff real y empresa vacía; una vez actualizada, no vuelve. |
| Usuario actualiza empresa con dato erróneo (typo) | Diálogo muestra valor literal "Va a guardar `POSITIVA` en la empresa X"; reversible vía panel empresa. |
| Backfill mat→emp con valor desactualizado | Solo se aplica con consenso unánime entre todas las matrículas de la empresa; conflictos se reportan, no se tocan. |
| `'otra_arl'` / `'otro_sector'` propagado sin texto libre | Excluir explícitamente esos valores del diálogo y del backfill en esta iteración. |
| Cambios en `useMatriculas`/`useEmpresas` por sincronización | Invalidar queryKeys `['empresas']` y `['empresa', id]` tras update; ya implementado en `useUpdateEmpresa`. |

---

## Rollback

- **FASE 1–3 (código)**: revertir los archivos modificados; sin efecto en BD.
- **FASE 2 (normalización)**: irreversible pero benigno (`'' → NULL` no pierde información).
- **FASE 4–5 (backfill)**: restaurar desde `_backup_empresas_arl_sector_*` y `_backup_matriculas_arl_sector_*` con `UPDATE ... FROM backup`.

---

## Orden de ejecución sugerido (tras tu aprobación)

1. FASE 1 + FASE 2 + script de normalización (cierra el bug y deja datos limpios). Probar en preview.
2. FASE 3 (diálogo). Probar.
3. FASE 4 backup + dry-run report → revisión → ejecución.
4. FASE 5 backup + dry-run report → revisión → ejecución.
5. FASE 6 pruebas integrales en Browser Testing.

Espero tu aprobación para implementar. Si quieres ajustar la UX (por ejemplo, preferir checkbox previo en lugar de diálogo posterior), dímelo antes de empezar.
