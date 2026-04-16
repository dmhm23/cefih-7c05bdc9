

# Plan: Importación masiva de personas por archivo

## Resumen

Replicar el patrón de importación de empresas para el módulo de personas: exportar plantilla Excel con validaciones, parsear archivo, previsualizar con filtros/errores, e importar las filas válidas a la base de datos.

## Archivos a crear/modificar

| Archivo | Acción | Descripción |
|---|---|---|
| `src/utils/personaPlantilla.ts` | **Crear** | Plantilla Excel y parser de archivo para personas |
| `src/components/personas/ImportarPersonasDialog.tsx` | **Crear** | Diálogo de importación (réplica del patrón de empresas) |
| `src/services/personaService.ts` | **Modificar** | Agregar método `createBulk` |
| `src/pages/personas/PersonasPage.tsx` | **Modificar** | Agregar botones "Descargar plantilla" e "Importar" |

## Detalle técnico

### 1. `personaPlantilla.ts` — Plantilla y parser

**Columnas de la plantilla Excel** (14 columnas):

| Columna | Obligatoria | Validación |
|---|---|---|
| Tipo Documento | Sí | Lista: CC, CE, PA, PE, PP |
| Número Documento | Sí | No vacío, duplicados en archivo |
| Nombres | Sí | No vacío |
| Apellidos | Sí | No vacío |
| Género | No | Lista: Masculino, Femenino, Otro |
| Fecha Nacimiento | No | Formato fecha válida |
| País Nacimiento | No | — |
| RH | No | Lista: O+, O-, A+, A-, B+, B-, AB+, AB- |
| Nivel Educativo | No | Lista desde `NIVELES_EDUCATIVOS` |
| Email | No | — |
| Teléfono | No | — |
| Contacto Emergencia Nombre | No | — |
| Contacto Emergencia Teléfono | No | — |
| Contacto Emergencia Parentesco | No | — |

- Data validation en Excel para Tipo Documento, Género, RH y Nivel Educativo (dropdowns).
- Fila de ejemplo incluida.
- Detección de documentos duplicados dentro del archivo.
- Mapeo de labels a valores de enum del backend (ej. "CC" → `cedula_ciudadania`).

### 2. `ImportarPersonasDialog.tsx` — Diálogo

Réplica exacta del patrón de `ImportarEmpresasDialog`:
- Zona de drag & drop para cargar archivo
- Tabla de previsualización con scroll
- Tabs de filtro: Todas / Válidas / Con errores
- Filas expandibles con detalle de errores
- Celdas copiables para Nombre, Documento y errores
- Botón "Copiar todos los errores"
- Resumen con badges (válidas / con errores)
- Botón importar solo filas válidas

### 3. `personaService.createBulk` — Inserción masiva

Mismo patrón que `empresaService.createBulk`: iteración secuencial con try/catch por fila, acumulando errores y conteo de creadas.

### 4. `PersonasPage.tsx` — Integración

- Agregar botón "Descargar plantilla" que llame a `descargarPlantillaPersonas()`
- Agregar botón "Importar" que abra `ImportarPersonasDialog`
- Ambos junto al botón existente "Nueva persona"

