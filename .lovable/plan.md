

## Plan: Limpiar secciones y agregar EPS/ARL a Vinculacion Laboral

### Resumen de cambios

Se realizan 3 tipos de cambios:
1. **Eliminar** Consentimiento de Salud, Firma Digital y Autorizacion de Datos del panel lateral y de `/matriculas/:id`
2. **Sincronizar** campos faltantes de Vinculacion Laboral entre las 3 vistas
3. **Agregar** selectores con buscador de EPS y ARL en todas las vistas

---

### 1. Eliminar secciones UI del panel lateral y pagina detalle

**Panel lateral (`MatriculaDetailSheet.tsx`):**
- Eliminar seccion "Consentimiento de Salud" (lineas 586-646)
- Eliminar seccion "Firma Digital" (lineas 662-672) y el boton de captura
- Eliminar seccion "Autorización de Datos" (lineas 676-691)
- Eliminar el dialog de firma (lineas 848-856)
- Actualizar el calculo de progreso para no incluir consentimiento/firma (ajustar conteo)

**Pagina detalle (`MatriculaDetallePage.tsx`):**
- Eliminar seccion "Consentimiento de Salud" (lineas 242-268)
- Eliminar seccion "Firma Digital" (lineas 373-388)
- Eliminar seccion "Autorización de Datos" (lineas 390-408)
- Eliminar imports no usados (ConsentimientoSalud, FirmaCaptura, capturarFirma)

Tenerlos presente en otro lugar para usarlo en otro módulo cuando me lo soliciten.

---

### 2. Sincronizar campos faltantes de Vinculacion Laboral

Comparacion de campos entre las 3 vistas:

```text
Campo               | Formulario | Panel lateral | Pagina detalle
--------------------|------------|---------------|---------------
Nivel de Formacion  | Si         | Si            | NO (falta)
Rep. Legal          | Si         | NO (falta)    | Si
Contacto Empresa    | Si (emp)   | Si (emp)      | NO (falta)
Tel. Contacto       | Si (emp)   | Si (emp)      | NO (falta)
```

**Panel lateral (`MatriculaDetailSheet.tsx`):**
- Agregar campo "Representante Legal" despues de NIT, dentro del bloque empresa/independiente

**Pagina detalle (`MatriculaDetallePage.tsx`):**
- Agregar campo "Nivel de Formacion" con selector (NIVELES_FORMACION_EMPRESA)
- Agregar campos "Contacto Empresa" y "Tel. Contacto" solo visibles para `empresa`
- Importar NIVELES_FORMACION_EMPRESA desde formOptions

---

### 3. Agregar EPS y ARL

**Archivo `src/data/formOptions.ts`:**
- Agregar array `EPS_OPTIONS` con las ~26 opciones proporcionadas
- Agregar array `ARL_OPTIONS` con las 10 opciones proporcionadas

**Archivo `src/types/matricula.ts`:**
- Agregar campos `eps?: string` y `arl?: string` al interface Matricula

**Formulario (`MatriculaFormPage.tsx`):**
- Agregar `eps` y `arl` al schema zod y defaultValues
- Agregar dos campos Combobox (mas de 4 opciones) en la seccion de Vinculacion Laboral
- Incluir en el onSubmit

**Panel lateral (`MatriculaDetailSheet.tsx`):**
- Agregar EditableField para EPS y ARL con tipo combobox/select

**Pagina detalle (`MatriculaDetallePage.tsx`):**
- Agregar EditableField para EPS y ARL con tipo combobox/select

---

### Detalle tecnico

**Nuevas opciones en `formOptions.ts`:**

```text
EPS_OPTIONS (26 opciones):
  coosalud -> "Coosalud EPS-S"
  nueva_eps -> "Nueva EPS"
  mutual_ser -> "Mutual Ser"
  salud_mia -> "Salud Mía"
  aliansalud -> "Aliansalud EPS"
  salud_total -> "Salud Total EPS S.A."
  sanitas -> "EPS Sanitas"
  sura_eps -> "EPS Sura"
  famisanar -> "Famisanar"
  sos -> "Servicio Occidental de Salud EPS SOS"
  comfenalco_valle -> "Comfenalco Valle"
  compensar -> "Compensar EPS"
  epm -> "EPM - Empresas Públicas de Medellín"
  fondo_ferrocarriles -> "Fondo de Pasivo Social de Ferrocarriles Nacionales de Colombia"
  cajacopi -> "Cajacopi Atlántico"
  familiar_colombia -> "EPS Familiar de Colombia"
  capital_salud -> "Capital Salud"
  asmet_salud -> "Asmet Salud"
  emssanar -> "Emssanar"
  savia_salud -> "Savia Salud"
  anas_wayuu -> "Anas Wayuu EPS"
  comfaoriente -> "Comfaoriente"
  comfachoco -> "Comfachoco"
  salud_vida -> "EPS Salud Vida"
  otra_eps -> "Otra" -> Habilitar un input text para escribir.

ARL_OPTIONS (10 opciones):
  sura_arl -> "ARL Sura"
  positiva -> "Positiva Compañía de Seguros S.A."
  axa_colpatria -> "Axa Colpatria Seguros S.A."
  colmena -> "Colmena Seguros S.A."
  aurora -> "Compañía de Seguros de Vida Aurora S.A."
  bolivar -> "Seguros Bolívar S.A."
  equidad -> "La Equidad Seguros Generales Organismo Cooperativo"
  alfa -> "Seguros Alfa"
  suramericana -> "Seguros Generales Suramericana S.A."
  liberty -> "Liberty Seguros de Vida"
  otra_ARL -> "Otra" -> Habilitar un input text para escribir.
```

Se usa Combobox para EPS (26 opciones) y ARL (10 opciones), ambos superan el umbral de 4 opciones.

**Archivos modificados:**
- `src/types/matricula.ts`
- `src/data/formOptions.ts`
- `src/pages/matriculas/MatriculaFormPage.tsx`
- `src/components/matriculas/MatriculaDetailSheet.tsx`
- `src/pages/matriculas/MatriculaDetallePage.tsx`

