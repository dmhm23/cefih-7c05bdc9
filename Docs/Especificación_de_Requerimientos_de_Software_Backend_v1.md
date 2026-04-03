

# ---

**Especificación de Requerimientos de Software Backend (Supabase) — CEFIH v4.0**

## **1\. Introducción**

El presente documento define las especificaciones técnicas y funcionales para el desarrollo del backend del sistema **CEFIH** (Centro de Entrenamiento en Fomento e Industria y Trabajo en Alturas). El sistema actual cuenta con un frontend robusto desarrollado en React/Vite, y el objetivo de este proyecto es implementar una arquitectura backend escalable, segura y automatizada utilizando **Supabase** (PostgreSQL, Edge Functions, Row Level Security y Storage).

### **1.1. Objetivo Principal**

Migrar e implementar la lógica de negocio central, persistencia de datos y reglas de validación en la base de datos y Edge Functions, garantizando que el frontend existente pueda operar de manera fluida, sin inconsistencias de datos y delegando cálculos complejos (cartera, generación de certificados, renderizado de formatos) al servidor.

### **1.2. Resultados Esperados**

1. **Consistencia Absoluta de Datos:** Cero registros huérfanos gracias a políticas de integridad referencial estricta.  
2. **Automatización Financiera:** Cálculo en tiempo real de saldos, abonos y estados de facturación (Motor de Cartera).  
3. **Generación Documental Dinámica:** Renderizado preciso de formatos y certificados inmutables (PDF/SVG) con resolución de tokens en tiempo real.  
4. **Trazabilidad Continua:** Historial de auditoría completo para todas las entidades críticas.  
5. **Autoservicio Seguro:** Un portal del estudiante protegido y dinámico, configurable desde un panel administrativo.

## ---

**2\. Consideraciones Arquitectónicas Transversales**

1. **Soft-Deletes (T-001):** Toda tabla principal (personas, empresas, cursos, etc.) incluye deleted\_at. Las consultas de la API filtrarán por defecto los registros inactivos.  
2. **Auditoría Nativa (T-002):** Implementación de un Trigger genérico (audit\_log\_trigger) en PostgreSQL para capturar INSERT, UPDATE y DELETE, registrando el usuario (desde JWT auth) y los cambios en formato JSONB.  
3. **Integridad Referencial Estricta (T-005):** Uso de ON DELETE RESTRICT en relaciones críticas. No se puede eliminar una empresa si tiene facturas, ni un curso si tiene matrículas.  
4. **Delegación de Lógica (T-004):** Operaciones CRUD estándar mediante PostgREST. Lógica compleja (certificados, reportes MinTrabajo, login portal) en **Edge Functions**.  
5. **Manejo de Archivos:** Las rutas de archivos (firmas, documentos de matrícula, adjuntos de personal) deben almacenarse preparadas para integración con **Supabase Storage**.

## ---

**FASE 1: Fundamentos y Entidades Maestras**

**Descripción Funcional:** Configuración de los catálogos base del sistema. Soporta los módulos de configuración de la academia, asegurando que los datos que alimentan los selectores y formularios dinámicos del frontend estén centralizados.

### **Capacidades Funcionales (Soporte al Frontend):**

* **Directorio de Empresas (EmpresasPage):** Soporta creación, edición, y un panel de **Tarifas por Empresa** (tarifas\_empresa) vinculadas a niveles de formación (NivelesHabilitacionGrid.tsx). Búsqueda multicampo indexada.  
* **Gestión de Personal (GestionPersonalPage):** Almacenamiento de datos del staff, cargos dinámicos (GestionCargosModal.tsx), captura de firmas (FirmaPersonal.tsx) y subida de archivos anexos (AdjuntosPersonal.tsx).  
* **Niveles de Formación (NivelFormPage):** Soporta la creación de campos de formulario dinámicos (CampoAdicionalModal.tsx, CampoPreview.tsx) y la configuración paramétrica del **Código de Estudiante** (CodigoEstudianteCard.tsx).

### **Estructuras Core:**

* **empresas**: nit (UNIQUE), datos de contacto, sector económico, ARL (catálogo). Trigger para validar duplicidad.  
* **tarifas\_empresa**: UNIQUE(empresa\_id, nivel\_formacion\_id).  
* **personal & personal\_adjuntos**: Control de firmas (Base64/URL) y roles restrictivos (Entrenador, Supervisor).  
* **niveles\_formacion**: Campos documentos\_requeridos (Array) y campos\_adicionales (JSONB) para flexibilidad.

## ---

**FASE 2: Gestión Académica Core**

**Descripción Funcional:** Manejo de los individuos (estudiantes) y la planeación de la oferta académica. Es el puente entre los catálogos y las matrículas transaccionales.

### **Capacidades Funcionales (Soporte al Frontend):**

* **Directorio de Personas (PersonasPage):** Creación rápida de personas (CrearPersonaModal.tsx). Validación de datos mínimos de emergencia (JSONB). Restricción de duplicidad de números de identidad.  
* **Programación de Cursos (CursosListView, CursosCalendarioView):** \* Generación masiva de cursos regulares (GeneracionMasivaDialog.tsx).  
  * Asignación obligatoria de personal validando su cargo (Entrenador vs Supervisor).  
  * Control de Cierre ante MinTrabajo (MinTrabajoCard.tsx) e ingreso de fechas adicionales autorizadas (AddFechaMinTrabajoDialog.tsx).  
  * Autogeneración del nombre del curso basado en el consecutivo y el tipo de formación.

### **Estructuras Core:**

* **personas**: numero\_documento (UNIQUE). Check constraint sobre contacto\_emergencia (obligatorio nombre y teléfono).  
* **cursos**: Campos de control de aforo (capacidad\_maxima), vinculación de staff, y estados de ciclo de vida (abierto, en\_progreso, cerrado).  
* **Edge Function exportar-csv-mintrabajo**: Consolida datos de cursos cerrados y sus estudiantes en el formato exacto requerido por el Ministerio.

## ---

**FASE 3: Transaccionalidad y Formularios (Matrículas)**

**Descripción Funcional:** Es el corazón del sistema. Gestiona la inscripción del estudiante a un curso o nivel, capturando toda su información de salud, firmas, documentos y respuestas a formatos obligatorios.

### **Capacidades Funcionales (Soporte al Frontend):**

* **El Expediente de Matrícula (MatriculaDetallePage, MatriculaDetailSheet):**  
  * **Snapshot Inmutable:** Al matricular, se copia la información laboral de la empresa para evitar alteraciones si la empresa cambia de razón social en el futuro.  
  * **Módulo de Salud y Autorizaciones:** Soporta los componentes ConsentimientoSalud.tsx y FirmaCaptura.tsx.  
  * **Carga Documental Sincronizada:** El sistema autogenera los requerimientos documentales (DocumentosCarga.tsx) basándose en el nivel de formación asignado mediante la Edge Function sync-matricula-documentos.  
  * **Gestión de Excepciones (ExcepcionesPanel.tsx, RevocacionDialog.tsx):** Flujo de aprobación para certificar a un estudiante al que le faltan requisitos normativos.  
* **Motor de Formatos Dinámicos (FormatoEditorPage, FormatosList):**  
  * Soporte para el BloqueInspector.tsx (Tipos de bloque: texto, firmas, evaluación, encuestas).  
  * Función de resolución de contexto (resolve-formato-context) que inyecta los datos reales de la matrícula, persona, y curso dentro de las plantillas (tokens {{grupo.campo}}) para renderizarlas (DynamicFormatoDocument.tsx).

### **Estructuras Core:**

* **matriculas**: Tabla extensa con columnas de historial, vinculación laboral, y campos calculados generados automáticamente (ej. pagado).  
* **documentos\_matricula**: Instancias de los documentos subidos (estado: pendiente/cargado).  
* **formatos, versiones\_formato y formato\_respuestas**: Arquitectura que guarda el formato maestro, versiona los cambios históricos y registra las respuestas específicas del estudiante.

## ---

**FASE 4: Gestión Financiera y Certificación**

**Descripción Funcional:** Cierra el ciclo de la formación. Controla las deudas de empresas o independientes, emite facturas, registra pagos y genera el diploma final (certificado) asegurando el cumplimiento de reglas normativas.

### **Capacidades Funcionales (Soporte al Frontend):**

* **Módulo de Cartera (CarteraPage, GrupoCarteraDetallePage):**  
  * Soporta los diálogos CrearFacturaDialog.tsx y RegistrarPagoDialog.tsx.  
  * **Recálculo Automático:** Si se inserta un pago, el backend recalcula el saldo del grupo de cartera y sincroniza el estado de "pagado" directamente en las matrículas de los estudiantes involucrados (ActividadCarteraSection.tsx).  
* **Motor de Certificación (PlantillasPage, PlantillaEditorPage):**  
  * Gestión de plantillas SVG (PlantillaTestDialog.tsx, PlantillaVersionHistory.tsx).  
  * **Edge Function de Emisión:** La función generar-certificado evalúa reglas (¿Tiene todo pagado? ¿Subió documentos? ¿Tiene excepciones aprobadas?). Si aprueba, genera el código único y congela un JSON snapshot del diploma (HistorialCertificadosPage.tsx).

### **Estructuras Core:**

* **responsables\_pago y grupos\_cartera**: Arquitectura financiera que permite agrupar múltiples matrículas bajo una sola entidad facturable.  
* **facturas y pagos**: Triggers de recalculo asíncrono para mantener balances (saldo) en tiempo real.  
* **plantillas\_certificado y certificados**: Sistema inmutable de diplomas con versionado.

## ---

**FASE 5: Portal del Estudiante y Monitoreo Administrativo**

**Descripción Funcional:** Subsistema de autoservicio para el aprendiz, donde interactúa con la plataforma de forma remota, y las herramientas del administrador para auditar dicho uso.

### **Capacidades Funcionales (Soporte al Frontend):**

* **Portal Estudiante (AccesoEstudiantePage, PanelDocumentosPage):**  
  * Ingreso protegido mediante número de documento y validación de vigencia del curso (PortalGuard.tsx).  
  * Visualización de documentos en estado lectura o interactivo (DocumentoRendererPage.tsx, EvaluacionPage.tsx).  
  * Revisión de evaluaciones (QuizReviewCard.tsx).  
* **Panel de Configuración Admin (PortalAdminPage):**  
  * Control global de qué documentos/formatos ve el estudiante según su nivel de formación (DocumentosCatalogoTable.tsx, NivelesHabilitacionGrid.tsx).  
  * Auditoría de progreso de los estudiantes (MonitoreoTable.tsx, MonitoreoDetalleDialog.tsx).

### **Estructuras Core:**

* **portal\_config\_global**: JSON de configuración maestra de documentos expuestos.  
* **documentos\_portal**: Instancias del progreso de un estudiante en el portal (estado: bloqueado/pendiente/completado). Manejo de dependencias (un documento no se desbloquea hasta que se firma el anterior).  
* **RPC login\_portal\_estudiante(cedula)**: Función de base de datos que emite un JWT de Supabase extremadamente restrictivo (vía RLS), que permite al estudiante ver *únicamente* los datos de su propia matrícula activa.

## ---

**FASE 6: Analíticas y Comentarios Globales**

**Descripción Funcional:** Herramientas de soporte operativo transversal y dashboard de toma de decisiones.

### **Capacidades Funcionales (Soporte al Frontend):**

* **Dashboard Principal (Dashboard.tsx):**  
  * Soporte para métricas clave (StatCard.tsx) y visualización de datos de negocio (DashboardCharts.tsx).  
  * Widgets de tareas pendientes (TodoWidget.tsx).  
* **Comentarios Transversales (ComentariosSection.tsx):**  
  * Un sistema de notas polimórfico utilizado en la matrícula, en la cartera y en la observación de cursos.

### **Estructuras Core:**

* **Funciones SQL para Dashboard:** get\_dashboard\_stats() y get\_dashboard\_charts\_data(periodo) para cálculos agregados rápidos (ingresos del mes, matrículas por estado).  
* **comentarios**: Tabla con entidad\_tipo y entidad\_id para resolver notas en cualquier parte del sistema sin duplicar tablas de comentarios.