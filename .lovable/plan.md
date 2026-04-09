

# Plan: Crear tabla relacional `contactos_empresa` para persistir múltiples contactos

## Problema

La UI permite agregar, editar y eliminar múltiples contactos por empresa, pero la base de datos solo tiene 3 campos planos en `empresas` (`persona_contacto`, `email_contacto`, `telefono_contacto`). Solo se persiste el contacto marcado como "Principal" y los demás se pierden al recargar.

## Solución

Crear una tabla `contactos_empresa` con relación a `empresas`, y actualizar el servicio para leer/escribir contactos desde esa tabla en lugar de los campos legacy.

### Paso 1: Migración SQL

```sql
CREATE TABLE public.contactos_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  es_principal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contactos_empresa ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (mismas que empresas)
CREATE POLICY "Admin gestiona contactos_empresa" ON public.contactos_empresa
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['superadministrador','administrador']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['superadministrador','administrador']));

CREATE POLICY "Autenticados leen contactos_empresa" ON public.contactos_empresa
  FOR SELECT TO authenticated USING (true);

-- Migrar datos existentes de campos legacy
INSERT INTO public.contactos_empresa (empresa_id, nombre, telefono, email, es_principal)
SELECT id, persona_contacto, telefono_contacto, email_contacto, true
FROM public.empresas
WHERE deleted_at IS NULL
  AND (persona_contacto != '' OR email_contacto != '' OR telefono_contacto != '');
```

### Paso 2: Actualizar `src/services/empresaService.ts`

- En `getAll()` y `getById()`: hacer join con `contactos_empresa` o query separado para cargar los contactos en el array `contactos` del modelo
- En `create()`: después de insertar la empresa, insertar los contactos en `contactos_empresa`
- En `update()`: al guardar, eliminar contactos existentes y reinsertar los nuevos (replace strategy)
- Mantener sincronización de campos legacy (`persona_contacto`, etc.) con el contacto principal para compatibilidad con triggers existentes como `snapshot_empresa_matricula`

### Paso 3: Eliminar fallbacks de contactos legacy en la UI

- `EmpresaFormPage.tsx`: eliminar la lógica de fallback que reconstruye contactos desde campos legacy (ya vendrán de la tabla)
- `EmpresaDetallePage.tsx`: igual, eliminar fallback
- `EmpresaDetailSheet.tsx`: igual, eliminar fallback

## Archivos afectados

| Paso | Archivo | Cambio |
|------|---------|--------|
| 1 | 1 migración SQL | Crear tabla `contactos_empresa` + migrar datos legacy |
| 2 | `src/services/empresaService.ts` | CRUD de contactos desde nueva tabla |
| 3 | `src/pages/empresas/EmpresaFormPage.tsx` | Eliminar fallback legacy |
| 3 | `src/pages/empresas/EmpresaDetallePage.tsx` | Eliminar fallback legacy |
| 3 | `src/components/empresas/EmpresaDetailSheet.tsx` | Eliminar fallback legacy |

**Total: 1 migración, 3 archivos editados, 1 servicio actualizado**

