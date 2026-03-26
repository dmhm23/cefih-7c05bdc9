

## Plan: Actualizar documento REGLAS_NEGOCIO.md

### Contexto

El documento `REGLAS_NEGOCIO.md` fue generado previamente como artefacto en `/mnt/documents/`. Desde entonces se han realizado múltiples cambios significativos al sistema que requieren reflejarse:

1. **Módulo de Empresas** — Entidad nueva con CRUD completo, tarifas por empresa, integración con matrículas (`empresaId`), y sincronización con Cartera (`ResponsablePago.empresaId`)
2. **Módulo de Formatos** — Reemplazo del constructor de bloques por motor de plantillas HTML con tokens, editor TipTap, versionado, categorías, estados (borrador/activo/archivado), plantillas base, eliminación masiva
3. **Cartera ↔ Empresas** — `ResponsablePago` ahora tiene `empresaId` opcional para vincular con el directorio
4. **Matrículas ↔ Empresas** — Campo `empresaId` como FK al directorio, autocomplete en formulario
5. **Dashboard** — Widget de tareas con drag & drop, edición inline, placeholder mejorado
6. **Cursos** — Acciones masivas en tabla de estudiantes (generar certificados, eliminar), filtro de entrenadores con checkboxes en calendario
7. **Auditoría** — Falta incluir `empresa`, `formato`, `tarifa_empresa` en `TipoEntidad`

### Qué se hará

Regenerar el archivo `/mnt/documents/REGLAS_NEGOCIO.md` con:

- Todas las reglas existentes revisadas y corregidas
- Nuevas reglas para el módulo de Empresas (~15 reglas)
- Reglas actualizadas del módulo de Formatos (motor dual, estados, versionado, tokens, eliminación masiva)
- Reglas de integración Empresas ↔ Matrículas y Empresas ↔ Cartera
- Reglas de tarifas por empresa
- Nuevas inconsistencias identificadas resueltas o actualizadas
- Reglas de acciones masivas en cursos y formatos

### Archivo generado
- `/mnt/documents/REGLAS_NEGOCIO_v2.md` — versión actualizada completa

