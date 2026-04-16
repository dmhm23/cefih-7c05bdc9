

# Plan: Soft-delete en cascada hacia Cartera

## Problema

Cuando se hace soft-delete de una matrícula (directamente o como consecuencia de eliminar un curso/persona), los datos de cartera asociados quedan activos: grupos, facturas, pagos y actividades siguen visibles y contabilizando.

## Análisis de la cadena

- **Persona** → actualmente bloquea eliminación si tiene matrículas activas (no aplica cascada).
- **Curso** → soft-delete del curso NO elimina las matrículas asociadas automáticamente. Primero hay que propagar.
- **Matrícula** → es el punto de unión con cartera vía `grupo_cartera_matriculas`.

## Solución: Trigger de base de datos + ajuste en servicio de cursos

### 1. Trigger SQL: al soft-delete de matrícula, limpiar cartera

Cuando `matriculas.deleted_at` cambia de NULL a un valor:
1. Buscar el grupo de cartera vinculado vía `grupo_cartera_matriculas`
2. Eliminar el vínculo en `grupo_cartera_matriculas`
3. Recalcular el grupo con `recalcular_grupo_cartera()`
4. Si el grupo queda sin matrículas vinculadas → soft-delete del grupo, sus facturas y pagos
5. Registrar actividad en `actividades_cartera`

### 2. Servicio de cursos: al soft-delete de curso, soft-delete de sus matrículas

`cursoService.delete()` actualmente solo marca el curso como eliminado. Se debe agregar que también haga soft-delete de todas las matrículas activas del curso. El trigger del paso 1 se encargará de la cascada hacia cartera.

### 3. Persona: sin cambios

Ya bloquea eliminación si tiene matrículas activas (`PERSONA_CON_MATRICULAS`), por lo que no hay caso de cascada.

## Migración SQL

```sql
CREATE OR REPLACE FUNCTION public.cascade_softdelete_matricula_cartera()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _grupo_id UUID;
  _matriculas_restantes INTEGER;
BEGIN
  -- Solo actuar cuando deleted_at cambia de NULL a un valor
  IF OLD.deleted_at IS NOT NULL OR NEW.deleted_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Encontrar grupo de cartera vinculado
  SELECT grupo_cartera_id INTO _grupo_id
  FROM public.grupo_cartera_matriculas
  WHERE matricula_id = NEW.id;

  IF _grupo_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Eliminar el vínculo
  DELETE FROM public.grupo_cartera_matriculas
  WHERE matricula_id = NEW.id;

  -- Contar matrículas restantes en el grupo
  SELECT count(*) INTO _matriculas_restantes
  FROM public.grupo_cartera_matriculas
  WHERE grupo_cartera_id = _grupo_id;

  IF _matriculas_restantes = 0 THEN
    -- Soft-delete de pagos de las facturas del grupo
    UPDATE public.facturas
    SET estado = 'anulada', updated_at = now()
    WHERE grupo_cartera_id = _grupo_id;

    -- Soft-delete del grupo
    UPDATE public.grupos_cartera
    SET estado = 'pagado', saldo = 0, total_valor = 0, 
        total_abonos = 0, updated_at = now()
    WHERE id = _grupo_id;

    -- Registrar actividad
    INSERT INTO public.actividades_cartera 
      (grupo_cartera_id, tipo, descripcion, fecha)
    VALUES (_grupo_id, 'sistema', 
      'Grupo liquidado automáticamente por eliminación de matrícula(s)', now());
  ELSE
    -- Recalcular con las matrículas restantes
    PERFORM public.recalcular_grupo_cartera(_grupo_id);

    INSERT INTO public.actividades_cartera 
      (grupo_cartera_id, tipo, descripcion, fecha)
    VALUES (_grupo_id, 'sistema', 
      'Matrícula desvinculada por soft-delete', now());
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cascade_softdelete_matricula_cartera
  AFTER UPDATE OF deleted_at ON public.matriculas
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_softdelete_matricula_cartera();
```

**Nota**: El enum `estado_factura` no tiene valor `'anulada'`. Si no se puede agregar, las facturas simplemente no se tocan y el grupo se recalcula a saldo 0. Se verificará el enum antes de la migración final.

## Código a modificar

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | Trigger `cascade_softdelete_matricula_cartera` |
| `src/services/cursoService.ts` | En `delete()`, agregar soft-delete de matrículas del curso antes del soft-delete del curso |

## Flujo resultante

```text
Eliminar Curso
  └─ cursoService.delete() soft-deletes matrículas del curso
       └─ Trigger DB: por cada matrícula soft-deleted
            └─ Desvincula de grupo_cartera_matriculas
            └─ Si grupo queda vacío → liquida grupo + registra actividad
            └─ Si no → recalcula grupo + registra actividad

Eliminar Matrícula (directa)
  └─ Trigger DB: misma lógica

Eliminar Persona
  └─ Bloqueada si tiene matrículas activas (sin cambio)
```

