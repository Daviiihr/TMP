# Principios de Diseño de Software — Tournament Manager Pro (TMP)

Este documento identifica y justifica los principios de diseño de software aplicados en el proyecto TMP, con referencias directas al código fuente.

---

## 1. Principios SOLID

### S — Single Responsibility Principle (Responsabilidad Única)

> *Cada módulo tiene una sola razón para cambiar.*

| Capa | Clase/Archivo | Responsabilidad única |
|------|--------------|----------------------|
| Repositorio | `UserRepository` | CRUD exclusivo de la tabla `users` |
| Repositorio | `TeamRepository` | CRUD exclusivo de la tabla `teams` y `team_members` |
| Repositorio | `TournamentRepository` | CRUD exclusivo de la tabla `tournaments` |
| Servicio | `AuthValidator` | Solo validar inputs de login/registro |
| Servicio | `AuthService` | Solo manejar autenticación (tokens, sesiones, intentos) |
| Servicio | `TeamService` | Solo lógica de negocio de equipos |
| Servicio | `EnrollmentService` | Solo lógica de inscripción a torneos |
| Algoritmo | `brackets.ts` | Solo generar la estructura del bracket |
| Componente | `BracketView.tsx` | Solo renderizar el bracket visualmente |
| Lib | `env.ts` | Solo acceso a variables de entorno |
| Lib | `database.ts` | Solo conexión a PostgreSQL |
| Lib | `redis.ts` | Solo conexión a Redis |

**Justificación:** Cada archivo tiene **una sola razón para cambiar**. Si cambia la base de datos, solo se toca `database.ts`. Si cambian las reglas de inscripción, solo se toca `EnrollmentService`. Si cambia el diseño visual del bracket, solo se toca `BracketView.tsx`. Esto reduce el riesgo de errores en cascada.

**Ejemplo concreto — `login/route.ts`:**
```typescript
// El route handler solo ORQUESTA, no hace lógica:
const validation = validator.validateLogin(body);     // → AuthValidator
const user = await userRepo.findByEmail(email);       // → UserRepository
const result = await authService.verifyPassword(...); // → AuthService
return authService.createSession(user);               // → AuthService
```

---

### O — Open/Closed Principle (Abierto/Cerrado)

> *Abierto para extensión, cerrado para modificación.*

**Dónde se aplica:**

- **Repositorios**: Para agregar una nueva consulta (ej: `findByRegion()`), solo se agrega un nuevo método a la clase existente sin modificar los métodos anteriores.
- **Servicios**: `EnrollmentService` maneja inscripción individual Y de equipo. Si mañana se agrega inscripción de "dúo", se agrega un método nuevo sin tocar los existentes.
- **Componentes**: `BracketView` acepta un `BracketResult` genérico. Si el algoritmo cambia internamente, el componente no necesita modificarse mientras la interfaz `BracketResult` se respete.

**Justificación:** Al separar la lógica en clases con interfaces bien definidas, se puede extender el sistema (agregar nuevos tipos de torneo, nuevos métodos CRUD) sin modificar el código que ya funciona.

---

### L — Liskov Substitution Principle (Sustitución de Liskov)

> *Las interfaces se respetan consistentemente.*

**Dónde se aplica:**

- La interfaz `Participant` se usa tanto para jugadores individuales como para equipos en el algoritmo de brackets. Cualquier objeto que tenga `{id, name}` puede ser un participante.
- `AuthUser` define el contrato de un usuario autenticado y se respeta en `session.ts`, `auth.ts`, y todos los route handlers.

```typescript
// Cualquier cosa con id + name puede ser un participante del bracket
export interface Participant {
  id: string;
  name: string;
}
```

**Justificación:** Al usar interfaces TypeScript como contratos, garantizamos que cualquier implementación que cumpla el contrato puede ser sustituida sin romper el sistema.

---

### I — Interface Segregation Principle (Segregación de Interfaces)

> *No obligar a depender de cosas que no se necesitan.*

**Dónde se aplica:**

- `TournamentSummary` es un tipo liviano con solo `{id, name, status, created_at}` para las páginas que solo necesitan mostrar una lista. No carga con campos innecesarios como `max_players`, `region`, o `type`.
- Los componentes React reciben solo las props que necesitan:
  - `MatchCard` recibe `{player1, player2, isBye}` — no el objeto `Match` completo.
  - `BracketView` recibe `{result}` — no todo el estado de la página.

**Justificación:** Al exponer solo los datos necesarios, reducimos el acoplamiento y evitamos que un cambio en campos no relacionados afecte a los consumidores.

---

### D — Dependency Inversion Principle (Inversión de Dependencias)

> *Depender de abstracciones, no de implementaciones concretas.*

**Dónde se aplica:**

- **Route handlers dependen de servicios y repositorios**, no de `getPostgresPool()` directamente. Si mañana se cambia PostgreSQL por otro motor, solo se modifican los repositorios.
- **`env.ts` centraliza el acceso a `process.env`**. Ningún archivo accede a `process.env.DATABASE_URL` directamente; todos usan `databaseUrl()`.
- **Servicios dependen de repositorios**, no de queries SQL. `TeamService` usa `teamRepo.findById()`, no `pool.query("SELECT...")`.

```
Route Handler → Servicio → Repositorio → Base de datos
     ↑              ↑            ↑
  (no conoce     (no conoce   (única capa
   SQL ni BD)     SQL)         que conoce SQL)
```

**Justificación:** Esta arquitectura en capas permite cambiar la implementación de una capa sin afectar a las demás. Los tests pueden inyectar repositorios falsos (mocks) sin necesitar una BD real.

---

## 2. Patrón Repository (CRUD)

> *Encapsular toda la lógica de acceso a datos en clases dedicadas.*

| Repositorio | Create | Read | Update | Delete |
|-------------|--------|------|--------|--------|
| `UserRepository` | `create()` | `findByEmail()`, `findById()` | `updateLoginAttempts()`, `resetLoginAttempts()`, `updateRole()` | — |
| `TeamRepository` | `create()`, `addMember()` | `findById()`, `findByCaptain()`, `searchTeams()`, `getMemberCount()`, `isUserInTeam()` | `assignToTournament()` | — |
| `TournamentRepository` | — | `getById()`, `findActive()`, `findByOrganizer()`, `getEnrollmentCount()` | — | — |

**Justificación:** El patrón Repository:
1. **Centraliza el SQL** en un solo lugar por entidad
2. **Evita duplicación** — la misma query no se escribe en 4 archivos distintos
3. **Facilita testing** — se puede mockear el repositorio sin necesitar la BD
4. **Cumple SRP** — cada repositorio solo conoce su tabla

---

## 3. Patrón Service Layer (Capa de Servicios)

> *Encapsular la lógica de negocio compleja en clases de servicio.*

| Servicio | Responsabilidad | Repositorios que usa |
|----------|----------------|---------------------|
| `AuthService` | Verificar contraseñas, manejar bloqueos, crear sesiones JWT | `UserRepository` |
| `AuthValidator` | Validar formato de inputs (email, password, username) | Ninguno (pura lógica) |
| `TeamService` | Crear equipos, buscar, unirse a equipos, promover a CAPTAIN | `TeamRepository`, `UserRepository` |
| `EnrollmentService` | Inscribir jugadores/equipos en torneos con reglas de negocio | `TeamRepository`, `TournamentRepository` |

**Justificación:** Los servicios contienen las **reglas de negocio** que son más complejas que un simple CRUD:
- "Si un jugador crea un equipo, su rol debe cambiar de PLAYER a CAPTAIN" → `TeamService`
- "Si fallan 5 intentos de login, bloquear la cuenta 15 minutos" → `AuthService`
- "Un equipo solo puede inscribirse si tiene exactamente N jugadores" → `EnrollmentService`

---

## 4. Programación Orientada a Objetos (POO)

### Encapsulamiento

Cada clase encapsula su estado interno:
```typescript
export class UserRepository {
  private pool = getPostgresPool();  // ← encapsulado, no accesible desde fuera
  
  async findByEmail(email: string) { ... }  // ← interfaz pública
}
```

### Composición sobre Herencia

Los servicios **componen** repositorios en vez de heredar de ellos:
```typescript
export class EnrollmentService {
  private teamRepo = new TeamRepository();        // ← composición
  private tournamentRepo = new TournamentRepository(); // ← composición
}
```

**Justificación:** La composición es más flexible que la herencia. `EnrollmentService` necesita datos de `teams` Y `tournaments`, algo que sería imposible con herencia simple.

---

## 5. Patrón Singleton

> *Una sola instancia de recursos costosos compartida globalmente.*

```typescript
// database.ts — Pool de conexiones PostgreSQL
declare global { var tmpPostgresPool: Pool | undefined; }

export function getPostgresPool() {
  if (!globalThis.tmpPostgresPool) {
    globalThis.tmpPostgresPool = new Pool({ ... });  // Se crea UNA sola vez
  }
  return globalThis.tmpPostgresPool;  // Siempre devuelve la misma instancia
}
```

Se aplica en: `database.ts` (PostgreSQL) y `redis.ts` (Redis).

**Justificación:** Crear un pool de conexiones a la BD por cada request sería extremadamente costoso. El Singleton garantiza que toda la aplicación comparte un solo pool con un máximo de 10 conexiones.

---

## 6. Middleware / Proxy Pattern

```typescript
// proxy.ts
export default function proxy(request: NextRequest) {
  // Intercepta TODAS las requests antes de llegar a la página
  if (isProtected && !token) return redirect("/login");
  if (isAuth && token) return redirect("/dashboard");
  return NextResponse.next();
}
```

**Justificación:** En vez de verificar la autenticación en cada página individualmente (duplicación), el middleware lo hace de forma centralizada. Esto cumple con el principio DRY.

---

## 7. Separación de Responsabilidades por Capas (Arquitectura en Capas)

```
┌─────────────────────────────────────────────────────┐
│  PRESENTACIÓN (pages, components)                    │
│  - page.tsx, BracketView.tsx, TeamSection.tsx        │
│  - Solo UI, no conoce SQL ni lógica de negocio      │
├─────────────────────────────────────────────────────┤
│  API (route handlers)                                │
│  - login/route.ts, teams/route.ts                   │
│  - Solo orquesta: valida → servicio → respuesta     │
├─────────────────────────────────────────────────────┤
│  SERVICIOS (business logic)                          │
│  - AuthService, TeamService, EnrollmentService      │
│  - Reglas de negocio complejas                      │
├─────────────────────────────────────────────────────┤
│  REPOSITORIOS (data access / CRUD)                   │
│  - UserRepository, TeamRepository, TournamentRepo   │
│  - Única capa que conoce SQL                        │
├─────────────────────────────────────────────────────┤
│  INFRAESTRUCTURA (connections)                       │
│  - database.ts, redis.ts, env.ts                    │
│  - Pools de conexión, variables de entorno          │
└─────────────────────────────────────────────────────┘
```

**Justificación:** Cada capa solo se comunica con la capa inmediatamente inferior. Una página nunca hace SQL directamente, y un repositorio nunca genera HTML. Esto hace que cada capa sea independientemente testeable, reemplazable y mantenible.

---

## 8. DRY (Don't Repeat Yourself)

| Antes (duplicado) | Después (centralizado) |
|---|---|
| Validación de email repetida en `login` y `register` | `AuthValidator` con `validateLogin()` y `validateRegister()` |
| Query de torneos activos en `page.tsx` y `dashboard.tsx` | `TournamentRepository.findActive()` y `findByOrganizer()` |
| `process.env.DATABASE_URL` accedido en múltiples archivos | `env.ts` con `databaseUrl()` |

---

## Resumen

| Principio | Dónde se aplica | Beneficio |
|-----------|----------------|-----------|
| **SOLID (S)** | Repos, Services, Components | Cambios aislados, sin efectos secundarios |
| **SOLID (O)** | Interfaces, Services | Se puede extender sin modificar |
| **SOLID (L)** | `Participant`, `AuthUser` | Sustitución segura de implementaciones |
| **SOLID (I)** | `TournamentSummary`, Props de componentes | Sin dependencias innecesarias |
| **SOLID (D)** | Capas, `env.ts` | Desacoplamiento total entre capas |
| **Repository (CRUD)** | 3 repositorios | SQL centralizado y testeable |
| **Service Layer** | 4 servicios | Lógica de negocio organizada |
| **POO** | Clases con encapsulamiento y composición | Estado controlado y reutilizable |
| **Singleton** | DB Pool, Redis Client | Eficiencia en recursos |
| **Middleware** | `proxy.ts` | Auth centralizada, DRY |
| **Arquitectura en Capas** | Presentación → API → Servicio → Repo | Separación total de responsabilidades |
| **DRY** | Validators, Repos, env.ts | Cero duplicación |
