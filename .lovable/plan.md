## Plan: Agregar opción "ARL" al tipo de vinculación

### Cambios

#### 1. `src/types/matricula.ts`

- Agregar `'arl'` al tipo `TipoVinculacion`
- Agregar entrada `arl: 'ARL'` en `TIPO_VINCULACION_LABELS`

#### 2. `src/data/formOptions.ts`

- Agregar `{ value: 'arl', label: 'ARL' }` al array `TIPOS_VINCULACION`

#### 3. `src/pages/matriculas/MatriculaFormPage.tsx`

- En la condición que muestra "Datos de la Empresa" (línea 889), agregar `|| tipoVinculacion === "arl"`
- En la condición que muestra "Persona de Contacto" (línea 933), agregar `|| tipoVinculacion === "arl"` para que ARL tenga los mismos campos que Empresa

**Nota**: El label "Tipo" ya dice "Tipo de Vinculación" en el código actual (línea 715), así que ese punto ya está resuelto. Verificar que se vea en el UI de la plataforma, de no estarse mostrando, hacer ajuste.