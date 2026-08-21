# SCRIPT 1: PRESENTACIÓN EJECUTIVA & ROADMAP DE EVOLUCIÓN (GRC HUB)
## EVOLUCIÓN DE LEXAPP GRC: PLATAFORMA DE CUMPLIMIENTO DUAL Y HUB ORQUESTADOR OPEN SOURCE
**Marco Regulatorio:** Ley N° 21.719 (Protección de Datos Personales) & Ley N° 21.663 (Ciberseguridad e Infraestructura Crítica / ANCI)  
**Audiencia:** Directorio, Rectoría, Jefaturas Superiores y Comités Ejecutivos  
**Tiempo Estimado:** 7 a 10 minutos  

---

### [Slide 1: Portada & Contexto Regulatorio Nacional]

> **Orador:**  
> "Buenos días a todos los presentes.  
> 
> Hoy presentamos la estrategia de gobernanza y tecnología de **LexApp GRC**. Nuestro organismo enfrenta dos obligaciones legales simultáneas de máxima exigencia en la historia de la administración pública y corporativa de Chile:
> 
> 1. **La Ley N° 21.719 de Protección de Datos Personales:** Que entra en vigor definitivo el **1 de diciembre de 2026**, creando la Agencia Nacional de Protección de Datos y exigiendo deberes de responsabilidad proactiva, plazos perentorios de 15 días hábiles para derechos ciudadanos (ARCO+) y multas que alcanzan hasta **20.000 UTM** (más de $1.300 millones de pesos).
> 2. **La Ley N° 21.663, Ley Marco de Ciberseguridad:** Que crea la Agencia Nacional de Ciberseguridad (ANCI), califica a nuestros sistemas como Servicios Esenciales (PSE) y Operadores de Importancia Vital (OIV), e impone la obligación estricta de notificar incidentes significativos en un plazo perentorio de **3 horas**, bajo sanciones de hasta **40.000 UTM**.
> 
> **LexApp GRC** es la respuesta tecnológica integral e institucional para gestionar, auditar y resolver ambas normativas desde una sola consola unificada."

---

### [Slide 2: La Propuesta de Valor: LexApp como Hub Orquestador Open Source]

> **Orador:**  
> "Ante estas exigencias, la industria suele proponer la compra de costoso software privativo extranjero (*OneTrust, Splunk, Tenable, CyberArk*), lo que representaría un gasto de cientos de miles de dólares anuales en licencias y ataría a la institución a proveedores cerrados.
> 
> En lugar de ello, hemos diseñado **LexApp GRC** bajo el modelo de **Hub Orquestador Central**.  
> LexApp actúa como la capa de gobernanza, riesgo y cumplimiento (el *cerebro directivo*), mientras orquesta herramientas **Open Source de nivel gubernamental y militar** probadas y adoptadas en la Unión Europea (estándares GDPR y NIS2) y en Estados Unidos (estándares CISA y NIST).  
> 
> De esta forma, logramos soberanía tecnológica, total transparencia y un **ahorro de presupuesto del 100% en pago de licencias recurrentes**."

---

### [Slide 3: Las 4 Dimensiones Estratégicas del Hub]

> **Orador:**  
> "El impacto de este ecosistema se despliega en cuatro dimensiones complementarias:
> 
> 1. **Dimensión Interna de Negocio (C-Level & Directivos):**  
>    El Directorio y los jefes de servicio disponen de tableros ejecutivos en tiempo real que traducen la ciberseguridad y la privacidad a lenguaje de negocio: reducción efectiva de multas UTM mediante atenuantes acreditados, disponibilidad de servicios críticos e informes de madurez anuales.
> 
> 2. **Dimensión Interna Técnica (DevSecOps, TI y SOC):**  
>    Automatización de controles en servidores RSIC: monitoreo continuo con *Wazuh SIEM*, escaneos de vulnerabilidades CIS con *Greenbone/OpenVAS*, detección inteligente de datos sensibles con *Microsoft Presidio* y copias de seguridad inmutables WORM contra Ransomware.
> 
> 3. **Dimensión Externa Ciudadana (Portal de Transparencia & Confianza):**  
>    Un portal donde el ciudadano se autentica con su **ClaveÚnica del Estado**, ejerce sus derechos ARCO+ con seguimiento en vivo de su folio y dispone de un canal de divulgación coordinada de vulnerabilidades (CVD).
> 
> 4. **Dimensión Externa de Fiscalizadores (ANCI, Agencia de Datos y Contraloría):**  
>    Un entorno de auditoría en modo certificado con trazabilidad inmutable mediante hashes **SHA-256**, que permite emitir expedientes ZIP estructurados y listos para inspecciones en 1 solo clic."

---

### [Slide 4: Arquitectura del Ecosistema Open Source Integrado]

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        LEXAPP GRC · PLANO DE CONTROL DIRECTIVO                         │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ 🛡️ SUITE DE DATOS (LEY N° 21.719)          │ 🔒 SUITE DE CIBERSEGURIDAD (LEY N° 21.663)  │
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ • Microsoft Presidio (Escaneo PII / IA)   │ • Wazuh SIEM / XDR (Alerta Temprana 3h)    │
│ • Klaro! Consent Manager (Cookies / CMP)  │ • TheHive 5 + Cortex (Respuesta Forense)   │
│ • ARX / pg_anonymizer (K-Anonymity)       │ • MISP (Threat Intelligence & IoCs)        │
│ • Fides by Ethyca (Orquestador ARCO+)     │ • Greenbone OpenVAS (Escáner CVE / CIS)    │
│ • HashiCorp Vault (KMS / Cifrado AES-256) │ • MinIO Object Lock (WORM Anti-Ransomware) │
│ • ClaveÚnica (Autenticación Ciudadana)    │ • Keycloak + Guacamole (MFA & PAM Seguro)  │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

### [Slide 5: Roadmap de Implementación (2026 - 2027)]

> **Orador:**  
> "Para llegar a la entrada en vigor plenamente preparados, establecemos una hoja de ruta en 4 fases metodológicas:
> 
> * **Fase I (Q1 - Q2 2026) · Diagnóstico y Estructuración:**  
>   Consolidación del Registro RAT por áreas, levantamiento de infraestructura crítica RSIC/OIV, firma de contratos DPA con proveedores y ejecución de los primeros *Mock Audits* de preparación.
> 
> * **Fase II (Q3 2026) · Despliegue de Telemetría y Agentes:**  
>   Integración de agentes Wazuh en servidores de producción para activar la alerta 3h, escaneos mensuales de vulnerabilidades CIS con Greenbone y respaldos inmutables WORM en MinIO.
> 
> * **Fase III (Q4 2026 - Hito 01/Dic/2026) · Entrada en Vigor Plena:**  
>   Puesta en marcha del Portal Ciudadano ARCO+, cierre de la campaña anual de capacitación del personal y generación del primer Expediente Oficial para la Agencia de Datos y la ANCI.
> 
> * **Fase IV (2027 en adelante) · Maduración y Resiliencia Continua:**  
>   Simulacros semestrales de crisis (*War Games*), automatización SOAR de respuesta a ciberataques y auditorías periódicas de cumplimiento continuo."

---

### [Slide 6: Conclusión y Cierre]

> **Orador:**  
> "En conclusión: LexApp GRC le permite a la institución no solo cumplir a cabalidad con el marco legal más estricto que haya tenido Chile, sino que transforma una obligación regulatoria en una **ventaja estratégica de eficiencia, ciberdefensa y confianza ciudadana**, sin comprometer el presupuesto fiscal en licencias privativas.
> 
> Muchas gracias. Quedamos atentos a sus consultas."
