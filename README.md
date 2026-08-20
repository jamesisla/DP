# ProteccionDatos

Plataforma SaaS para apoyar la implementacion y gestion de cumplimiento de la Ley 21.719 de Proteccion de Datos Personales en Chile.

## Stack

- Backend: FastAPI, SQLAlchemy, JWT
- Frontend: React, Vite, Tailwind, lucide-react
- Base de datos: PostgreSQL
- Deploy local: Docker Compose
- Multi-cliente: una instancia separada de frontend, backend y base de datos por cliente

## Módulos y Funcionalidades Incluidas (Fase 1 y 2)

- **Login & RBAC:** JWT con soporte de roles gubernamentales (Jefe de Servicio, DPO, Comité, Responsable de Área).
- **Dashboard Ejecutivo:** Avance ponderado de 6 fases, cuenta regresiva legal al 1 de diciembre de 2026, alertas de camino crítico y bitácora en vivo.
- **Proyecto de Adecuación:** Desglose metodológico de tareas con dependencias y asignación por división.
- **Matriz de Levantamiento:** Encuesta guiada de 14 campos, mapa de flujo visual y consolidación en Matriz Maestra.
- **Motor de Riesgos 5×5 & EIPD:** Cálculo de Probabilidad (1-5) × Impacto (1-5), mapa de calor por área e identificación de tratamientos de alto riesgo que requieren Evaluación de Impacto.
- **Editor de Documentos Inteligente:** Inyección de tokens (`{{catalogo}}`, `{{lista_datos_sensibles}}`, etc.), barra de formato rápido y vista previa formateada en tiempo real.
- **Comité Ejecutivo & Actas:** Flujos de aprobación formal (Borrador -> Revisión -> Aprobado -> Firmado) con actas descargables.
- **Gestión de Solicitudes ARCO+ (15 Días Hábiles):** Control de plazos perentorios de la Ley 21.719 con semáforo de urgencia y generador de oficios de respuesta.
- **Gestión de Brechas de Seguridad (72 Horas):** Temporizador legal para notificación obligatoria a la Agencia de Protección de Datos y generación del formulario oficial.
- **Trazabilidad & Expediente ZIP:** Bitácora inmutable de auditoría y descarga de expediente estructurado en un solo ZIP fiscalizable.

## Despliegue en Oracle Cloud (OCI Always Free - 1GB RAM)

### En Ubuntu Minimal (Recomendado):
```bash
# 1. Optimizar RAM (< 90MB en reposo)
curl -fsSL https://raw.githubusercontent.com/jamesisla/DP/main/scripts/optimize-ubuntu.sh | sudo bash

# 2. Descargar, compilar y desplegar desde GitHub
curl -fsSL https://raw.githubusercontent.com/jamesisla/DP/main/scripts/install-native-ubuntu.sh | sudo bash
```

### En Oracle Linux Minimal:
```bash
# 1. Optimizar RAM
curl -fsSL https://raw.githubusercontent.com/jamesisla/DP/main/scripts/optimize-oci.sh | sudo bash

# 2. Desplegar
curl -fsSL https://raw.githubusercontent.com/jamesisla/DP/main/scripts/install-native-oci.sh | sudo bash
```

## Uso local con Docker

```bash
cp .env.example .env
docker compose up --build
```

URLs por defecto:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000/docs

Credenciales demo:

- Correo: `admin@protecciondatos.cl`
- Contrasena: `admin123`

## Crear un nuevo cliente

```bash
mkdir clients/cliente-demo
cp .env.example clients/cliente-demo/.env
docker compose --env-file clients/cliente-demo/.env up --build
```

Cambia `CLIENT_SLUG`, puertos, `SECRET_KEY` y credenciales PostgreSQL para cada cliente.

## Alcance pendiente

No se implementan todavia Keycloak, OpenMetadata, n8n, Paperless, integraciones directas con bases de datos ni scanner automatico.
