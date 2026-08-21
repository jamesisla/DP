# SIGE - Plataforma Unificada de Cumplimiento Legal (Chile)
### Protección de Datos Personales (Ley 21.719) & Ciberseguridad (Ley 21.663 / ANCI)

Plataforma de gobernanza y gestión metodológica para organismos del Estado y empresas en Chile, con arquitectura modular dual que comparte infraestructura común (autenticación, roles institucionales, auditoría y look-and-feel).

---

## 🏛️ Suite 1: Protección de Datos Personales (Ley N° 21.719)

Guía metodológica paso a paso (de lo general a lo particular) para dar cumplimiento antes del plazo límite del **1 de diciembre de 2026**:

1. **Gobernanza y Designación del DPO / Encargado/a:** Constitución del Comité y definición de alcance.
2. **Matriz de Levantamiento (Wizard de 14 campos):** Encuesta asistida por área y consolidación en Matriz Maestra.
3. **Motor de Riesgos 5×5 & EIPD:** Cálculo de Probabilidad (1-5) × Impacto (1-5), mapa de calor e identificación de tratamientos de alto riesgo.
4. **Editor de Documentos Inteligente:** Inyección de tokens (`{{catalogo}}`, `{{lista_datos_sensibles}}`), actas de comité y políticas al 70%.
5. **Gestión de Solicitudes ARCO+ (15 Días Hábiles):** Control de plazos perentorios con semáforo y generador de oficios.
6. **Gestión de Brechas de Seguridad (72 Horas):** Temporizador legal para notificación a la Agencia de Protección de Datos.
7. **Expediente ZIP Fiscalizable:** Compendio estructurado de evidencias en un solo clic.

---

## 🔒 Suite 2: Ciberseguridad e Infraestructura Crítica (Ley N° 21.663 / ANCI)

Guía metodológica de 6 fases para **Prestadores de Servicios Esenciales (PSE)** y **Operadores de Importancia Vital (OIV)** ante la **Agencia Nacional de Ciberseguridad (ANCI)**:

1. **Fase 1: Gobernanza & Designación de Responsables (Art. 7 y 8):** Designación formal del CISO ante la ANCI y constitución del Comité de Crisis.
2. **Fase 2: Inventario de Redes y Sistemas Críticos RSIC (Art. 4 y 5):** Registro de servidores, bases de datos, redes perimetrales y servicios esenciales.
3. **Fase 3: Gestión de Riesgos y Madurez NIST / ANCI (Art. 9):** Diagnóstico en los 5 dominios (*Identificar, Proteger, Detectar, Responder, Recuperar*).
4. **Fase 4: Políticas y Planes de Continuidad BCP/DRP (Art. 10):** Política General de Seguridad de la Información y Plan de Respuesta a Incidentes (PRI).
5. **Fase 5: Notificación Temprana ANCI (Art. 12 y 13):** Control perentorio de la **Alerta Temprana de 3 Horas** y del **Informe Técnico de 72 Horas** con generación automática del formulario oficial.
6. **Fase 6: Auditoría Técnica y Controles Mínimos (Art. 14):** Verificación de MFA, Cifrado TLS 1.3/AES-256 y Backups inmutables anti-ransomware.

### 🧩 Modularidad y Adaptabilidad por Cliente
Cada fase y módulo del sistema es **100% modular**:
- Si una institución ya cuenta con un módulo resuelto (por ejemplo, certificación ISO 27001 previa o inventario de activos preexistente), el CISO o administrador puede marcar la fase como **"Resuelta Externamente"** o desactivarla, permitiendo que el sistema recalcule automáticamente el índice global sin bloquear el avance.

---

## 🚀 Despliegue en Servidor (OCI Always Free / Ubuntu Minimal)

### Actualizar a la última versión en tu servidor:
```bash
sudo /opt/sige-dp/scripts/update-and-rebuild.sh
```

### Instalación limpia desde cero:
```bash
# 1. Optimizar RAM (< 90MB en reposo)
curl -fsSL https://raw.githubusercontent.com/jamesisla/DP/main/scripts/optimize-ubuntu.sh | sudo bash

# 2. Descargar, compilar y desplegar
curl -fsSL https://raw.githubusercontent.com/jamesisla/DP/main/scripts/install-native-ubuntu.sh | sudo bash
```

---

## 🔑 Credenciales de Acceso

- **Email:** `admin@protecciondatos.cl` (o mediante el botón **ClaveÚnica**)
- **Contraseña:** `admin123`
