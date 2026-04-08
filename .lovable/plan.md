

# Plan: Corregir contactos en vista de edición y nombre de nivel en tarifas

## Problema 1: Contactos desaparecen en el formulario de edición

La tabla `empresas` no tiene una columna `contactos`. Los datos de contacto se almacenan en los campos legacy (`persona_contacto`, `email_contacto`, `telefono_contacto`). El servicio `empresaService.getById` siempre retorna `contactos: []`.

- En `EmpresaDetallePage` y `EmpresaDetailSheet`, hay lógica de fallback que reconstruye los contactos desde los campos legacy cuando `contactos` está vacío (líneas 73-75).
- En `EmpresaFormPage`, el `useEffect` (línea 81) solo ejecuta `setContactos(empresa.contactos)` si `empresa.contactos.length > 0`. Como siempre es `[]`, nunca entra, y los contactos quedan con el valor inicial vacío del `useState` (línea 51-53): un contacto en blanco.

### Solución

En `EmpresaFormPage.tsx`, líneas 81-83: agregar el mismo fallback que usa `EmpresaDetallePage`, reconstruyendo el contacto desde los campos legacy cuando `empresa.contactos` está vacío.

```typescript
if (empresa.contactos && empresa.contactos.length > 0) {
  setContactos(empresa.contactos);
} else if (empresa.personaContacto || empresa.emailContacto || empresa.telefonoContacto) {
  setContactos([{
    id: uuid(),
    nombre: empresa.personaContacto || "",
    telefono: empresa.telefonoContacto || "",
    email: empresa.emailContacto || "",
    esPrincipal: true,
  }]);
}
```

## Problema 2: Nivel de formación vacío en tarifas

En `empresaService.getTarifas` (línea ~125), el query solo hace `select('*')` de `tarifas_empresa`. El campo `nivelFormacionNombre` se asigna como `''` (hardcoded). No se hace join con `niveles_formacion` para obtener el nombre.

### Solución

Cambiar el query en `empresaService.getTarifas` para hacer un join con `niveles_formacion`:

```typescript
const { data, error } = await supabase
  .from('tarifas_empresa')
  .select('*, niveles_formacion!inner(nombre)')
  .eq('empresa_id', empresaId);
```

Y mapear el nombre:

```typescript
nivelFormacionNombre: row.niveles_formacion?.nombre || '',
```

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/empresas/EmpresaFormPage.tsx` | Agregar fallback de contactos desde campos legacy |
| `src/services/empresaService.ts` | Join con `niveles_formacion` en `getTarifas` |

**Total: 2 archivos editados, 0 migraciones**

