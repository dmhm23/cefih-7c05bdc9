

## Plan: Integración Empresas ↔ Matrículas + Detalle Empresa + Tarifas

### Resumen

Tres bloques: (1) vincular matrículas con empresas del directorio via autocomplete, (2) mostrar estudiantes enviados en el detalle de empresa, (3) crear entidad de tarifas por empresa.

---

### PARTE 4 — Integración con Matrículas

#### 4.1 Modelo de datos — `src/types/matricula.ts`
- Agregar campo opcional `empresaId?: string` a la interface `Matricula`
- Los campos `empresaNombre`, `empresaNit`, etc. se mantienen (datos desnormalizados para cuando se creó la matrícula)

#### 4.2 Mock data — `src/data/mockEmpresas.ts`
- Agregar las empresas que aparecen en matrículas pero no existen en el directorio:
  - `emp-010`: Constructora ABC S.A.S (NIT: 900123456-1)
  - `emp-011`: Energía Solar del Caribe S.A.S (NIT: 902345678-5)
  - `emp-012`: Infraestructuras del Norte S.A. (NIT: 800567890-3)
  - `emp-013`: Telecom Solutions S.A.S (NIT: 901234567-8)
  - `emp-014`: Minera Andina S.A.S (NIT: 903456789-2)

#### 4.3 Mock data — `src/data/mockData.ts`
- Agregar `empresaId` a cada matrícula existente que tiene empresa, apuntando al id correspondiente en mockEmpresas

#### 4.4 Formulario de matrícula — `src/pages/matriculas/MatriculaFormPage.tsx`
- Cuando `tipoVinculacion === "empresa"` o `"arl"`:
  - Reemplazar los inputs de texto libre de "Nombre de la Empresa" y "NIT" por un **Combobox** que busque empresas del directorio (`useEmpresas`)
  - Al seleccionar una empresa: autocompletar `empresaId`, `empresaNombre`, `empresaNit`, `empresaRepresentanteLegal`, `sectorEconomico`, `arl`, `empresaContactoNombre`, `empresaContactoTelefono`
  - Agregar botón "Crear empresa" que abra un modal para crear empresa nueva desde el formulario (similar al patrón de "Crear persona")
- Cuando `tipoVinculacion === "independiente"`: mantener lógica actual (autocompletar con datos de la persona)

#### 4.5 Schema zod — misma página
- Agregar `empresaId: z.string().optional()` al schema

#### 4.6 Detail views — `MatriculaDetailSheet.tsx` y `MatriculaDetallePage.tsx`
- En la sección de vinculación laboral: si hay `empresaId`, mostrar un enlace/botón para ir al detalle de la empresa en el directorio
- Los campos de empresa siguen siendo editables inline (datos desnormalizados de la matrícula)

---

### PARTE 5 — Sección Estudiantes Enviados en Detalle Empresa

#### 5.1 `src/pages/empresas/EmpresaDetallePage.tsx`
- Agregar import de `useMatriculas` y `usePersonas`
- Filtrar matrículas donde `empresaNit === empresa.nit` (compatibilidad con datos legacy sin `empresaId`)
- **Métricas en encabezado**: Total estudiantes únicos, Total matrículas, Cursos distintos
- **Tabla de estudiantes enviados** con columnas: Nombre estudiante, Documento, Curso, Fecha matrícula, Estado matrícula
- Hacer clic en un estudiante navega al detalle de matrícula

#### 5.2 `src/components/empresas/EmpresaDetailSheet.tsx`
- Agregar sección resumida con conteo de estudiantes enviados y enlace "Ver todos" que navega al detalle completo

#### 5.3 `src/pages/empresas/EmpresasPage.tsx`
- Agregar columna "Estudiantes enviados" a la tabla (conteo de matrículas por empresa, buscando por NIT)

---

### PARTE 6 — Tarifas por Empresa

#### 6.1 Tipo — `src/types/empresa.ts`
- Agregar interface `TarifaEmpresa`:
  ```
  { id, empresaId, cursoId, cursoNombre, valor, createdAt, updatedAt }
  ```

#### 6.2 Mock data — `src/data/mockEmpresas.ts`
- Agregar array `mockTarifasEmpresa` con 3-4 tarifas de ejemplo

#### 6.3 Servicio — `src/services/empresaService.ts`
- Agregar métodos: `getTarifas(empresaId)`, `createTarifa(data)`, `updateTarifa(id, data)`, `deleteTarifa(id)`

#### 6.4 Hooks — `src/hooks/useEmpresas.ts`
- Agregar: `useTarifasEmpresa(empresaId)`, `useCreateTarifa()`, `useUpdateTarifa()`, `useDeleteTarifa()`

#### 6.5 UI — `src/pages/empresas/EmpresaDetallePage.tsx`
- Nueva sección "Tarifas especiales" debajo de "Estudiantes enviados"
- Tabla simple: Curso (select de cursos existentes), Valor (input numérico), Acciones (editar/eliminar)
- Botón "Agregar tarifa" que abre fila editable o dialog
- Inline editing para editar valor

---

### Archivos modificados
- `src/types/matricula.ts` — agregar `empresaId`
- `src/types/empresa.ts` — agregar `TarifaEmpresa`
- `src/data/mockEmpresas.ts` — agregar empresas de matrículas + tarifas mock
- `src/data/mockData.ts` — agregar `empresaId` a matrículas existentes
- `src/services/empresaService.ts` — agregar métodos de tarifas
- `src/hooks/useEmpresas.ts` — agregar hooks de tarifas
- `src/pages/matriculas/MatriculaFormPage.tsx` — autocomplete de empresa
- `src/components/matriculas/MatriculaDetailSheet.tsx` — enlace a empresa
- `src/pages/matriculas/MatriculaDetallePage.tsx` — enlace a empresa
- `src/pages/empresas/EmpresaDetallePage.tsx` — secciones estudiantes + tarifas
- `src/components/empresas/EmpresaDetailSheet.tsx` — conteo estudiantes
- `src/pages/empresas/EmpresasPage.tsx` — columna estudiantes enviados

