<p align="center">
  <strong>🎮 TMP — Tournament Manager Pro</strong>
</p>

<p align="center">
  Plataforma profesional de gestión de torneos de videojuegos tipo esports.<br/>
  Brackets inteligentes · Ranking dinámico · Premios en efectivo
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js 14" />
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

```bash
# Clonar el repositorio
git clone https://github.com/daviihr/TMP.git
cd TMP

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📁 Estructura del Proyecto

```
TMP/
├── docs/                           # Documentación del proyecto
│   └── CONTEXT_SISTEMA_TORNEOS.md  # Arquitectura, reglas de negocio, modelo de datos
│
├── public/                         # Assets estáticos
│   └── images/
│       ├── keyboard.png
│       ├── main-controller.png
│       └── trophy.png
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── globals.css             # Estilos globales y tokens de diseño
│   │   ├── layout.tsx              # Layout raíz con fuentes y metadata
│   │   └── page.tsx                # Página principal
│   │
│   └── components/                 # Componentes React
│       ├── HeroScrollSection.tsx   # Hero con animaciones GSAP y parallax
│       ├── FeaturesSection.tsx     # Sección de características
│       └── CTASection.tsx          # Call to action
│
├── package.json
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
| **Framework** | Next.js 14 (App Router) |
| **Lenguaje** | TypeScript 5 |
| **Estilos** | TailwindCSS 4 |
| **Animaciones** | GSAP 3 + ScrollTrigger |
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
