# **Plan ajustado: Mover la generación del número de curso a base de datos, con consecutivo seguro y unicidad garantizada**

## **Problema**

Actualmente la lógica de generación del número del curso vive en el frontend, lo que duplica reglas de negocio y no garantiza consistencia si un curso se crea desde otro flujo. Además, el trigger actual autogenerar_nombre_curso sigue usando un formato legacy (FI-0002).

El problema no es solo dónde se genera el código, sino también que una estrategia basada en COUNT(*) + 1 no es segura ante concurrencia, ya que dos inserciones simultáneas podrían producir el mismo consecutivo.

## **Objetivo**

Definir una única fuente de verdad para el número del curso en la base de datos, respetar la edición manual cuando aplique y asegurar que el consecutivo mensual por nivel de formación se genere de forma transaccional y sin riesgo de duplicados.

---

## **Solución estructural**

### **1. Reescribir el trigger** 

### **autogenerar_nombre_curso**

El trigger debe implementar la regla oficial:

{prefijo}{sep}{codigoTipo}{sep}{YY}{sep}{MM}{sep}{consecutivo}

Condiciones:

- Si NEW.nombre viene con valor, el trigger lo respeta.
- Si NEW.nombre viene vacío o nulo, el trigger genera el valor automáticamente.
- La lógica debe leer la configuración oficial desde niveles_formacion.config_codigo_estudiante.
- El consecutivo no debe calcularse con COUNT(*) + 1.

---

### **2. Crear una tabla de consecutivos mensuales por nivel**

En lugar de contar cursos existentes, crear una tabla dedicada para manejar el consecutivo de forma segura.

Ejemplo conceptual:

```
CREATE TABLE public.curso_consecutivos (
  nivel_formacion_id uuid NOT NULL,
  anio smallint NOT NULL,
  mes smallint NOT NULL,
  ultimo_consecutivo integer NOT NULL DEFAULT 0,
  PRIMARY KEY (nivel_formacion_id, anio, mes)
);
```

Esta tabla permitirá:

- llevar el consecutivo real por nivel_formacion + año + mes,
- evitar colisiones por concurrencia,
- separar claramente la lógica de secuencia del resto de la tabla cursos.

---

### **3. Generar el consecutivo de forma transaccional**

Dentro del trigger, el consecutivo debe obtenerse actualizando la tabla curso_consecutivos con una operación atómica.

Lógica esperada:

- identificar nivel_formacion_id, año y mes de fecha_inicio,
- crear el registro si no existe,
- incrementar ultimo_consecutivo en una operación segura,
- usar ese valor para construir NEW.nombre.

Esto evita que dos transacciones lean el mismo valor al mismo tiempo.

---

### **4. Agregar restricción de unicidad**

Además del trigger, la base de datos debe impedir duplicados reales.

Opciones recomendadas:

- índice único sobre nombre, si ese campo debe ser globalmente único,
- o una restricción más específica si el negocio permite reutilización en otros contextos.
  &nbsp;

Ejemplo:

```
CREATE UNIQUE INDEX ux_cursos_nombre
ON public.cursos (nombre)
WHERE deleted_at IS NULL;
```

Esto actúa como blindaje adicional ante cualquier fallo inesperado.

---

### **5. Ajustar** 

### **cursoService.create**

En src/services/cursoService.ts:

- no enviar nombre cuando el valor sea automático y solo sirva como vista previa,
- enviar nombre únicamente cuando el usuario lo haya editado manualmente,
- si nombre va vacío, la base de datos lo genera.
  &nbsp;

Regla práctica:

- nombre manual: se envía.
- nombre automático no confirmado manualmente: no se envía, o se envía vacío.
- la base de datos asigna el valor oficial final.

---

### **6. Ajustar** 

### **CursoFormPage.tsx**

En src/pages/cursos/CursoFormPage.tsx:

- mantener el campo visible y editable,
- mostrar una vista previa del número del curso,
- dejar claro que es una referencia visual y que el valor oficial lo define la base de datos al guardar,
- no depender de countByNivelAndMonth como fuente real de generación.
- &nbsp;

Importante:

- la vista previa puede conservarse para UX,
- pero no debe asumirse como el valor definitivo,
- por concurrencia, el valor final podría variar en el momento del guardado.

---

### **7. Revisar el uso de** 

### **countByNivelAndMonth**

countByNivelAndMonth ya no debe usarse para lógica de negocio.

Opciones:

- eliminarlo por completo,
- o conservarlo solo como apoyo visual para una vista previa aproximada.

Si se conserva, debe quedar explícito que no define el consecutivo oficial.

---

&nbsp;

## **Resumen de cambios**

&nbsp;


| **Recurso**                        | **Cambio**                                                                  |
| ---------------------------------- | --------------------------------------------------------------------------- |
| Migración SQL 1                    | Crear tabla curso_consecutivos                                              |
| Migración SQL 2                    | Reescribir trigger autogenerar_nombre_curso con la regla oficial            |
| Migración SQL 3                    | Crear índice único para cursos.nombre                                       |
| src/services/cursoService.ts       | Enviar nombre solo si fue editado manualmente                               |
| src/pages/cursos/CursoFormPage.tsx | Mantener campo editable y tratar el valor automático solo como vista previa |


---

&nbsp;

## **Resultado esperado**

- El número del curso se genera con una única lógica oficial.
- La base de datos es la fuente de verdad.
- Se evita duplicar reglas entre frontend y backend.
- Se respeta la edición manual del campo.
- El consecutivo mensual se genera de forma segura, incluso con inserciones simultáneas.
- Se evita la creación de códigos duplicados.

&nbsp;