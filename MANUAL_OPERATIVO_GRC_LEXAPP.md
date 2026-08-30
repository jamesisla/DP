# 📘 MANUAL OPERATIVO Y GUÍA DE CUMPLIMIENTO REGULATORIO DUAL
## LEXAPP GRC HUB · LEY N° 21.719 (DATOS PERSONALES) & LEY N° 21.663 (CIBERSEGURIDAD ANCI)

---

> **Organismo:** Servicio Público de la Administración del Estado / Institución Privada Obligada  
> **Versión del Manual:** 2.0 (Producción)  
> **Ámbito de Aplicación:** Jefatura de Servicio, Delegado/a de Protección de Datos (DPO), Oficial de Seguridad de la Información (CISO), Jefaturas de División, Equipos TI y Asesoría Jurídica.  
> **Plataforma:** LexApp GRC Hub Interoperable  

---

## 📑 ÍNDICE GENERAL

1. [INTRODUCCIÓN & MARCO REGULATORIO DUAL](#1-introducción--marco-regulatorio-dual)
2. [ROLES Y RESPONSABILIDADES EN LA PLATAFORMA](#2-roles-y-responsabilidades-en-la-plataforma)
3. [SUITE DE PROTECCIÓN DE DATOS PERSONALES (LEY N° 21.719)](#3-suite-de-protección-de-datos-personales-ley-n-21719)
   * 3.1. Registro de Actividades de Tratamiento (RAT) por División (Art. 15)
   * 3.2. Gestión de Solicitudes ARCO+ y Plazo de 15 Días Hábiles (Art. 8 al 12)
   * 3.3. Notificación Perentoria de Brechas de Seguridad en 72 Horas (Art. 18)
   * 3.4. Evaluaciones de Impacto EIPD / DPIA y Wizard de 9 Criterios (Art. 25)
   * 3.5. Contratos DPA y Transferencias Internacionales SCC (Art. 16 y 28)
   * 3.6. Simulador de Multas y Cuantificación de Atenuantes (Art. 50 al 52)
4. [SUITE DE CIBERSEGURIDAD E INFRAESTRUCTURA CRÍTICA (LEY N° 21.663 - ANCI)](#4-suite-de-ciberseguridad-e-infraestructura-crítica-ley-n-21663---anci)
   * 4.1. Catálogo de Activos RSIC/OIV y Script de Hardening Técnico
   * 4.2. Botón de Pánico y Flujo de Alerta Temprana en Menos de 3 Horas (Art. 8)
   * 4.3. Acta Oficial de Cadena de Custodia Forense Digital (Ley N° 21.459)
   * 4.4. Generador de Resoluciones Exentas Oficiales (PSI, PRI, BCP/DRP)
   * 4.5. Canal CVD Ético y Divulgación Coordinada de Vulnerabilidades (Art. 12)
   * 4.6. Simulador Mock Audit ANCI y Sellado Criptográfico SHA-256
5. [CORRELACIÓN CRUZADA BIDIRECCIONAL & VENTANILLA CIUDADANA](#5-correlación-cruzada-bidireccional--ventanilla-ciudadana)
   * 5.1. Motor de Correlación Cruzada en Tiempo Real (Wazuh SIEM ➔ ANCI + DPO)
   * 5.2. Portal Público Ciudadano y Radicación con Folio Único
   * 5.3. Informe Consolidado Ejecutivo GRC para la Jefatura de Servicio
6. [GUÍA TÉCNICA DE DESPLIEGUE Y MANTENIMIENTO EN PRODUCCIÓN (OCI)](#6-guía-técnica-de-despliegue-y-mantenimiento-en-producción-oci)
   * 6.1. Procedimiento de Actualización con `./update.sh`
   * 6.2. Arquitectura de Doble Motor (Python FastAPI & Go Chi Monolito WAL)
   * 6.3. Protocolo de Respaldo Inmutable WORM
7. [CHECKLIST DE PREPARACIÓN ANTE FISCALIZACIONES REGULATORIAS](#7-checklist-de-preparación-ante-fiscalizaciones-regulatorias)

---

## 1. INTRODUCCIÓN & MARCO REGULATORIO DUAL

El Estado de Chile ha promulgado dos cuerpos normativos que transforman radicalmente la gestión de la información, el riesgo tecnológico y los derechos fundamentales de las personas:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MARCO LEGAL INTEGRADO EN CHILE                                   │
├────────────────────────────────────────────────┬────────────────────────────────────────────────┤
│ 🛡️ LEY N° 21.719 (PROTECCIÓN DE DATOS)          │ 🔒 LEY N° 21.663 (CIBERSEGURIDAD ANCI)         │
├────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ • Regula el tratamiento lícito de datos.       │ • Protege Infraestructuras Críticas (RSIC/OIV).│
│ • Crea la Agencia de Protección de Datos.      │ • Crea la Agencia Nacional de Ciberseguridad.  │
│ • Plazo perentorio de 15 días hábiles ARCO+.   │ • Plazo perentorio de 3 horas para alerta ANCI.│
│ • Notificación de brechas en < 72 horas.       │ • Controles mínimos: Cifrado, MFA y WORM.      │
│ • Multas de hasta 20.000 UTM (~$1.320M CLP).   │ • Sanciones, sumarios e intervención CSIRT.    │
└────────────────────────────────────────────────┴────────────────────────────────────────────────┘
```

**LexApp GRC Hub** es la plataforma transaccional diseñada para unificar el cumplimiento de ambas normativas en una única consola operativa, eliminando la duplicidad de esfuerzos entre los equipos de Ciberseguridad (CISO), Privacidad (DPO), Jurídica y las Divisiones operativas.

---

## 2. ROLES Y RESPONSABILIDADES EN LA PLATAFORMA

| Rol en el Sistema | Responsable Típico | Atribuciones y Acciones Principales |
| :--- | :--- | :--- |
| **Jefatura de Servicio / Dirección** | Director Nacional / Gerente General | Firma de Resoluciones Exentas (PSI/PRI/BCP), revisión del Índice Global GRC y asignación presupuestaria. |
| **Delegado/a de Protección de Datos (DPO)** | Abogado/a Especialista / Oficial DPO | Supervisión del Registro RAT, validación de EIPD (Art. 25), notificación de brechas 72h y resolución ARCO+. |
| **Oficial de Ciberseguridad (CISO)** | Jefe de Seguridad TI / Enlace ANCI | Activación del Botón de Pánico (3h), gestión de activos RSIC, custodia forense (Ley 21.459) y canal CVD. |
| **Jefaturas de División / Área** | Jefes de TI, Finanzas, Personas, etc. | Levantamiento de tratamientos de datos de su área, reporte de proveedores críticos y activos asignados. |
| **Investigadores Éticos / Hackers White Hat** | Comunidad Externa de Seguridad | Envío anónimo o reconocido de vulnerabilidades mediante el Canal CVD Ético bajo política Safe Harbor. |
| **Ciudadanía / Titulares de Datos** | Ciudadanos / Usuarios | Radicación de solicitudes ARCO+ y seguimiento en tiempo real mediante Folio Único sin necesidad de login. |

---

## 3. SUITE DE PROTECCIÓN DE DATOS PERSONALES (LEY N° 21.719)

### 3.1. Registro de Actividades de Tratamiento (RAT) por División (Art. 15)
* **Objetivo:** Contar con un inventario exhaustivo de todos los tratamientos de datos personales que realiza cada unidad de la institución.
* **Procedimiento Operativo:**
  1. Ingrese a la sección **"Matriz de Levantamiento"**.
  2. Seleccione el Área o División (ej. *Tecnologías de la Información, Gabinete, Gestión de Personas*).
  3. Complete los campos obligatorios:
     - **Nombre del Tratamiento:** Identificación unívoca (ej. *Registro de Remuneraciones, Registro de Visitas*).
     - **Finalidad Específica:** Justificación clara y proporcional.
     - **Base de Licitud (Art. 13):** Obligación Legal, Misión de Interés Público, Ejecución Contractual o Consentimiento Expreso.
     - **Categorías de Datos:** Identificación de datos sensibles (salud, biometría, etc.).
     - **Plazo de Conservación:** Tiempo de retención previo a borrado seguro.
  4. Presione **"Guardar Matriz"**. El sistema actualizará el porcentaje de cumplimiento del área en el Dashboard Ejecutivo.

### 3.2. Gestión de Solicitudes ARCO+ y Plazo de 15 Días Hábiles (Art. 8 al 12)
* **Objetivo:** Atender y resolver las solicitudes ciudadanas de **Acceso, Rectificación, Cancelación, Oposición, Portabilidad y Bloqueo** dentro del plazo legal improrrogable de 15 días hábiles.
* **Procedimiento Operativo:**
  1. Al ingresar una solicitud (vía Ventanilla Ciudadana o presencial), el sistema genera un **Folio Único** y calcula automáticamente la fecha de vencimiento excluyendo fines de semana y feriados legales.
  2. Ingrese a **"Derechos ARCO+"** para revisar el listado de casos ordenados por urgencia.
  3. Si el semáforo está en **Amarillo (< 5 días)** o **Rojo (Vencido)**, priorice la derivación a la división correspondiente.
  4. Redacte el **Fundamento de Respuesta** y seleccione el estado final (*Respondida Favorable* o *Rechazada Fundada* con base en causales del Art. 10).
  5. Presione **"Emitir Resolución ARCO+"** para generar el documento de respuesta descargable en Markdown/PDF.

### 3.3. Notificación Perentoria de Brechas de Seguridad en 72 Horas (Art. 18)
* **Objetivo:** Notificar a la Agencia de Protección de Datos y a los titulares afectados cualquier incidente que comprometa la confidencialidad, integridad o disponibilidad de datos personales en un plazo máximo de 72 horas.
* **Procedimiento Operativo:**
  1. Ingrese a **"Brechas de Datos"** y presione **"Reportar Brecha"**.
  2. El sistema iniciará inmediatamente un **reloj reactivo en cuenta regresiva** `72:00:00`.
  3. Consigne la estimación de titulares afectados, naturaleza de los datos filtrados y medidas de contención inmediatas.
  4. Presione el botón **"Descargar Notificación Oficial Agencia (MD)"** para obtener el formulario formal exigido por la Agencia Nacional de Protección de Datos Personales.

### 3.4. Evaluaciones de Impacto EIPD / DPIA y Wizard de 9 Criterios (Art. 25)
* **Objetivo:** Justificar la legalidad y salvaguardas técnicas en tratamientos de alto riesgo (videovigilancia masiva, biometría, perfilamiento de personas o IA).
* **Procedimiento Operativo:**
  1. Ingrese a **"Riesgos & Sanciones"** ➔ Pestaña **"Evaluaciones EIPD (Art. 25)"**.
  2. Presione **"Nueva Evaluación EIPD (Wizard)"**.
  3. Marque los **Criterios Oficiales de Alto Riesgo** que concurran en el proyecto (si concurren $\ge 2$, la EIPD es obligatoria por ley).
  4. Complete el análisis de necesidad, salvaguardas (cifrado AES-256, seudonimización) y el **Dictamen Vinculante del DPO**.
  5. Presione **"Guardar y Sellar EIPD"**. El sistema generará un sello criptográfico **SHA-256** inmutable.
  6. Presione **"Descargar Dictamen (MD)"** para anexar la resolución al expediente administrativo del proyecto.

### 3.5. Contratos DPA y Transferencias Internacionales SCC (Art. 16 y 28)
* **Objetivo:** Blindar la responsabilidad del organismo frente a proveedores de nube (AWS, Azure, OCI, Google) y servicios externos.
* **Procedimiento Operativo:**
  1. Ingrese a **"Proveedores & Terceros"**.
  2. Para proveedores locales: Descargue el **"Anexo DPA (Art. 16)"** que establece las cláusulas de confidencialidad y destrucción segura.
  3. Para proveedores con servidores en el extranjero (EE.UU., UE, etc.): Acceda a la pestaña **"Transferencias Internacionales"** y presione **"Acuerdo SCC (Art. 28)"** para exportar el contrato con Cláusulas Contractuales Tipo y sometimiento expreso a la Agencia de Datos chilena.

### 3.6. Simulador de Multas y Cuantificación de Atenuantes (Art. 50 al 52)
* **Objetivo:** Evaluar la exposición económica institucional y modelar el ahorro derivado de implementar medidas de responsabilidad proactiva.
* **Procedimiento Operativo:**
  1. Ingrese a **"Riesgos & Sanciones"** ➔ Pestaña **"Simulador de Sanciones"**.
  2. Seleccione el nivel de infracción (*Leve: 5.000 UTM, Grave: 10.000 UTM, Gravísima: 20.000 UTM*).
  3. Marque las atenuantes acreditadas (*DPO formalmente nombrado, Programa LexApp GRC activo, Cifrado técnico y cooperación inmediata*).
  4. El sistema calculará automáticamente la rebaja porcentual (hasta un 80%) y presentará el monto mitigado en UTM y pesos chilenos para justificar ante el Comité de Auditoría.

---

## 4. SUITE DE CIBERSEGURIDAD E INFRAESTRUCTURA CRÍTICA (LEY N° 21.663 - ANCI)

### 4.1. Catálogo de Activos RSIC/OIV y Script de Hardening Técnico
* **Objetivo:** Mantener el inventario certificado de Redes y Sistemas Informáticos Críticos exigido por la ANCI.
* **Procedimiento Operativo:**
  1. Ingrese a **"Activos Críticos RSIC"**.
  2. Registre cada servidor o base de datos indicando si reviste la calidad de **Infraestructura Crítica RSIC**.
  3. Verifique que cumpla la **Tríada Técnica Obligatoria**:
     - `[✓]` **Cifrado Activo:** AES-256 en reposo y TLS 1.3 en tránsito.
     - `[✓]` **MFA:** Autenticación multifactor para operadores.
     - `[✓]` **Respaldo Inmutable:** Copia de seguridad protegida contra ransomware (WORM).
  4. Presione **"Descargar Script Hardening Bash"** para obtener el archivo `lexapp_hardening_audit.sh` y ejecutarlo directamente en el servidor Linux para obtener una auditoría técnica en consola.

### 4.2. Botón de Pánico y Flujo de Alerta Temprana en Menos de 3 Horas (Art. 8)
* **Objetivo:** Cumplir con la obligación legal perentoria de notificar incidentes de ciberseguridad con impacto significativo a la ANCI en menos de 3 horas.
* **Procedimiento Operativo:**
  1. Ante una sospecha o alerta de ciberataque, presione el **"Botón de Pánico ANCI (3h)"** ubicado en la cabecera del sistema.
  2. El sistema iniciará la **cuenta regresiva legal de 3 horas** y asignará un código único (`INC-ANCI-YYYY-XXXX`).
  3. Consigne los **Indicadores de Compromiso (IoCs)** detectados: IPs de ataque, hashes SHA-256 de malware y URLs de comando y control (C2).
  4. Presione **"Descargar Oficio Oficial ANCI (MD)"** para remitir el reporte técnico al CSIRT Nacional antes del vencimiento del plazo.

### 4.3. Acta Oficial de Cadena de Custodia Forense Digital (Ley N° 21.459)
* **Objetivo:** Garantizar la validez jurídica de la evidencia digital para denuncias penales ante el Ministerio Público y auditorías del CSIRT.
* **Procedimiento Operativo:**
  1. En el incidente activo, acceda a **"Protocolo Forense Digital"**.
  2. Registre la ejecución de: **Volcado de memoria RAM, congelamiento de logs y aislamiento lógico de red**.
  3. El sistema sellará cada evidencia con su hash SHA-256 individual y número de precinto.
  4. Presione **"Cadena de Custodia (Ley 21.459)"** para descargar el acta judicial oficial con los campos de firma del CISO y del perito forense.

### 4.4. Generador de Resoluciones Exentas Oficiales (PSI, PRI, BCP/DRP)
* **Objetivo:** Disponer de los instrumentos normativos formalmente aprobados por la Jefatura de Servicio conforme a los estándares de la ANCI.
* **Procedimiento Operativo:**
  1. Ingrese a **"Políticas de Ciberseguridad"**.
  2. En la barra superior encontrará los botones de exportación de actos administrativos chilenos (*Vistos, Considerando, Resuelvo*):
     - **Resolución PRI (3h):** Aprueba el Plan de Respuesta a Incidentes y faculta al CISO a ordenar desconexiones preventivas de emergencia.
     - **Resolución BCP/DRP:** Fija metas de `RTO < 4h`, `RPO < 1h` y respaldos inmutables.
     - **Resolución PSI:** Aprueba la Política General de Seguridad de la Información y declara el catálogo de activos RSIC.
  3. Remita los documentos a la Jefatura de Servicio para su firma electrónica avanzada.

### 4.5. Canal CVD Ético y Divulgación Coordinada de Vulnerabilidades (Art. 12)
* **Objetivo:** Habilitar un canal seguro para que investigadores externos reporten fallas de seguridad bajo amparo de política Safe Harbor.
* **Procedimiento Operativo:**
  1. El canal está disponible públicamente desde la pantalla de login o mediante el botón superior **"Portal Ciudadano & CVD"**.
  2. El investigador puede calcular en vivo la severidad mediante la **Calculadora CVSS 3.1 integrada**.
  3. El equipo de ciberseguridad recibe el reporte en **"Canal CVD Ético"**, evalúa la viabilidad técnica, aplica el parche y actualiza el estado a *Mitigado / Cerrado / Reconocido*.

### 4.6. Simulador Mock Audit ANCI y Sellado Criptográfico SHA-256
* **Objetivo:** Realizar simulacros semestrales de fiscalización y verificar la inmutabilidad probatoria de los registros.
* **Procedimiento Operativo:**
  1. Ingrese a **"Auditoría ANCI"** ➔ Pestaña **"Simulador ANCI"**.
  2. Responda el cuestionario ponderado de requerimientos técnicos de la ley.
  3. Obtenga el **Certificado de Madurez de Ciberdefensa**.
  4. En la pestaña **"Verificador SHA-256"**, pegue el hash de cualquier documento o registro para verificar en milisegundos que no ha sufrido alteraciones.

---

## 5. CORRELACIÓN CRUZADA BIDIRECCIONAL & VENTANILLA CIUDADANA

### 5.1. Motor de Correlación Cruzada en Tiempo Real (Wazuh SIEM ➔ ANCI + DPO)
Cuando un evento de seguridad de alta severidad (Nivel 12+) es detectado en un servidor RSIC que almacena datos personales, la plataforma ejecuta la siguiente secuencia automática:

```
[Alerta Wazuh SIEM en Activo RSIC]
               │
               ▼
[WebHook / API Gateway LexApp GRC]
               │
      ┌────────┴────────┐
      ▼                 ▼
[Incidente CISO]  [Brecha DPO]
• Temporizador 3h • Temporizador 72h
• Oficio ANCI     • Vínculo a Matriz RAT (Área)
• Cadena Forense  • Notificación Agencia de Datos
```

### 5.2. Portal Público Ciudadano y Radicación con Folio Único
La plataforma dispone de un modal accesible **con y sin autenticación** que consolida:
* **Pestaña 1 (ARCO+):** Formulario de radicación con RUT/ClaveÚnica y rastreador por número de folio con cálculo de días hábiles restantes.
* **Pestaña 2 (CVD Ético):** Formulario para investigadores con calculadora de score CVSS en vivo.
* **Pestaña 3 (Transparencia Activa):** Política de privacidad web institucional y datos de contacto de los oficiales DPO y CISO.

### 5.3. Informe Consolidado Ejecutivo GRC para la Jefatura de Servicio
En la pestaña **"Informe Consolidado GRC"** de las vistas de auditoría, la dirección institucional dispone de:
* **Índice Global Consolidado GRC (%):** Promedio ponderado de madurez dual.
* **Semáforo Institucional de Riesgo:** Indicador de exposición a sumarios o sanciones.
* **Desempeño por División Institucional:** Tabla con el % de cumplimiento de privacidad y ciberseguridad de cada área (Gabinete, Jurídica, TI, etc.).
* **Plan de Acción Prioritario:** Lista priorizada de recomendaciones urgentes.
* **Botón de Descarga Oficial:** Exporta el informe ejecutivo completo en Markdown con sellos y actas de firma del DPO y CISO.

---

## 6. GUÍA TÉCNICA DE DESPLIEGUE Y MANTENIMIENTO EN PRODUCCIÓN (OCI)

### 6.1. Procedimiento de Actualización con `./update.sh`
El servidor de producción opera en una instancia Ubuntu en Oracle Cloud Infrastructure (OCI) bajo el directorio `/opt/sige-dp/`. Para actualizar el sistema con la última versión de `main`:

1. Conéctese vía SSH al servidor:
   ```bash
   ssh ubuntu@<IP_DEL_SERVIDOR_OCI>
   ```
2. Ejecute el script de actualización automatizado:
   ```bash
   cd /opt/sige-dp
   chmod +x update.sh
   ./update.sh
   ```
   *El script se encarga automáticamente de sincronizar git, aplicar migraciones a SQLite, compilar el frontend con Vite y reiniciar los servicios Systemd (`sige-dp.service` y `nginx`).*

### 6.2. Arquitectura de Doble Motor Backend
La plataforma cuenta con compatibilidad y paridad simétrica en dos motores:
* **Motor Python FastAPI:** Motor principal con ORM SQLAlchemy, Pydantic v2 y migraciones reactivas.
* **Motor Go Monolito WAL (Chi Router):** Motor de ultra alto rendimiento (< 1 ms de latencia y consumo de ~18 MB de RAM), ideal para alta concurrencia o despliegues en contenedores ultraligeros.

### 6.3. Protocolo de Respaldo Inmutable WORM
Conforme al mandato del Art. 8 de la Ley N° 21.663, las copias de seguridad de la base de datos `dp.db` deben sincronizarse diariamente hacia un bucket de almacenamiento seguro (OCI Object Storage / MinIO) configurado con política **WORM (Write Once, Read Many)** con retención bloqueada contra ransomware.

---

## 7. CHECKLIST DE PREPARACIÓN ANTE FISCALIZACIONES REGULATORIAS

Utilice este checklist de verificación previo a cualquier auditoría de la **Agencia de Protección de Datos Personales**, la **ANCI** o la **Contraloría General de la República**:

| Requisito Legal | Documento / Evidencia en LexApp GRC | Estado |
| :--- | :--- | :---: |
| **RAT Consolidado (Art. 15)** | Matriz de Tratamientos completa en todas las Divisiones. | `[✓]` |
| **Canal ARCO+ (Art. 8)** | Portal Ciudadano activo y sin casos vencidos (> 15 días hábiles). | `[✓]` |
| **EIPDs Aprobadas (Art. 25)** | Dictámenes formales sellados con SHA-256 para biometría/IA. | `[✓]` |
| **Contratos DPA & SCC (Art. 16/28)** | Anexos firmados con el 100% de los proveedores de nube. | `[✓]` |
| **Activos RSIC (Art. 4)** | Catálogo con Cifrado AES-256, MFA y Respaldo WORM verificados. | `[✓]` |
| **Resoluciones Exentas (Art. 10)** | Resoluciones PSI, PRI y BCP firmadas por la Jefatura de Servicio. | `[✓]` |
| **Canal CVD Ético (Art. 12)** | Enlace público visible en el portal institucional con calculadora CVSS. | `[✓]` |
| **Bitácora Inmutable (Art. 17)** | Ledger SHA-256 verificado y Expediente ZIP generado. | `[✓]` |

---

*Manual operativo oficial generado por LexApp GRC Hub · Acreditación Regulatoria Plena Ley N° 21.719 y Ley N° 21.663 de la República de Chile.*
