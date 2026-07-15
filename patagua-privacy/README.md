# Patagua Privacy

Estructura inicial para una plataforma SaaS de privacidad y cumplimiento.

## Stack

- Backend: FastAPI, SQLAlchemy, Alembic
- Base de datos: PostgreSQL
- Frontend: React, Vite, TypeScript, Tailwind CSS
- Deploy local: Docker Compose

## Ejecutar localmente

```bash
cp .env.example .env
docker compose up --build
```

Servicios:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger/OpenAPI: http://localhost:8000/docs
- PostgreSQL: localhost:5432

## Solucionar `Failed to fetch`

Ese error significa que el frontend no puede llegar al backend.

1. Confirma que Docker Desktop este abierto.
2. Levanta los servicios desde la raiz del proyecto:

```bash
docker compose up --build
```

3. Verifica el backend:

```bash
curl http://localhost:8000/api/health
```

La respuesta esperada es:

```json
{"status":"ok","service":"backend"}
```

Si cambiaste `BACKEND_PORT`, actualiza tambien `VITE_API_URL` en `.env`.

## Migraciones

Crear una migracion:

```bash
docker compose exec backend alembic revision --autogenerate -m "initial schema"
```

Aplicar migraciones:

```bash
docker compose exec backend alembic upgrade head
```

## Estructura

```text
backend/app/core     configuracion
backend/app/db       sesion SQLAlchemy y metadata base
backend/app/models   modelos ORM
backend/app/schemas  esquemas Pydantic
backend/app/routers  rutas FastAPI
backend/app/services logica de negocio
backend/app/seed     datos iniciales
frontend/src         aplicacion React
```
