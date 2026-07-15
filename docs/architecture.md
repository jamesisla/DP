# Arquitectura inicial

ProteccionDatos usa una plantilla reusable por cliente. Cada cliente corre su propio tridente:

- `frontend`: React + Vite + Tailwind
- `backend`: FastAPI + JWT + SQLAlchemy
- `db`: PostgreSQL

La separacion multi-cliente se hace por contenedores, puertos, variables y volumen de base de datos. No hay datos compartidos entre clientes.

## Modulos MVP

El backend expone endpoints iniciales para dashboard, proyecto, actividades, hallazgos, consentimientos y tickets. Los modulos DPO, matriz, comite, politica y procedimientos quedan modelados en la interfaz como superficies listas para completar con CRUD y flujos de aprobacion.

## Evolucion sugerida

1. Agregar migraciones con Alembic.
2. Completar CRUD por modulo con permisos por rol.
3. Incorporar evidencias/documentos por hallazgo y actividad.
4. Agregar exportacion de informes.
5. Endurecer autenticacion antes de produccion.
