

## Ocultar campos de Contacto Empresa para independientes

### Problema
Cuando el tipo de vinculacion es "independiente", los campos "Contacto Empresa" y "Tel. Contacto" no aplican porque el estudiante trabaja por cuenta propia. Actualmente se muestran en algunas vistas, generando confusion.

### Cambios a realizar

**1. Formulario de creacion (`src/pages/matriculas/MatriculaFormPage.tsx`)**
- Envolver el bloque "Persona de Contacto" (lineas 872-900) con una condicion: solo mostrarlo cuando `tipoVinculacion === "empresa"`.
- Actualmente esta dentro del bloque que se muestra para empresa e independiente; se agrega un `if` interno.

**2. Panel lateral (`src/components/matriculas/MatriculaDetailSheet.tsx`)**
- Los campos "Contacto Empresa" y "Tel. Contacto" (lineas 565-575) ya estan dentro de un bloque que solo se muestra para `empresa`. Esto ya funciona correctamente.
- Se debe expandir ese bloque para mostrar Empresa, NIT y Rep. Legal tambien para independientes, pero mantener Contacto y Telefono solo para empresa. Esto se logra separando los campos en dos grupos:
  - Grupo 1 (empresa + independiente): Empresa, NIT, Representante Legal
  - Grupo 2 (solo empresa): Contacto Empresa, Tel. Contacto

**3. Pagina detalle (`src/pages/matriculas/MatriculaDetallePage.tsx`)**
- Si se agregan campos de contacto empresa en el futuro (segun el plan pendiente), aplicar la misma condicion: solo visibles cuando `tipoVinculacion === "empresa"`.

### Detalle tecnico

```text
MatriculaFormPage.tsx:
  Linea ~872: Envolver "Persona de Contacto" con:
    {tipoVinculacion === "empresa" && (
      <p>Persona de Contacto</p>
      <div>...campos contacto...</div>
    )}

MatriculaDetailSheet.tsx:
  Separar el bloque actual en:
    {(tipoVinculacion === "empresa" || tipoVinculacion === "independiente") && (
      -> Empresa, NIT, Rep. Legal
    )}
    {tipoVinculacion === "empresa" && (
      -> Contacto Empresa, Tel. Contacto
    )}
```
