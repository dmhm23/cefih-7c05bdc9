## Ajuste de formato de texto en CSV MinTrabajo

### Problema actual

La funcion `normalize()` convierte todo a mayusculas y elimina tildes/acentos. El requerimiento es que el CSV refleje los datos tal como estan guardados, aplicando solo "Title Case" (primera letra mayuscula, resto minuscula), y conservando caracteres especiales como la ñ y tildes.

### Cambios en `src/utils/csvMinTrabajo.ts`

**1. Reemplazar la funcion `normalize()**` por una funcion `capitalize()` que:

- Convierte la primera letra de cada palabra a mayuscula y el resto a minuscula
- Conserva tildes, ñ y caracteres especiales intactos
- No aplica `NFD` ni elimina diacriticos

```
function capitalize(value: string): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
```

**2. Actualizar `findLabel()**` para usar `capitalize()` en lugar de `normalize()`.

**3. Actualizar `splitName()**` para usar `capitalize()` en lugar de `normalize()`.

**4. Actualizar `buildRow()**`:

- Campos como `tipoDocumento` y `genero` se dejan tal cual (ya son abreviaturas cortas como CC, M, F).
- Campos de texto (cargo, empresa) usan `capitalize()`.
- `empresaNombre` por defecto sera `"Independiente"` en lugar de `"INDEPENDIENTE"`.

**5. Actualizar las filas dummy** en `generateDummyCsv()` para reflejar el nuevo formato Title Case con tildes:

```
"CC;1023456789;Juan;Carlos;Martínez;López;M;Colombia;03/15/1990;Bachiller;Operativa;Electricista;Construcción;Constructora Abc Sas;Arl Sura"
```

6. Datos dummys: para el documento de prueba usar datos dummyes que ya están guardados actualmente en la app, para poder comparar los datos.  
  
Archivo a modificar

- `src/utils/csvMinTrabajo.ts`