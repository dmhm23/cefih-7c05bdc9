

## Plan: Sincronizar Cartera con Directorio de Empresas

### Diagnóstico

El módulo de Cartera mantiene su propia entidad `ResponsablePago` con datos duplicados (nombre, NIT, contacto) que ya existen en el Directorio de Empresas. Ambas fuentes comparten los mismos NITs pero no tienen un enlace explícito entre ellas. Esto significa que si se actualiza una empresa en el Directorio, los datos en Cartera quedan desactualizados.

### Solución

Agregar un campo `empresaId` a `ResponsablePago` para vincular responsables de tipo "empresa" con el Directorio, y mostrar un enlace de navegación en el detalle de Cartera.

### Cambios

#### 1. `src/types/cartera.ts`
- Agregar `empresaId?: string` a la interface `ResponsablePago`

#### 2. `src/data/mockCartera.ts`
- Agregar `empresaId` a cada responsable de tipo "empresa", vinculando por NIT:
  - rp1 → emp-010 (Constructora ABC, NIT 900123456-1)
  - rp2 → emp-012 (Infraestructuras del Norte, NIT 800567890-3)
  - rp4 → emp-013 (Telecom Solutions, NIT 901234567-8)
  - rp5 → emp-011 (Energía Solar del Caribe, NIT 902345678-5)
  - rp6 → emp-014 (Minera Andina, NIT 903456789-2)
- Los independientes (rp3, rp7, rp8, rp9) no llevan empresaId

#### 3. `src/services/carteraService.ts` — función `asignarMatriculaACartera`
- Cuando `tipoVinculacion === 'empresa'`, buscar la empresa en `mockEmpresas` por NIT y guardar el `empresaId` en el `ResponsablePago` que se crea o encuentra

#### 4. `src/pages/cartera/GrupoCarteraDetallePage.tsx`
- En la card de "Información de Contacto", si el responsable tiene `empresaId`, mostrar un botón/enlace "Ver en Directorio" que navega a `/empresas/{empresaId}`

#### 5. `src/pages/cartera/CarteraPage.tsx`
- En la columna "Responsable de Pago", si el responsable tiene `empresaId`, hacer el nombre un enlace visual (con icono `ExternalLink`) que permita navegar al directorio

### Lo que NO cambia
- La estructura de `ResponsablePago` sigue existiendo como entidad propia (puede haber responsables que no son empresas del directorio)
- Los datos desnormalizados en Cartera se mantienen (nombre, NIT, contacto) como snapshot del momento de creación
- El flujo de facturación y pagos no se altera

