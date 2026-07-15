# SRS - SIGE-DP (Sistema de Gestión de Cumplimiento de Datos Personales)
## Especificación de Requerimientos de Software - Fase 1
**Proyecto:** Implementación Ley 21.719 (Protección de Datos Personales) en la Administración del Estado.
**Fecha Límite Legal:** 1 de diciembre de 2026.
**Objetivo:** Ser una "Guía Metodológica Interactiva" que automatice, monitorice y facilite el cumplimiento normativo, mejorando significativamente el enfoque manual del documento base.

---

## 1. Introducción

### 1.1 Propósito
Este documento especifica los requisitos para una aplicación web que guíe a los órganos de la Administración del Estado de Chile en la implementación de la nueva Ley de Protección de Datos Personales (Ley 21.719). La aplicación no es un simple checklist, sino un **"Project Manager Especializado"** que asiste activamente mediante automatizaciones inteligentes (generación de documentos, cálculo de riesgos, flujos de aprobación y alertas predictivas).

### 1.2 Alcance
- **Incluye:** Gestión de proyectos, dashboard con indicadores, wizard interactivo para levantamiento, motor de riesgos, generador de documentos autocompletados, workflow de aprobación, módulo de proveedores, trazabilidad de auditoría y reportes ejecutivos.
- **Excluye (Fase 2):** Integración directa con sistemas operacionales (Oracle, SAP), ejecución de medidas técnicas de seguridad (encriptación) o anonimización de datos.

---

## 2. Usuarios y Roles

| Rol | Descripción | Permisos Clave |
| :--- | :--- | :--- |
| **Jefe de Servicio** | Autoridad máxima. | Designa encargado, aprueba documentos finales, visión global del dashboard. |
| **Encargado/a Responsable** | Coordinador del proyecto. | Administración total: editar fases, asignar tareas, gestionar flujos, generar documentos, ver todas las áreas. |
| **Comité Ejecutivo** | Representantes de áreas legales, TI, control de gestión. | Revisar y comentar documentos, participar en aprobaciones intermedias. |
| **Responsable de Área** | Jefatura de división/departamento. | Completar asistentes (wizard), subir evidencias, ejecutar tareas asignadas. |
| **Invitado/Colaborador** | Funcionario sin gestión. | Solo lectura de documentos públicos del proyecto. |

---

## 3. Requisitos Funcionales (Por Módulos)

### Módulo 1: Configuración Inicial del Proyecto
| ID | Requisito | Detalle Técnico/UX |
| :--- | :--- | :--- |
| **RF-01** | Creación de proyecto | El Jefe o Encargado crea el proyecto con nombre, fecha inicio (defecto Dic 2025) y fecha fin (defecto Dic 2026). |
| **RF-02** | Carga de estructura base | El sistema precarga automáticamente las **6 fases** y sus tareas según el Anexo A. |
| **RF-03** | Designación de encargado | Formulario para asignar a un funcionario como Encargado, otorgándole permisos de admin. |
| **RF-04** | Gestión de áreas | CRUD de divisiones/departamentos. Asignación de un responsable de área por cada una. |

### Módulo 2: Dashboard y Panel de Control (MEJORA: Camino Crítico)
| ID | Requisito | Detalle Técnico/UX |
| :--- | :--- | :--- |
| **RF-05** | Indicador global de avance | Medidor circular que muestra el % de cumplimiento total (cálculo ponderado según Anexo B). |
| **RF-06** | Progreso por fase | Tarjetas (cards) con % individual, color de estado (Pendiente/Gris, Progreso/Amarillo, Completada/Verde, Atrasada/Rojo). |
| **RF-07** | **Camino Crítico** | El sistema calcula dependencias (ej. Fase 6 depende de Fase 2). Si una tarea crítica se atrasa, muestra una alerta prominente: *"Advertencia: Para cumplir con la fecha legal, debes finalizar [Tarea X] antes del [Fecha]"*. |
| **RF-08** | Contador regresivo | Días, horas y minutos restantes hasta el 1 de diciembre de 2026. |
| **RF-09** | Actividad reciente | Feed en tiempo real: "Área X completó la matriz", "Comité aprobó la Política". |

### Módulo 3: Levantamiento de Información (MEJORA: Wizard y Mapa de Flujo)
| ID | Requisito | Detalle Técnico/UX |
| :--- | :--- | :--- |
| **RF-10** | **Asistente (Wizard)** | Reemplaza el Excel. Guía al responsable de área con preguntas secuenciales (ej. "¿Qué datos recolecta?", "¿Son sensibles?", "¿Con qué finalidad?"). Las respuestas alimentan la matriz en segundo plano. |
| **RF-11** | **Mapa de flujo visual** | Interfaz "arrastrar y soltar" nodos (Origen → Proceso → Almacenamiento → Destinatario). El sistema traduce este gráfico a texto en la matriz. |
| **RF-12** | Validación en tiempo real | El sistema impide pasar al siguiente paso si faltan campos obligatorios (ej. base legal, finalidad). |
| **RF-13** | Consolidación automática | Una vez que el 100% de las áreas completan el wizard, la app genera una "Matriz Maestra" unificada accesible para el Encargado. |

### Módulo 4: Motor de Riesgos e Informe de Hallazgos (MEJORA: Automatización)
| ID | Requisito | Detalle Técnico/UX |
| :--- | :--- | :--- |
| **RF-14** | **Cálculo de riesgo semi-automatizado** | Basado en reglas predefinidas (ej. Dato sensible + Transferencia internacional = Riesgo Alto; Volumen > 10k registros + IA = Riesgo Medio). Se asigna puntuación a cada tratamiento. |
| **RF-15** | Mapa de calor | Visualización por área con colores (Rojo: Alto, Amarillo: Medio, Verde: Bajo) para identificar focos críticos. |
| **RF-16** | **Generación automática del Informe** | El sistema redacta un borrador del "Informe de Hallazgos" en Word/PDF, extrayendo las conclusiones y brechas detectadas. El Encargado solo valida y edita mínimamente. |

### Módulo 5: Generador de Documentos (MEJORA: Autocompletado)
| ID | Requisito | Detalle Técnico/UX |
| :--- | :--- | :--- |
| **RF-17** | Plantillas precargadas | El sistema contiene las plantillas oficiales de: Catálogo de Datos, Política de Tratamiento, Anexos de Contratos y Protocolos. |
| **RF-18** | **Autocompletado inteligente** | Al llegar a la Fase 4 o 5, la app inyecta automáticamente los datos de la matriz (ej. listado de datos, finalidades, medidas de seguridad) dentro de las plantillas, generando un borrador completo al 70%. |
| **RF-19** | Editor colaborativo | Editor WYSIWYG para que los usuarios ajusten los borradores y dejen comentarios anclados a párrafos específicos. |
| **RF-20** | Exportación y firma | Botón "Generar PDF final" y opción de flujo de firma digital (o acta de constancia). |

### Módulo 6: Workflow de Aprobación y Comité (MEJORA: Trazabilidad)
| ID | Requisito | Detalle Técnico/UX |
| :--- | :--- | :--- |
| **RF-21** | Envío a revisión del Comité | Botón que notifica a todos los miembros del Comité para que dejen observaciones dentro de la plataforma (no por correo externo). |
| **RF-22** | Estados del documento | Flujo: `Borrador → En revisión del Comité → Aprobado por Comité → Enviado a Jefe → Firmado/Aprobado`. |
| **RF-23** | Notificaciones automáticas | Alertas in-app y por correo para cambios de estado, @menciones y vencimiento de plazos. |
| **RF-24** | **Acta de aprobación** | Al finalizar el flujo, el sistema genera un acta en PDF con los comentarios, votos y fecha, almacenándola en el repositorio del proyecto. |

### Módulo 7: Gestión de Terceros y Proveedores (NUEVO)
| ID | Requisito | Detalle Técnico/UX |
| :--- | :--- | :--- |
| **RF-25** | Registro de proveedores | Formulario para que cada área registre externos (RUT, servicio, fechas contrato, datos que tratan). |
| **RF-26** | **Generación de anexo legal** | Botón que genera el "Anexo de Protección de Datos" prellenado según el formato de la guía, listo para adjuntar a licitaciones. |
| **RF-27** | **Alertas de renovación** | Configurar alerta automática con 6 meses de anticipación a la fecha de término del contrato, recordando actualizar cláusulas. |

### Módulo 8: Trazabilidad y Auditoría
| ID | Requisito | Detalle Técnico/UX |
| :--- | :--- | :--- |
| **RF-28** | Registro de auditoría (Logs) | Cada acción (creación, edición, aprobación) se almacena con usuario, fecha, hora y cambios (JSON diff). |
| **RF-29** | **Reporte de Evidencias (ZIP)** | Al finalizar, la app compila todas las matrices, actas, políticas, logs y aprobaciones en un solo archivo comprimido estructurado por fases, ideal para fiscalización. |

### Módulo 9: Reportes
| ID | Requisito | Detalle Técnico/UX |
| :--- | :--- | :--- |
| **RF-30** | Reporte Ejecutivo (PDF) | Resumen de avance global, por fase, riesgos principales y estado de documentos. |
| **RF-31** | Matriz de Responsabilidades (Excel) | Tabla exportable con tareas, responsables, fechas y estado. |
| **RF-32** | Exportación de datos (JSON/CSV) | Para interoperabilidad futura con sistemas de Fase 2 (Oracle, etc.). |

---

## 4. Requisitos No Funcionales

| ID | Requisito | Especificación |
| :--- | :--- | :--- |
| **RNF-01** | Seguridad | Autenticación obligatoria con **ClaveÚnica** (OpenID Connect). Roles y permisos granularidad a nivel de área. Cifrado TLS 1.3 en tránsito y AES-256 en reposo. |
| **RNF-02** | Rendimiento | Dashboard carga en < 2 segundos. Soporte para 200+ usuarios concurrentes (mínimo). |
| **RNF-03** | Escalabilidad | Arquitectura modular (microservicios) para permitir agregar integraciones en Fase 2. |
| **RNF-04** | Disponibilidad | 99.5% uptime. Respaldos automáticos diarios de la BD. |
| **RNF-05** | Usabilidad | Diseño 100% responsive (escritorio, tablet, móvil). Cumplimiento WCAG 2.1 AA (accesibilidad). |
| **RNF-06** | Mantenibilidad | Código documentado en línea. Pruebas unitarias y de integración automatizadas (CI/CD). |

---

## 5. Modelo de Datos (Entidades Principales)

- **Usuario**: `id`, `nombre`, `email`, `rol`, `area_id`, `claveUnica_token`
- **Area**: `id`, `nombre`, `descripcion`, `responsable_id`
- **Proyecto**: `id`, `nombre`, `fecha_inicio`, `fecha_fin`, `estado`
- **Fase**: `id`, `nombre`, `orden`, `fecha_inicio_plan`, `fecha_fin_plan`, `ponderacion`, `proyecto_id`
- **Tarea**: `id`, `nombre`, `descripcion`, `fase_id`, `area_responsable_id`, `usuario_asignado_id`, `fecha_inicio`, `fecha_fin`, `estado`, `dependencia_de` (autoreferencia)
- **MatrizLevantamiento**: `id`, `area_id`, `datos_json` (estructura con los 14 campos de la guía), `completada` (boolean)
- **Riesgo**: `id`, `matriz_id`, `nivel` (bajo/medio/alto), `descripcion`, `puntuacion`
- **Documento**: `id`, `tipo` (catalogo, politica, protocolo, anexo), `contenido` (texto largo), `version`, `estado` (borrador, revision, aprobado)
- **Comentario**: `id`, `documento_id`, `usuario_id`, `texto`, `fecha`, `parent_id`
- **FlujoAprobacion**: `id`, `documento_id`, `estado_actual`, `usuario_origen`, `usuario_destino`, `fecha`
- **Proveedor**: `id`, `nombre`, `rut`, `servicio`, `fecha_contrato_inicio`, `fecha_contrato_fin`, `area_id`
- **LogAuditoria**: `id`, `usuario_id`, `accion`, `entidad_afectada`, `fecha_hora`, `detalle_json`

---

## 6. Descripción de la Interfaz (UI/UX)

### 6.1 Dashboard Principal
- **Header:** Logo del organismo, título del proyecto, selector de área (si aplica), avatar de usuario.
- **Resumen superior:** Tarjeta circular con % global, contador de días restantes, fase activa destacada.
- **Fases (Cards):** 6 tarjetas horizontales con barra de progreso, estado y acceso directo.
- **Camino Crítico:** Diagrama de Gantt simplificado que resalta en rojo la tarea que define la fecha de fin.
- **Actividad Reciente:** Feed tipo timeline.

### 6.2 Asistente de Levantamiento (Wizard)
- Paso a paso con barra lateral de progreso.
- Preguntas en formato claro (ej. "Seleccione el proceso", "¿Comparte estos datos con terceros?").
- Tooltips emergentes con definiciones legales (ej. "¿Qué es un dato sensible?").
- Al final, resumen editable y botón "Guardar y Finalizar".

### 6.3 Editor de Documentos
- Vista dividida: Índice (izq) / Texto editable centro (con campos mágicos como `{{catalogo}}`) / Comentarios (dcha).
- Botones contextuales: "Solicitar Revisión", "Aprobar", "Generar PDF".

---

## 7. Anexos

### Anexo A: Fases y Tareas Base (Cronograma)

| Fase | Fechas Base | Tareas Clave | Entregable |
| :--- | :--- | :--- | :--- |
| **F1: Primeros Pasos** | Dic 2025 - Ene 2026 | 1. Designar Encargado. 2. Configurar proyecto en app. 3. Comunicación interna. | Acta de designación. |
| **F2: Levantamiento** | Ene 2026 - Abr 2026 | 1. Completar Wizard por cada Área. 2. Consolidar matrices. | Matriz Maestra. |
| **F3: Análisis y Comité** | Abr 2026 | 1. Generar Informe (automático). 2. Constituir Comité. | Informe de Hallazgos. |
| **F4: Catálogo** | May 2026 - Jun 2026 | 1. Generar borrador (autocompletado). 2. Revisión Comité. | Catálogo de Datos. |
| **F5: Política** | Jul 2026 | 1. Generar borrador (autocompletado). 2. Aprobación Jefe Servicio. | Política de Tratamiento. |
| **F6: Protocolos** | Ago 2026 - Nov 2026 | 1. Priorizar riesgos. 2. Redactar protocolos asignados. | Protocolos específicos. |

### Anexo B: Ponderación para Cálculo de Cumplimiento Global

| Fase | Ponderación |
| :--- | :--- |
| F1: Primeros Pasos | 10% |
| F2: Levantamiento | 25% |
| F3: Análisis y Comité | 15% |
| F4: Catálogo | 15% |
| F5: Política | 15% |
| F6: Protocolos | 20% |
| **Total** | **100%** |

### Anexo C: Criterios de Aceptación (Pruebas Clave)
1.  **Wizard:** No permite finalizar si faltan campos obligatorios.
2.  **Riesgos:** Asigna correctamente "Alto" si el dato es sensible + se transfiere al extranjero.
3.  **Autocompletado:** El documento de Política incluye textualmente los datos cargados en la matriz.
4.  **Flujo:** Al enviar a revisión, el Comité recibe notificación y el estado del documento cambia.
5.  **Camino Crítico:** Si una tarea crítica se marca como "Atrasada", el dashboard muestra la alerta roja.
6.  **Evidencias:** El ZIP descargado contiene al menos 1 documento de cada fase completada.

---

## 8. Tecnologías Sugeridas

- **Frontend:** React 18+ con TypeScript, utilizando Material-UI o PrimeReact para componentes.
- **Backend:** Node.js con NestJS o Python con Django (por facilidad de integración con ClaveÚnica).
- **Base de Datos:** PostgreSQL (soporte nativo para JSONB).
- **Almacenamiento:** AWS S3 o MinIO para documentos.
- **Autenticación:** OpenID Connect (ClaveÚnica) + JWT.

---

## 9. Entregables del Desarrollo

1.  Código fuente completo (Frontend + Backend) con README.
2.  Scripts de migración de Base de Datos.
3.  Manual de Usuario (PDF).
4.  Manual Técnico de Despliegue.
5.  Suite de pruebas automatizadas (Unitarias + E2E con Cypress).
6.  Enlace a entorno de demostración con datos de muestra precargados.

---

**Fin del Documento de Requerimientos.**