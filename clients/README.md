# Clientes

Cada cliente debe tener su propio archivo `.env` con puertos, credenciales y `CLIENT_SLUG`.

Ejemplo:

```bash
mkdir clients/acme
cp .env.example clients/acme/.env
```

Edita `clients/acme/.env`:

```env
CLIENT_SLUG=acme
BACKEND_PORT=8010
FRONTEND_PORT=5180
POSTGRES_PORT=5440
SECRET_KEY=replace-with-a-long-random-value
VITE_API_URL=http://localhost:8010/api
```

Levanta esa instancia:

```bash
docker compose --env-file clients/acme/.env up --build
```

El resultado es un set separado de contenedores y volumen PostgreSQL para ese cliente.
