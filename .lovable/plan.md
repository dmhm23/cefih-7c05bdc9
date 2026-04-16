

## Análisis

Actualmente en `src/utils/personaPlantilla.ts` se marcan como **errores obligatorios**:
- Tipo Documento
- Número Documento
- Nombres
- Apellidos

El resto (género, fecha, RH, nivel educativo, contacto emergencia, etc.) ya son opcionales pero validan formato si se proveen.

El trigger DB `validar_contacto_emergencia` exige que **si** se envía contacto emergencia, tenga `nombre` y `telefono`. Si va vacío (`{}`) no falla.

## Plan

Relajar todas las validaciones obligatorias excepto las mínimas que la base de datos exige por NOT NULL sin default:

**Campos que SÍ deben permanecer obligatorios** (NOT NULL en BD sin default útil):
- `numero_documento` (NOT NULL, sin default)
- `nombres` (NOT NULL, sin default)
- `apellidos` (NOT NULL, sin default)

**Campos que pasan a ser opcionales** (todos los demás):
- Tipo documento → si viene vacío, usar default `CC` (la BD ya tiene default `cedula_ciudadania`)
- Género, fecha nacimiento, RH, nivel educativo, email, teléfono, país, contacto emergencia → completamente opcionales

## Cambios

### `src/utils/personaPlantilla.ts`

1. **Quitar el error** "Tipo Documento es obligatorio" — si viene vacío, asignar `'CC'` por defecto.
2. Mantener: errores solo para `numeroDocumento`, `nombres`, `apellidos` vacíos.
3. Mantener: errores de **formato** (valores no reconocidos en enums) cuando el usuario sí proporciona un valor inválido — esto evita corromper datos.
4. Contacto emergencia: si solo se llenan algunos sub-campos (ej. solo nombre sin teléfono), enviar el objeto completo vacío `{}` para evitar el trigger DB que exige nombre+teléfono juntos. Es decir: solo enviar `contacto_emergencia` cuando AMBOS (nombre y teléfono) estén presentes; en caso contrario, enviar `{}`.

### `src/services/personaService.ts`

En `mapPersonaToDb`, cuando `contactoEmergencia` viene con datos parciales (falta nombre o teléfono), enviar `{}` en lugar del objeto incompleto, para no disparar el trigger `validar_contacto_emergencia`.

## Resultado

El usuario podrá cargar archivos con solo 3 columnas mínimas (Número Documento, Nombres, Apellidos) y el resto se importará tal cual venga, con valores por defecto seguros.

