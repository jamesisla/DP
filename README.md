# ProteccionDatos

Plataforma SaaS para apoyar la implementacion y gestion de cumplimiento de la Ley 21.719 de Proteccion de Datos Personales en Chile.

## Stack

- Backend: FastAPI, SQLAlchemy, JWT
- Frontend: React, Vite, Tailwind, lucide-react
- Base de datos: PostgreSQL
- Deploy local: Docker Compose
- Multi-cliente: una instancia separada de frontend, backend y base de datos por cliente

## MVP incluido

- Login simple con JWT
- Dashboard principal
- Modulo DPO
- Proyecto de implementacion
- Matriz de levantamiento
- Catalogo de actividades de tratamiento
- Comite Ejecutivo
- Informe de hallazgos
- Politica de tratamiento de datos
- Procedimientos, riesgos y acciones
- Casos/tickets ligeros
- Consentimientos

## Uso local

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
