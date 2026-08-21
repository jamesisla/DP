# Plan Estratégico de Evolución: Ciberseguridad Institucional en LexApp GRC
### *De la Gobernanza Legal (Ley N° 21.663 / ANCI) a las Soluciones Técnicas Automatizadas*

---

## 🎯 1. Visión y Enfoque Metodológico: "Top-Down & Zero Trust"

Para elevar la suite de Ciberseguridad a un nivel de madurez superior, la plataforma cierra la brecha entre el **cumplimiento documental (abogados/auditores)** y la **ejecución técnica real (ingenieros de infraestructura/TI)**.

El principio rector es:
$$\text{Gobernanza Estratégica} \longrightarrow \text{Gestión de Riesgos} \longrightarrow \text{Políticas Formales} \longrightarrow \mathbf{Controles\ Técnicos\ Automatizados}$$

```
┌────────────────────────────────────────────────────────────────────────┐
│ NIVEL 1: GOBERNANZA & ANCI (Estratégico)                                │
│ Nombramiento CISO · Comité de Crisis · Clasificación OIV / PSE         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ NIVEL 2: ARQUITECTURA & ACTIVOS RSIC (Táctico)                         │
│ Descubrimiento de Redes · Dependencias · Análisis de Impacto (BIA)     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ NIVEL 3: GESTIÓN DE VULNERABILIDADES & RIESGOS (Operativo)             │
│ Diagnóstico NIST CSF 2.0 / CIS Controls · Escaneo de Brechas           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ NIVEL 4: RESPUESTA & ANCI ORCHESTRATION (Operativo / Crítico)           │
│ Alerta Temprana 3 Horas · Trazabilidad Forense · Informe Técnico 72h   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ NIVEL 5: SOLUCIONES TÉCNICAS & HARDENING (Técnico Automatizado)         │
│ MFA Obligatorio · Cifrado TLS 1.3/AES · Backups Inmutables · Scripts   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛣️ 2. Roadmap en 5 Fases Evolutivas

---

### 🏛️ FASE I: Gobernanza, Alcance y Clasificación Legal
**Objetivo:** Establecer la estructura jurídica y organizativa que exige la Ley N° 21.663 antes de desplegar cualquier herramienta técnica.

* **1.1. Determinación de Alcance Legal:**
  * Algoritmo de clasificación institucional: ¿Es la entidad un **Operador de Importancia Vital (OIV)**, un **Prestador de Servicios Esenciales (PSE)** o un Organismo de la Administración del Estado?
* **1.2. Designación Formal del CISO / Responsable de Seguridad:**
  * Generador asistido del Decreto Exento / Resolución de Nombramiento para registro ante la Agencia Nacional de Ciberseguridad (ANCI).
* **1.3. Constitución del Comité de Ciberseguridad y Gestión de Crisis:**
  * Matriz RACI institucional vinculando al Jefe de Servicio, CISO, Asesor Legal y Jefe de Comunicaciones.

---

### 🔍 FASE II: Catálogo y Descubrimiento de Activos Críticos (RSIC)
**Objetivo:** Inventariar el 100% de las Redes y Sistemas Informáticos Críticos (RSIC) y mapear sus dependencias.

* **2.1. Inventario Tecnológico Multicapa:**
  * Clasificación por capas: *Perímetro / Red (Firewalls, VPN) $\rightarrow$ Servidores $\rightarrow$ Bases de Datos $\rightarrow$ Aplicaciones Web / APIs $\rightarrow$ Nube (OCI/AWS) $\rightarrow$ Endpoints*.
* **2.2. Mapeo de Interconexiones y Servicios Esenciales:**
  * Diagrama interactivo de dependencias: Si el servidor `BD-01` cae, ¿qué trámites ciudadanos o pagos se interrumpen?
* **2.3. Evaluación de Proveedores Críticos (Supply Chain):**
  * Control contractual de terceros: Registro de empresas de soporte TI con cláusula obligatoria de reporte de incidentes en menos de 24 horas.

---

### 📊 FASE III: Diagnóstico de Madurez Dinámico & Matriz de Riesgos Ciber
**Objetivo:** Identificar vulnerabilidades y medir la brecha frente a estándares internacionales (NIST CSF 2.0 / CIS Controls v8).

* **3.1. Evaluación Cuantitativa de los 5 Dominios ANCI / NIST:**
  1. **Identificar:** Inventario, gobernanza y cadena de suministro.
  2. **Proteger:** MFA, hardening, parches y concientización.
  3. **Detectar:** Centralización de logs (SIEM), EDR y monitoreo de red.
  4. **Responder:** Plan de Respuesta a Incidentes (PRI) y flujos de crisis.
  5. **Recuperar:** Backups inmutables y Plan de Continuidad (BCP/DRP).
* **3.2. Motor de Riesgos Tecnológicos (5×5):**
  $$\text{Riesgo} = \text{Probabilidad de Ciberataque (1-5)} \times \text{Impacto en Servicio Esencial (1-5)}$$
  * Clasificación automática de riesgos residuales y asignación de planes de mitigación a los administradores de TI.

---

### 🚨 FASE IV: Centro de Mando de Incidentes & Automatización ANCI (3h / 72h)
**Objetivo:** Garantizar que ante un ciberataque real, la institución cumpla con los plazos perentorios de la ley sin improvisaciones.

* **4.1. "Botón de Pánico" y Alerta Temprana en 3 Horas:**
  * Al activarse un incidente crítico (Ransomware, Intrusión APT, DDoS masivo):
    * Se dispara un temporizador visual descendente de **3 Horas**.
    * Generación automática del **Oficio Oficial de Alerta Temprana ANCI** con los Indicadores de Compromiso (IoCs) detectados.
* **4.2. Protocolo de Cadena de Custodia y Preservación Forense:**
  * Checklist técnico guiado: Volcado de memoria RAM, congelamiento de logs y aislamiento de interfaces de red sin apagar el equipo.
* **4.3. Generador de Informe Técnico de Causa Raíz (72 Horas):**
  * Consolidación de vectores de ataque, cuentas vulneradas y medidas correctivas adoptadas.

---

### 🛡️ FASE V: Soluciones Técnicas Automatizadas y Hardening
**Objetivo:** Pasar del papel a la infraestructura con controles técnicos reales que mitiguen los vectores de ataque más comunes.

#### 1. Autenticación y Control de Accesos (Zero Trust)
* **MFA Obligatorio:** Forzado de autenticación multifactor mediante TOTP o llaves FIDO2 para todas las consolas de administración y accesos SSH.
* **Principio de Mínimo Privilegio (PoLP):** Eliminación de cuentas administrativas compartidas y uso de `sudo` con bitácora inmutable.

#### 2. Cifrado y Protección Criptográfica
* **En Tránsito:** Forzado de TLS 1.3 con certificados HSTS y cifradores seguros (ChaCha20-Poly1305 / AES-GCM).
* **En Reposo:** Cifrado de bases de datos mediante AES-256 y cifrado de particiones con LUKS o almacenamiento cifrado OCI.

#### 3. Protección Anti-Ransomware (Backups Inmutables WORM)
* **Regla 3-2-1-1:** 3 copias, 2 soportes distintos, 1 fuera de sitio y **1 inmutable (Write Once, Read Many)** desconectada de la red principal.
* Pruebas de restauración trimestrales automatizadas con registro de evidencia para la ANCI.

#### 4. Hardening y Escaneo Continuo de Vulnerabilidades
* Scripts automáticos de adecuación de Kernel Linux (`sysctl` hardening, fail2ban, iptables restrictivo, deshabilitación de protocolos obsoletos).
* Chequeo periódico de configuraciones contra los benchmarks CIS (*Center for Internet Security*).

---

## 🧩 3. Módulos Técnicos en LexApp GRC

| Módulo en LexApp | Propósito Técnico | Entregable para Auditoría ANCI |
| :--- | :--- | :--- |
| **Centro de Comando ANCI** | Monitoreo 24/7 de alertas tempranas 3h y estado de servicios esenciales. | Registro de Incidentes y Tiempos de Notificación. |
| **Inventario RSIC Interactivo** | Árbol topológico de servidores, IPs, puertos y estado de parches. | Catálogo Oficial de Redes y Sistemas Críticos. |
| **Generador de Scripts de Hardening** | Descarga de scripts Bash para aplicar controles mínimos (MFA, Cifrado, Firewall) en 1 clic. | Evidencia técnica de configuración segura. |
| **Simulador de Incidentes (War Games)** | Ejercicios de simulación de ciberataques (phishing, ransomware) para entrenar al equipo. | Actas de ejercicios y lecciones aprendidas. |
| **Expediente Consolidado ANCI (ZIP)** | Exportación estructurada de todas las evidencias técnicas y administrativas. | Paquete digital para fiscalizaciones y certificaciones. |
