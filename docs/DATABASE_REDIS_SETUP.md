# Base de datos para login y registro

Esta configuracion agrega PostgreSQL y Redis para probar `src/app/login` y `src/app/register`.

PostgreSQL se publica en el puerto local `5433` para evitar conflictos con instalaciones locales de PostgreSQL en Windows.

## Iniciar servicios

```bash
cp .env.example .env.local
docker compose up -d
npm install
npm run dev
```

## Probar healthchecks

```bash
curl http://localhost:3000/api/health/database
curl http://localhost:3000/api/health/redis
```

## Probar auth

Registro:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"ProPlayer_99\",\"email\":\"player@example.com\",\"password\":\"password123\",\"region\":\"LATAM\"}"
```

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"player@example.com\",\"password\":\"password123\"}"
```

## Tabla principal

`database/init/001_schema.sql` crea la tabla `users` con los campos usados por los formularios:

- `username`
- `email`
- `password_hash`
- `region`
- `role`
- `failed_login_attempts`
- `locked_until`

Redis guarda el refresh token en `refresh:{userId}` durante 7 dias.
