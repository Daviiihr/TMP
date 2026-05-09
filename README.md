<p align="center">
  <strong>🎮 TMP — Tournament Manager Pro</strong>
</p>

<p align="center">
  Plataforma profesional de gestión de torneos de videojuegos tipo esports.<br/>
  Brackets inteligentes · Ranking dinámico · Premios en efectivo
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/GSAP-3-88CE02?logo=greensock" alt="GSAP" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## 📖 Descripción

**TMP** es un sistema de gestión de torneos de videojuegos de nivel profesional. No es un CRUD simple: involucra múltiples entidades encadenadas con dependencias temporales, validaciones transaccionales, brackets inteligentes, ranking dinámico y auditoría total.

### Características principales

- 🏆 **Brackets inteligentes** — Generación automática con seeding por ranking, separación regional y byes
- ⚡ **Inscripción transaccional** — Todo o nada, sin estados parciales ni inscripciones inválidas
- 📊 **Ranking dinámico** — Desempate jerárquico con múltiples criterios
- 🛡️ **Sanciones acumulativas** — Escalamiento automático por reincidencia entre torneos
- 💰 **Premios automáticos** — Redistribución inteligente ante descalificaciones
- 🔍 **Auditoría total** — Reconstrucción del estado del sistema en cualquier punto temporal

---

## 🚀 Inicio Rápido

### Requisitos

- Node.js
- Docker Desktop
- WSL 2 habilitado si usas Windows

En Windows, Docker Desktop usa WSL 2 para ejecutar contenedores Linux. Si Docker muestra errores del subsistema de Linux, instala o actualiza WSL:

```powershell
wsl --install
wsl --update
```

Luego reinicia el equipo o Docker Desktop.

### Ejecutar el proyecto

```bash
# Clonar el repositorio
git clone https://github.com/daviiihr/TMP.git
cd TMP

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Levantar PostgreSQL y Redis
docker compose up -d

# Iniciar servidor de desarrollo
npm run dev
```

En PowerShell, si `cp` no funciona, usa:

```powershell
copy .env.example .env.local
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

Rutas para probar:

- Login: [http://localhost:3000/login](http://localhost:3000/login)
- Registro: [http://localhost:3000/register](http://localhost:3000/register)
- PostgreSQL: [http://localhost:3000/api/health/database](http://localhost:3000/api/health/database)
- Redis: [http://localhost:3000/api/health/redis](http://localhost:3000/api/health/redis)

> Importante: después de crear o modificar `.env.local`, reinicia `npm run dev`.

---

## 🧩 Variables de entorno

El archivo `.env.local` debe quedar así para desarrollo local:

```env
DATABASE_URL=postgresql://tmp_user:tmp_password@localhost:5433/tmp_db
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
AUTH_ALLOWED_EMAIL_DOMAINS=gmail.com
```

PostgreSQL se publica en el puerto local `5433` porque en Windows puede existir otra instalación local de PostgreSQL usando `5432`.

`AUTH_ALLOWED_EMAIL_DOMAINS` define los dominios autorizados para registrarse e iniciar sesion. Puedes permitir mas de uno separandolos por coma, por ejemplo:

```env
AUTH_ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com
```

---

## 🗄️ Base de datos y Redis

Los servicios se levantan con:

```bash
docker compose up -d
```

Servicios creados:

| Servicio | Contenedor | Puerto local | Uso |
|----------|------------|--------------|-----|
| PostgreSQL | `tmp-postgres` | `5433` | Usuarios y datos principales |
| Redis | `tmp-redis` | `6379` | Refresh tokens y cache |

Comandos útiles:

```powershell
# Ver contenedores activos
docker ps

# Ver logs
docker compose logs postgres
docker compose logs redis

# Detener servicios
docker compose down
```

Para ver cuentas creadas:

```powershell
docker exec tmp-postgres psql -U tmp_user -d tmp_db -c "SELECT id, username, email, region, role, created_at FROM users ORDER BY created_at DESC;"
```

También puedes conectar DBeaver o pgAdmin con:

```text
Host: localhost
Port: 5433
Database: tmp_db
User: tmp_user
Password: tmp_password
```

---

## 🔐 Login y registro

Se agregaron endpoints locales en Next.js para conectar los formularios con PostgreSQL y Redis:

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Crea usuario en PostgreSQL con contraseña hasheada |
| `POST` | `/api/auth/login` | Valida credenciales, genera JWT y guarda refresh token en Redis |
| `GET` | `/api/health/database` | Verifica conexión a PostgreSQL |
| `GET` | `/api/health/redis` | Verifica conexión a Redis |

El registro y login solo aceptan correos con dominios configurados en `AUTH_ALLOWED_EMAIL_DOMAINS`.

El registro usa los campos actuales de `src/app/register/page.tsx`:

- `username`
- `email`
- `password`
- `region`

La tabla principal está definida en [`database/init/001_schema.sql`](database/init/001_schema.sql).

---

## 📁 Estructura del Proyecto

```
TMP/
├── database/
│   └── init/
│       └── 001_schema.sql          # Tabla users para login y registro
│
├── docs/                           # Documentación del proyecto
│   ├── CONTEXT_SISTEMA_TORNEOS.md  # Arquitectura, reglas de negocio, modelo de datos
│   └── DATABASE_REDIS_SETUP.md     # Pruebas de PostgreSQL, Redis y auth
│
├── public/                         # Assets estáticos
│   └── images/
│       ├── keyboard.png
│       ├── main-controller.png
│       └── trophy.png
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/login          # Autenticación con PostgreSQL + Redis
│   │   │   ├── auth/register       # Registro de usuarios
│   │   │   └── health              # Healthchecks de PostgreSQL y Redis
│   │   ├── globals.css             # Estilos globales y tokens de diseño
│   │   ├── login/page.tsx          # Formulario de login
│   │   ├── layout.tsx              # Layout raíz con fuentes y metadata
│   │   ├── page.tsx                # Página principal
│   │   └── register/page.tsx       # Formulario de registro
│   │
│   └── components/                 # Componentes React
│       ├── HeroScrollSection.tsx   # Hero con animaciones GSAP y parallax
│       ├── FeaturesSection.tsx     # Sección de características
│       └── CTASection.tsx          # Call to action
│
├── package.json
├── docker-compose.yml
├── .env.example
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Lenguaje** | TypeScript 5 |
| **Estilos** | TailwindCSS 4 |
| **Animaciones** | GSAP 3 + ScrollTrigger |
| **Base de datos** | PostgreSQL |
| **Cache / sesiones** | Redis |
| **Auth local** | bcrypt + JWT |
| **Linting** | ESLint |

### Stack completo del sistema (backend — en desarrollo)

| Capa | Tecnología |
|------|-----------|
| **Backend** | NestJS, TypeScript, Bull Queue |
| **Base de datos** | PostgreSQL, Redis |
| **ORM** | TypeORM |
| **Autenticación** | JWT (access + refresh tokens) |
| **Tiempo real** | Socket.io |
| **Infraestructura** | Docker, GitHub Actions |

---

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|------------|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build de producción optimizado |
| `npm run start` | Servidor de producción |
| `npm run lint` | Análisis estático con ESLint |

Validaciones recomendadas antes de subir cambios:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

---

## 📚 Documentación

La documentación completa del proyecto está en [`docs/CONTEXT_SISTEMA_TORNEOS.md`](docs/CONTEXT_SISTEMA_TORNEOS.md) e incluye:

- Arquitectura completa del sistema
- Modelo de base de datos (12 tablas + triggers)
- 27 casos de uso detallados
- Reglas de negocio críticas
- Endpoints de la API REST
- Decisiones de diseño y sus justificaciones
- Invariantes del sistema

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).
