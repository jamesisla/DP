# 🏛️ LEXAPP GRC · ARCHIVO MAESTRO DE CONTEXTO Y CONTINUIDAD DE SESIÓN
**Fecha de Guardado:** 21 de Agosto de 2026  
**Proyecto:** LexApp GRC (SIGE-DP & Ciberseguridad ANCI)  
**Repositorio GitHub:** `https://github.com/jamesisla/DP.git`  
**Rama:** `main`  
**Servidor Producción (OCI):** `/opt/sige-dp/`

---

## 📌 1. CÓMO RETOMAR LA SESIÓN EN EL FUTURO

Cuando vuelvas a iniciar sesión con el asistente (Antigravity), simplemente dile el siguiente mensaje:

> **"Hola, lee el archivo `CONTEXTO_PROYECTO_LEXAPP.md` para recuperar todo el contexto del proyecto y dime en qué estado estamos para continuar."**

El asistente leerá este documento y tendrá inmediatamente el 100% del conocimiento de la arquitectura, decisiones tomadas, endpoints creados y siguientes pasos.

---

## 🏗️ 2. RESUMEN EJECUTIVO DE LA PLATAFORMA

**LexApp GRC** es una plataforma unificada de **Gobernanza, Riesgo y Cumplimiento (GRC)** diseñada para el sector público y privado chileno, construida con arquitectura modular y simétrica que atiende simultáneamente las dos grandes leyes regulatorias vigentes:

1. **Suite de Protección de Datos Personales (Ley N° 21.719)**
   * Regulador: *Agencia Nacional de Protección de Datos Personales*.
   * Plazo legal ARCO+: **15 días hábiles** (con semáforo de días hábiles chilenos).
   * Notificación de brechas de privacidad: **72 horas**.
   * Registro de Actividades de Tratamiento (RAT - Art. 15), EIPD (Art. 25), Acuerdos DPA con Terceros (Art. 16).
2. **Suite de Ciberdefensa & Resiliencia Operacional (Ley N° 21.663)**
   * Regulador: *Agencia Nacional de Ciberseguridad (ANCI)*.
   * Plazo perentorio de Alerta Temprana: **3 horas** (con Botón de Pánico y temporizador en tiempo real).
   * Informe Técnico Consolidado: **72 horas**.
   * Gestión de Redes y Sistemas Esenciales (RSIC/OIV - Art. 8), Protocolo Forense Digital y Cadena de Custodia, War Games / Simulacros de Crisis, Canal de Divulgación de Vulnerabilidades (CVD - Art. 12).

---

## 🧩 3. MATRIZ DE CAPACIDADES SIMÉTRICAS IMPLEMENTADAS (12:12)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   LEXAPP GRC · MATRIZ DE CAPACIDADES SIMÉTRICAS                          │
├────────────────────────────────────────────────────┬─────────────────────────────────────────────────────┤
│ 🛡️ SUITE DE PROTECCIÓN DE DATOS (LEY N° 21.719)    │ 🔒 SUITE DE CIBERSEGURIDAD & ANCI (LEY N° 21.663)    │
├────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ 1. Dashboard Ejecutivo + One-Pager Directorio + GRC│ 1. Dashboard CISO + One-Pager Directorio + GRC      │
│ 2. Hoja de Ruta & Fases de Adecuación (1 a 6)      │ 2. Ruta Metodológica ANCI (6 Fases)                 │
│ 3. Matriz RAT + Pipeline Ciclo de Vida del Dato    │ 3. Inventario RSIC + Topología BIA + Vínculo RAT    │
│ 4. Matriz de Riesgos & Evaluaciones EIPD (5x5)     │ 4. Matriz de Riesgos Técnicos 5x5 + CIS Benchmarks  │
│ 5. Gestión Terceros + Pliego ChileCompra DPA (MD)  │ 5. Cadena Suministro TI + Pliego Ciberdefensa (MD)  │
│ 6. Derechos ARCO+ con Sandbox ClaveÚnica (15d)     │ 6. Incidentes ANCI (3h) con Canal CVD Ético (Art.12)│
│ 7. Brechas (72h) + Comunicado Oficial Prensa/MD    │ 7. War Games / Crisis + Protocolo Desconexión Red   │
│ 8. Capacitación & Cultura (Acta Certificada)       │ 8. Simulador de Phishing ANCI (CyberTraining.jsx)   │
│ 9. Documentos, Políticas y Actas de Comité         │ 9. Políticas PGSI, Plan PRI y Continuidad BCP/DRP   │
│ 10. Auditoría + Mock Audit + SHA-256 + Q&A DPO     │ 10. Expediente ANCI + Mock Audit + SHA-256 + Q&A CISO│
│ 11. Stack Open Source (Presidio NLP Scan en Vivo)  │ 11. Stack Open Source (Wazuh SIEM Alerta 3h en Vivo)│
│ 12. Monitoreo & Madurez de Privacidad              │ 12. Diagnóstico de Madurez NIST CSF 2.0 / ANCI      │
└────────────────────────────────────────────────────┴─────────────────────────────────────────────────────┘
```

---

## 📂 4. ESTRUCTURA DE ARCHIVOS Y RUTAS CLAVE

### Backend (`/backend/app/`):
* `models/domain.py`: Modelos SQLAlchemy para Usuarios, Tratamientos, Riesgos, Proveedores, ARCO+, Brechas, Activos RSIC, Incidentes ANCI, War Games, Reportes CVD y Eventos de Telemetría.
* `schemas/domain.py`: Esquemas de validación Pydantic para todos los recursos.
* `routers/gateways.py`: Endpoints de simulación de canales externos (Sandbox Ciudadano ClaveÚnica, Canal CVD Art. 12, Ingesta Telemetría Presidio/Wazuh).
* `routers/documents.py`: Generador de documentos Markdown de Privacidad (One-Pager Directorio, Plan Anual, Pliego ChileCompra DPA, Comunicado de Crisis, Blueprint Open Source).
* `routers/cybersecurity.py`: Endpoints de Ciberseguridad (One-Pager CISO, Expediente ZIP ANCI, Pliego ChileCompra Ciber, Protocolo Desconexión, Libro Incidentes MD, Q&A CISO).
* `routers/audit.py`: Expediente Maestro ZIP de Datos, Verificador Criptográfico SHA-256 Ledger y Q&A DPO.

### Frontend (`/frontend/src/`):
* `components/Shell.jsx`: Shell principal con conmutador de Suites, sidebar responsivo con scroll sticky y notificaciones globales de plazos urgentes.
* `lib/modules.js`: Definición de módulos de navegación para ambas suites.
* `pages/`:
  * `Dashboard.jsx`, `ProjectTasks.jsx`, `Wizard.jsx`, `Risks.jsx`, `Documents.jsx`, `Committee.jsx`, `Providers.jsx`, `ArcoRequests.jsx`, `SecurityBreaches.jsx`, `AuditLogs.jsx`, `TrainingCampaigns.jsx`, `OpenSourcePrivacy.jsx`.
* `pages/cyber/`:
  * `CyberDashboard.jsx`, `CyberPhases.jsx`, `CyberAssets.jsx`, `CyberRisks.jsx`, `CyberMaturity.jsx`, `CyberIncidents.jsx`, `CyberSimulations.jsx`, `CyberPolicies.jsx`, `CyberAudit.jsx`, `OpenSourceCyber.jsx`.

### Carpeta de Presentación Ejecutiva (`/presentacion/`):
* `presentacion/01_Roadmap_Estrategico_GRC_Hub.md`: Visión para C-Level y Directorio.
* `presentacion/02_Presentacion_Plataforma_Modulos.md`: Resumen directo y simple módulo por módulo.
* `presentacion/03_Guia_Pruebas_Testing_Walkthrough.md`: Protocolo de pruebas paso a paso.
* `presentacion/README.md`: Índice y guía de navegación de los scripts.

---

## ⚙️ 5. COMANDO DE DESPLIEGUE EN SERVIDOR (OCI)

Para actualizar y compilar cualquier cambio en el servidor Linux:

```bash
sudo /opt/sige-dp/scripts/update-and-rebuild.sh
```

---

*LexApp GRC · Documento de Respaldo de Contexto y Estado Operacional.*
