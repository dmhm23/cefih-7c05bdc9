

# Plan: Importación masiva de empresas desde CSV/Excel

## Resumen

Dos fases: (1) Generar y descargar una plantilla Excel con las columnas exactas del sistema, y (2) implementar la funcionalidad de importación que parsea el archivo y crea las empresas en lote. Se agrega un menú de "más opciones" (tres puntos) junto al botón "Nueva Empresa".

## Plantilla de columnas

La plantilla tendrá estas columnas, mapeadas directamente a los campos de la tabla `empresas`:

| Columna en plantilla | Campo DB | Obligatorio | Notas |
|---|---|---|---|
| Nombre Empresa | `nombre_empresa` | Sí | Texto libre |
| NIT | `nit` | Sí | Debe ser único |
| Representante Legal | `representante_legal` | No | |
| Sector Económico | `sector_economico` | No | Debe coincidir con enum (ej: "Construcción") |
| ARL | `arl` | No | Debe coincidir con enum (ej: "ARL Sura") |
| Dirección | `direccion` | No | |
| Teléfono Empresa | `telefono_contacto` | No | |
| Persona Contacto | `persona_contacto` | No | Se guardará como contacto principal |
| Teléfono Contacto | `telefono_contacto` (contacto) | No | |
| Email Contacto | `email_contacto` | No | |

La plantilla incluirá una fila de ejemplo y validaciones de datos (dropdown) para Sector Económico y ARL.

## Cambios

### 1. UI — Menú de más opciones en `EmpresasPage.tsx`

Agregar un `DropdownMenu` con ícono `MoreVertical` al lado del botón "Nueva Empresa" con dos opciones:
- **Descargar plantilla**: genera y descarga un `.xlsx` con las columnas y dropdowns de validación
- **Importar empresas**: abre un diálogo de importación

### 2. Componente `ImportarEmpresasDialog.tsx`

- Diálogo modal con `FileDropZone` para arrastrar CSV/Excel
- Parseo con la librería `xlsx` (SheetJS) ya disponible o instalable
- Vista previa de las filas detectadas con validación inline (NIT duplicado, campos obligatorios faltantes, sector/ARL no reconocido)
- Resumen: X válidas, Y con errores
- Botón "Importar" que ejecuta inserciones en lote vía `empresaService`
- Manejo de errores por fila (NIT duplicado en BD)

### 3. Utilidad de descarga de plantilla

Función que genera el archivo Excel con:
- Encabezados formateados
- Fila de ejemplo
- Listas de validación para Sector Económico y ARL
- Se usa `xlsx` (SheetJS) para generar en cliente

### 4. Servicio — Método bulk en `empresaService.ts`

```typescript
async createBulk(empresas: EmpresaFormData[]): Promise<{created: number, errors: {row: number, error: string}[]}>
```

Inserta cada empresa individualmente para capturar errores de NIT duplicado por fila.

### 5. Dependencia

Instalar `xlsx` (SheetJS) para parseo y generación de archivos Excel.

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `package.json` | Agregar dependencia `xlsx` |
| `src/pages/empresas/EmpresasPage.tsx` | Agregar menú DropdownMenu con opciones |
| `src/components/empresas/ImportarEmpresasDialog.tsx` | Crear — diálogo de importación |
| `src/utils/empresaPlantilla.ts` | Crear — generación de plantilla + parseo de archivo |
| `src/services/empresaService.ts` | Agregar método `createBulk` |

