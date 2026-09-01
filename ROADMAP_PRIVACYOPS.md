# ⚡ ROADMAP ESTRATÉGICO & MARCO DE ADOPCIÓN PRIVACYOPS
## LEXAPP GRC HUB · CONTINUOUS PRIVACY & CYBER OPERATIONS (LEY N° 21.719 & LEY N° 21.663 ANCI)

---

> **Organismo:** Servicio Público de la Administración del Estado / Institución Privada Obligada  
> **Versión del Marco:** 1.0 (PrivacyOps Standard Edition)  
> **Enfoque Metodológico:** Orquestación Continua de Privacidad, Observabilidad y Ciberdefensa  
> **Ámbito de Aplicación:** Jefatura de Servicio, DPO, CISO, Administradores SysAdmin/DevOps, Asesoría Jurídica y Comités de Auditoría.  

---

## 📑 ÍNDICE GENERAL

1. [MANIFIESTO Y VISIÓN PRIVACYOPS](#1-manifiesto-y-visión-privacyops)
2. [LOS 7 PILARES OPERATIVOS DE PRIVACYOPS EN LEXAPP](#2-los-7-pilares-operativos-de-privacyops-en-lexapp)
3. [ARQUITECTURA DE 4 CAPAS CONCÉNTRICAS](#3-arquitectura-de-4-capas-concéntricas)
4. [MÉTRICAS CLAVE DE RENDIMIENTO (KPIS) PRIVACYOPS](#4-métricas-clave-de-rendimiento-kpis-privacyops)
5. [ROADMAP DE MADUREZ INSTITUCIONAL EN 4 FASES](#5-roadmap-de-madurez-institucional-en-4-fases)
6. [MATRIZ DE ROLES Y RESPONSABILIDADES (RACI PRIVACYOPS)](#6-matriz-de-roles-y-responsabilidades-raci-privacyops)
7. [CHECKLIST DE CERTIFICACIÓN Y AUDITORÍA CONTINUA](#7-checklist-de-certificación-y-auditoría-continua)

---

## 1. MANIFIESTO Y VISIÓN PRIVACYOPS

El cumplimiento regulatorio tradicional basado en archivadores y auditorías estáticas anuales ha quedado obsoleto. Frente a la convergencia entre la **Ley N° 21.719 (Protección de Datos Personales)** y la **Ley N° 21.663 (Ciberseguridad ANCI)**, la organización requiere un marco ágil que una a los equipos de **Legal (DPO)**, **Ciberseguridad (CISO)** e **Ingeniería (DevOps)**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    EL MANIFIESTO PRIVACYOPS                                     │
├────────────────────────────────────────────────┬────────────────────────────────────────────────┤
│ ❌ GRC TRADICIONAL (BUROCRÁTICO)                │ ⚡ LEXAPP PRIVACYOPS (CONTINUO Y AUTOMATIZADO)  │
├────────────────────────────────────────────────┼────────────────────────────────────────────────┤
│ • Formularios estáticos en papel/Excel.        │ • Telemetría en tiempo real de bases de datos. │
│ • Revisión una vez al año.                     │ • Monitoreo continuo de cambios de esquemas.   │
│ • Atención manual de derechos ARCO+ (vencidos).│ • Pipeline DSAR con SLA automático de 15 días. │
│ • Silos separados entre TI y Jurídica.         │ • Correlación cruzada SIEM ➔ Alerta ANCI 3h.   │
│ • "Cumplimiento para la foto".                 │ • Evidencias criptográficas inmutables SHA-256.│
└────────────────────────────────────────────────┴────────────────────────────────────────────────┘
```

---

## 2. LOS 7 PILARES OPERATIVOS DE PRIVACYOPS EN LEXAPP

```
                                  LOS 7 PILARES OPERATIVOS DE PRIVACYOPS
                                  
  [1. Discovery] ──► [2. DSAR/ARCO] ──► [3. DPIA/PbD] ──► [4. Incident Ops]
         ▲                                                       │
         │                                                       ▼
  [7. Privacy Debt] ◄── [6. Vendor/SCC] ◄── [5. CiberOps Bridge] ◄─┘
```

| Pilar PrivacyOps | Módulo LexApp | Mecanismo Técnico y Jurídico |
| :--- | :--- | :--- |
| **1. Continuous Data Discovery & RoPA Sync** | Matriz RAT (`/matrix`) + Presidio NLP | Descubrimiento automatizado de RUTs y PII en bases de datos relacionales; cálculo de frescura del inventario RAT (Art. 15). |
| **2. DSAR Fulfillment Automation** | Gestor ARCO+ (`/arco`) + ClaveÚnica | Pipeline de 5 etapas con cálculo de días hábiles perentorios, validación de identidad y resoluciones con sello SHA-256 (Art. 8-12). |
| **3. Privacy by Design & DPIA as Code** | Evaluaciones EIPD (`/risks`) + Wizard 9 | Asistente heurístico de 9 criterios de alto riesgo, cálculo de riesgo residual y dictamen vinculante del DPO (Art. 25). |
| **4. Dual Incident & Breach Orchestration** | Brechas (`/breaches`) + Incidentes ANCI (`/cyber_incidents`) | Correlación cruzada ante alertas Wazuh L12 ➔ Alerta CISO (<3h) y Brecha DPO (<72h) con generación de oficios oficiales. |
| **5. CiberOps Bridge & Hardening RSIC** | Activos RSIC (`/cyber_assets`) + Políticas | Certificación de la Tríada Técnica Obligatoria (AES-256 + MFA + WORM) y script de Hardening Bash para Linux (Art. 8 ANCI). |
| **6. Third-Party Privacy & Cross-Border Telemetry** | Proveedores (`/providers`) + Acuerdos SCC | Control de centros de datos en el extranjero y generación de Acuerdos de Transferencia Tipo SCC con sumisión legal (Art. 16 y 28). |
| **7. Privacy Debt & Cryptographic Ledger** | Consola Auditoría (`/audit`) + Simulador | Libro Mayor inmutable SHA-256, cálculo de Deuda Técnica de Privacidad y modelado de atenuantes financieras del Art. 52. |

---

## 3. ARQUITECTURA DE 4 CAPAS CONCÉNTRICAS

```
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │ CAPA 4: EXPERIENCIA & REPORTABILIDAD EJECUTIVA (Executive & Citizen UI)                     │
 │ • Dashboard GRC Bipartito • One-Pager Directorio • Portal Ciudadano ARCO+ • Canal CVD Ético │
 ├─────────────────────────────────────────────────────────────────────────────────────────────┤
 │ CAPA 3: ORQUESTACIÓN & PIPELINES OPERATIVOS (Workflows & SLA Engine)                        │
 │ • DSAR Automation Pipeline • Alerta ANCI <3h • Brecha DPO <72h • Sello Criptográfico SHA-256│
 ├─────────────────────────────────────────────────────────────────────────────────────────────┤
 │ CAPA 2: MOTOR DE REGLAS & POLÍTICAS LEGALES (Legal Rules & Risk Engine)                     │
 │ • Calendario Días Hábiles • 9 Criterios EIPD • Atenuantes Art. 52 • CVSS 3.1 • Tríada RSIC │
 ├─────────────────────────────────────────────────────────────────────────────────────────────┤
 │ CAPA 1: TELEMETRÍA & GATEWAYS OPEN SOURCE (Continuous Ingestion Layer)                      │
 │ • Wazuh SIEM/FIM • Presidio NLP • MinIO WORM Heartbeats • Keycloak MFA • REST API Endpoints │
 └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. MÉTRICAS CLAVE DE RENDIMIENTO (KPIS) PRIVACYOPS

El éxito del programa PrivacyOps se mide mediante **5 indicadores cuantitativos**:

### 1. Velocidad de Cumplimiento ARCO+ (DSAR SLA Velocity)
* **Fórmula:** Promedio de días hábiles transcurridos desde la radicación ciudadana hasta la emisión de la resolución formal.
* **Meta Institucional:** $< 5$ días hábiles (Margen de seguridad frente al límite legal de 15 días).

### 2. Índice de Deuda Técnica de Privacidad (Privacy Technical Debt)
* **Fórmula:**
  $$\text{Deuda de Privacidad} = \frac{\text{Tratamientos sin EIPD} + \text{Activos sin Cifrado} + \text{Cloud sin SCC}}{\text{Total de Componentes Institucionales}} \times 100$$
* **Meta Institucional:** $< 10\%$ (Nivel de riesgo bajo / Audit-Ready).

### 3. Índice de Frescura del RAT (RoPA Freshness Score)
* **Fórmula:** Porcentaje de actividades de tratamiento validadas o contrastadas contra esquemas de bases de datos en los últimos 90 días.
* **Meta Institucional:** $\ge 95\%$.

### 4. Tiempo de Contención & Notificación ANCI (TTC < 180 min)
* **Fórmula:** Minutos transcurridos desde el disparo de alerta SIEM hasta el envío del formulario formal al CSIRT Nacional.
* **Meta Institucional:** $< 120$ minutos (Margen de seguridad frente al plazo legal perentorio de 3 horas).

### 5. Mitigación Financiera Proactiva (Art. 52)
* **Fórmula:** Monto en UTM y CLP descontado en el Simulador de Sanciones gracias al DPO nombrado, el programa LexApp activo y el cifrado técnico.

---

## 5. ROADMAP DE MADUREZ INSTITUCIONAL EN 4 FASES

```
  FASE 1: Baseline           FASE 2: Automatización     FASE 3: Telemetría         FASE 4: Gobierno
  (Semanas 1-2)              (Semanas 3-4)              (Semanas 5-6)              (Continuo)
 ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
 │ • Nombramiento DPO   │   │ • Pipeline ARCO+     │   │ • Webhook Wazuh SIEM │   │ • Ledger SHA-256     │
 │ • Levantamiento RAT  │──►│ • Contratos DPA/SCC  │──►│ • MinIO Backup WORM  │──►│ • One-Pagers Jefatura│
 │ • Catálogo RSIC      │   │ • EIPD 9 Criterios   │   │ • Presidio NLP Scan  │   │ • Simulador Mock ANCI│
 └──────────────────────┘   └──────────────────────┘   └──────────────────────┘   └──────────────────────┘
```

### Fase 1: Baseline y Levantamiento Inicial (Semanas 1 a 2)
* [x] Despliegue de LexApp GRC Hub en servidor OCI (`/opt/sige-dp/`).
* [x] Carga del catálogo de Divisiones/Áreas institucionales.
* [x] Levantamiento inicial de la Matriz de Tratamientos (RAT) por área.
* [x] Inventario de servidores y bases de datos en el Catálogo de Activos RSIC.

### Fase 2: Automatización de Derechos y Blindaje de Proveedores (Semanas 3 a 4)
* [x] Habilitación del Portal Ciudadano ARCO+ y canal CVD con ClaveÚnica.
* [x] Emisión de Anexos DPA y Acuerdos de Transferencia Internacional SCC con proveedores cloud.
* [x] Evaluación de tratamientos de alto riesgo mediante el Asistente EIPD (Art. 25).
* [x] Firma de Resoluciones Exentas formales (PSI, PRI, BCP/DRP) por la Jefatura de Servicio.

### Fase 3: Conexión de Telemetría Técnica Open Source (Semanas 5 a 6)
* [x] Conexión del webhook de Wazuh SIEM para correlación cruzada ANCI (3h) y DPO (72h).
* [x] Automatización de heartbeats de respaldo inmutable WORM en MinIO / Restic.
* [x] Programación de escaneos periódicos con Microsoft Presidio NLP en bases de datos.
* [x] Activación del MFA obligatorio en Keycloak / Authentik para accesos a servidores RSIC.

### Fase 4: Gobierno Continuo, Auditoría y Reportabilidad Directiva (Continuo)
* [x] Monitoreo en vivo a través de la barra *PrivacyOps Telemetry Bar*.
* [x] Reducción activa de la Deuda Técnica de Privacidad por debajo del 10%.
* [x] Exportación periódica del One-Pager Bipartito GRC y Plan Anual para el Directorio.
* [x] Sellado criptográfico SHA-256 de todas las bitácoras y expediente probatorio ZIP.

---

## 6. MATRIZ DE ROLES Y RESPONSABILIDADES (RACI PRIVACYOPS)

| Actividad / Proceso PrivacyOps | Jefatura de Servicio | DPO (Legal) | CISO (Seguridad) | DevOps / TI | Ciudadano / Titular |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Aprobación de Resoluciones Exentas (PSI/PRI)** | **R / A** | C | C | I | I |
| **Levantamiento y Mantenimiento del RAT** | I | **A** | C | **R** | I |
| **Resolución de Solicitudes ARCO+ (<15d)** | I | **R / A** | C | C | **I (Inicia)** |
| **Alerta Temprana ANCI (<3h)** | I | C | **R / A** | **R** | I |
| **Notificación de Brecha a Agencia (<72h)** | I | **R / A** | C | C | I |
| **Preservación de Cadena Forense (Ley 21.459)** | I | C | **A** | **R** | I |
| **Auditoría de PII con Presidio NLP** | I | C | C | **R / A** | I |
| **Verificación de Respaldo Inmutable WORM** | I | I | **A** | **R** | I |
| **Revisión del One-Pager Ejecutivo GRC** | **A** | **R** | **R** | I | I |

*Referencias: **R** = Responsable de ejecución, **A** = Aprobador final / Accountable, **C** = Consultado, **I** = Informado.*

---

## 7. CHECKLIST DE CERTIFICACIÓN Y AUDITORÍA CONTINUA

Antes de cada comité directivo o fiscalización de la **Agencia de Protección de Datos** o la **ANCI**, verificar:

- [ ] **1. RoPA Freshness:** El 100% de las áreas completó su matriz RAT.
- [ ] **2. Cero Casos ARCO+ Vencidos:** Ninguna solicitud supera los 15 días hábiles.
- [ ] **3. EIPD Selladas:** Todos los sistemas con biometría, IA o videovigilancia cuentan con dictamen DPO sellado con SHA-256.
- [ ] **4. Proveedores Blindados:** El 100% de los contratos de nube cuentan con Anexo DPA o Acuerdo SCC.
- [ ] **5. Tríada RSIC:** Cifrado AES-256, MFA y copias WORM verificadas en el último escaneo.
- [ ] **6. Canal CVD Operativo:** Formulario público accesible con calculadora CVSS 3.1.
- [ ] **7. Expediente Probatorio:** Libro Mayor SHA-256 exportado y verificado sin inconsistencias.

---

*Documento estratégico oficial generado por LexApp GRC Hub · Marco de Adopción PrivacyOps Standard.*
