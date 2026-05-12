# Walkthrough — Análisis SOLID y Plan de Refactorización

## Arquitectura Actual vs Arquitectura Propuesta

```
ACTUAL (problemático):                    PROPUESTO (SOLID + POO + CRUD):

Route Handler (login)                     Route Handler (login)
  ├── Valida inputs (inline)                ├── AuthValidator.validateLogin()     ← POO (clase)
  ├── pool.query("SELECT...")               ├── UserRepository.findByEmail()      ← CRUD (Read)
  ├── bcrypt.compare(...)                   ├── AuthService.verifyPassword()      ← POO (servicio)
  ├── pool.query("UPDATE...")               ├── UserRepository.updateAttempts()   ← CRUD (Update)
  └── jwt.sign + cookies                    └── AuthService.createSession()       ← POO (servicio)
```

---

## Análisis SOLID del Proyecto

### Archivos Revisados

| Capa | Archivo | Líneas |
|------|---------|--------|
| API | `src/app/api/auth/login/route.ts` | 157 |
| API | `src/app/api/auth/register/route.ts` | 108 |
| API | `src/app/api/auth/logout/route.ts` | 19 |
| Middleware | `src/proxy.ts` | 33 |
| Lib | `src/lib/auth.ts` | 43 |
| Lib | `src/lib/database.ts` | 30 |
| Lib | `src/lib/session.ts` | 19 |
| Lib | `src/lib/env.ts` | 33 |
| Repositorio | `src/repositories/user.repository.ts` | 52 |
| Servicio | `src/services/auth.validator.ts` | 61 |
| Algoritmo | `src/lib/algorithms/brackets.ts` | 157 |
| Componente | `src/components/BracketView.tsx` | 129 |
| Página | `src/app/page.tsx` | 110 |
| Página | `src/app/dashboard/page.tsx` | 174 |

---

## S — Single Responsibility (Responsabilidad Única)

> *"Cada clase o función debe tener una sola razón para cambiar."*

### ❌ login/route.ts — Hace 5 cosas en 1 función

| Responsabilidad | Líneas | ¿Debería estar aquí? |
|----------------|--------|---------------------|
| Validar inputs | 32-44 | ❌ → `AuthValidator` |
| Query a la BD | 46-54 | ❌ → `UserRepository` |
| Lógica de bloqueo | 65-91 | ❌ → `AuthService` |
| Generar tokens JWT | 110-111 | ❌ → `AuthService` |
| Cookies + Redis | 112-143 | ❌ → `AuthService` |

**Solución con POO + CRUD:** Cada responsabilidad se delega a una clase:
- `AuthValidator` (ya existe) → Validación
- `UserRepository` (ya existe) → CRUD de la tabla `users`
- `AuthService` (nuevo) → Lógica de negocio (tokens, bloqueo, sesiones)

### ❌ register/route.ts — Validación duplicada

Tiene validación inline (líneas 25-58) cuando `AuthValidator.validateRegister()` ya hace exactamente lo mismo.

**Solución:** Usar el `AuthValidator` existente:
```diff
- if (!username || username.length < 3 || username.length > 40) { ... }
- if (!email || !email.includes("@")) { ... }
+ const validation = new AuthValidator().validateRegister(body);
+ if (!validation.isValid) return NextResponse.json({ ok: false, message: validation.message }, { status: validation.status });
```

### ❌ page.tsx y dashboard/page.tsx — SQL directo en la vista

Las páginas hacen `pool.query("SELECT...")` directamente. Mezclan presentación con acceso a datos.

**Solución con CRUD:** Crear `TournamentRepository` con métodos Read:
```typescript
class TournamentRepository {
  // CRUD — Read
  async findActive(limit: number): Promise<TournamentSummary[]> { ... }
  async findByOrganizer(organizerId: string): Promise<TournamentSummary[]> { ... }
}
```

### ❌ brackets.ts — Función monolítica

`generateBracket()` hace shuffle + cálculo + generación de todas las rondas.

**Solución:** Separar en funciones con responsabilidad única:
```typescript
function shuffleParticipants(participants: Participant[]): Participant[] { ... }
function calculateBracketSize(count: number): number { ... }
function generateFirstRound(slots: (Participant | null)[], bracketSize: number): Match[] { ... }
function generateNextRounds(prevMatches: Match[], round: number, bracketSize: number): Match[] { ... }
```

---

## O — Open/Closed (Abierto/Cerrado)

> *"Abierto para extensión, cerrado para modificación."*

### ❌ brackets.ts — Solo soporta eliminación simple

Si mañana necesitas doble eliminación o round robin, tendrías que modificar el código existente.

**Solución con POO (Patrón Strategy):**
```typescript
// Interfaz abstracta (contrato)
interface BracketStrategy {
  generate(participants: Participant[]): BracketResult;
}

// Implementaciones concretas (extensiones — sin tocar las anteriores)
class SingleEliminationBracket implements BracketStrategy {
  generate(participants: Participant[]): BracketResult { ... }
}

class DoubleEliminationBracket implements BracketStrategy {
  generate(participants: Participant[]): BracketResult { ... }
}

// Uso: solo cambias la estrategia, el resto del código no se toca
const strategy: BracketStrategy = new SingleEliminationBracket();
const result = strategy.generate(players);
```

### ❌ proxy.ts — Rutas protegidas hardcodeadas

```typescript
// ACTUAL: hay que modificar el array cada vez
const protectedPrefixes = ["/dashboard", "/admin"];

// PROPUESTO: configuración externa
import { PROTECTED_ROUTES } from "@/config/routes";
```

---

## L — Liskov Substitution (Sustitución de Liskov)

> *"Las clases hijas deben poder sustituir a las padres sin romper nada."*

### ✅ Cumple — No hay herencia mal usada

Las interfaces (`Participant`, `Match`, `AuthUser`) están bien definidas y se respetan en todo el proyecto. Si se implementa el patrón Strategy (punto anterior), todas las estrategias devolverán un `BracketResult` con la misma estructura, cumpliendo Liskov.

---

## I — Interface Segregation (Segregación de Interfaces)

> *"No obligues a un consumidor a depender de cosas que no necesita."*

### 🟡 brackets.ts — Campo `isBye` innecesario en rondas 2+

El campo `isBye` solo tiene sentido en la Ronda 1. En todas las demás rondas siempre es `false`. Los componentes de rondas posteriores cargan con un campo inútil.

### 🟡 user.repository.ts — `UserRow` expone `password_hash`

`UserRow` extiende `AuthUser` y agrega `password_hash`. Si alguien pasa accidentalmente un `UserRow` a un JSON response, filtra la contraseña hasheada.

**Solución:** Separar interfaces por rol:
```typescript
// Para responses (seguro)
interface SafeUser { id: string; email: string; username: string; role: string; }

// Solo para uso interno del repositorio (privado)
interface UserDBRow extends SafeUser { password_hash: string; failed_login_attempts: number; }
```

---

## D — Dependency Inversion (Inversión de Dependencias)

> *"Depende de abstracciones, no de implementaciones concretas."*

### ❌ 4 archivos llaman a `getPostgresPool()` directamente

| Archivo | Línea | Problema |
|---------|-------|---------|
| `login/route.ts` | 46 | Query SQL directo en el route handler |
| `register/route.ts` | 62 | Query SQL directo en el route handler |
| `page.tsx` | 20 | Query SQL directo en componente React |
| `dashboard/page.tsx` | 21 | Query SQL directo en componente React |

Si cambias la base de datos de PostgreSQL a otra cosa, tendrías que tocar **4 archivos**.

**Solución con CRUD + POO (Patrón Repository):**

```
Página/Route → Servicio (POO) → Repositorio (CRUD) → Base de datos
     ↑              ↑                 ↑
  (no sabe       (lógica de       (única capa que
   de SQL)       negocio)          conoce SQL)
```

Todos los archivos dependerían de **repositorios** (abstracciones), no de `getPostgresPool()` (implementación concreta).

### ❌ brackets.ts — `Math.random()` hardcodeado

Línea 55 usa `Math.random()` directamente. Imposible hacer tests deterministas.

**Solución con Inyección de Dependencias:**
```typescript
export function generateBracket(
  participants: Participant[],
  shuffleFn: (arr: Participant[]) => Participant[] = defaultShuffle  // ← inyectable
): BracketResult { ... }

// En producción: usa el shuffle aleatorio por defecto
// En tests: generateBracket(players, (arr) => arr)  // sin mezclar, predecible
```

---

## ✅ Lo que SÍ está bien hecho

| Buena práctica | Archivo | Principio |
|---------------|---------|-----------|
| Repositorio separado con métodos CRUD | `user.repository.ts` | S + D |
| Validador con responsabilidad única | `auth.validator.ts` | S |
| Variables de entorno centralizadas | `env.ts` | S + D |
| Componentes visuales separados | `BracketView.tsx` (MatchCard, RoundColumn) | S |
| Interfaces TypeScript bien definidas | `brackets.ts` (Participant, Match, RoundData) | I |
| Middleware conciso | `proxy.ts` | S |

---

## Plan de Acción (por prioridad)

| # | Acción | Principios | Patrón | Impacto |
|---|--------|-----------|--------|---------|
| 1 | `login/route.ts` → usar `UserRepository` + `AuthValidator` | S + D | CRUD + POO | 🔴 Alto |
| 2 | `register/route.ts` → usar `AuthValidator` + `UserRepository` | S + D | CRUD + POO | 🔴 Alto |
| 3 | Crear `TournamentRepository` (CRUD) | S + D | Repository | 🔴 Alto |
| 4 | Crear `AuthService` (clase para tokens/sesiones) | S | POO | 🟡 Medio |
| 5 | Inyectar `shuffleFn` en `generateBracket()` | D | DI | 🟡 Medio |
| 6 | Patrón Strategy para tipos de bracket | O | Strategy | 🟢 Futuro |
| 7 | Extraer config de rutas protegidas | O | Config | 🟢 Futuro |

> **Conclusión:** Sí, CRUD + POO resuelven directamente las violaciones encontradas.
> El patrón Repository (CRUD) soluciona las violaciones de D (Dependency Inversion)
> y S (Single Responsibility), mientras que las clases POO (Service, Strategy, Validator)
> resuelven O (Open/Closed) y permiten extensibilidad futura.
