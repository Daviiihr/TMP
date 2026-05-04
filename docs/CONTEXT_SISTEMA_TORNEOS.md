# Sistema de Torneos de Videojuegos — Contexto completo del proyecto

> **Documento de contexto para IA**
> Usar este archivo como referencia primaria al comenzar cualquier tarea de desarrollo, diseño o documentación relacionada con este proyecto. Contiene la arquitectura, reglas de negocio, modelo de datos, casos de uso y decisiones de diseño ya tomadas.

---

## 1. Visión general

Sistema profesional de gestión de torneos de videojuegos tipo esports. No es una aplicación simple de CRUD: involucra múltiples entidades encadenadas con dependencias temporales, validaciones transaccionales, brackets inteligentes, ranking dinámico y auditoría total. El objetivo es que el sistema sea de nivel profesional, comparable a plataformas como Battlefy o Challonge, pero con reglas de negocio propias más estrictas.

### Actores del sistema

| Actor | Descripción |
|---|---|
| **Jugador** | Usuario base. Puede registrarse, ver torneos, verificar su elegibilidad, consultar historial y ranking. |
| **Capitán** | Extiende al Jugador. Puede crear y gestionar equipos, inscribirlos en torneos y confirmar participación. |
| **Administrador** | Control total: crea torneos, genera brackets, inicia partidas, aplica sanciones y distribuye premios. |
| **Sistema (automático)** | Actor no humano. Ejecuta triggers, recalcula validez, versiona brackets, propaga resultados y escala sanciones. |

---

## 2. Stack tecnológico

### Frontend
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Estilos:** TailwindCSS + shadcn/ui
- **Estado servidor:** React Query (TanStack Query)
- **Estado cliente:** Zustand
- **Tiempo real:** Socket.io (cliente)
- **Autenticación:** JWT con refresh token (manejado desde el frontend con interceptores)

### Backend
- **Runtime:** Node.js + NestJS + TypeScript
- **Arquitectura:** Modular por dominio (tournaments, teams, matches, players, sanctions, audit)
- **Tiempo real:** Socket.io (servidor)
- **Jobs en background:** Bull Queue + Redis

### Base de datos
- **Principal:** PostgreSQL — soporte nativo de transacciones, triggers, CTEs recursivos, row-level locking
- **Caché:** Redis — ranking en tiempo real, sesiones, estado de partidas en vivo
- **ORM:** TypeORM

### Infraestructura
- Docker + Docker Compose para desarrollo local
- GitHub Actions para CI/CD
- Variables de entorno separadas por ambiente (dev / staging / prod)

### Autenticación y seguridad
- Contraseñas: bcrypt (cost factor 12)
- Tokens: JWT access token (15 min) + refresh token (7 días)
- Roles: `PLAYER`, `CAPTAIN`, `ADMIN`
- Guards de NestJS por rol en cada endpoint
- Bloqueo de cuenta tras 5 intentos fallidos (15 min)

---

## 3. Modelo de base de datos

### Tablas principales

```
USERS
  id            uuid PK
  email         string UNIQUE
  password_hash string
  role          enum(PLAYER, CAPTAIN, ADMIN)
  region        string
  ranking_score int DEFAULT 0
  is_verified   boolean DEFAULT false
  created_at    timestamp

TOURNAMENTS
  id                      uuid PK
  name                    string
  region                  string[]          -- regiones permitidas
  min_ranking             int
  min_players             int
  max_players             int
  format                  enum(bo1, bo3, bo5)
  start_date              timestamp
  end_date                timestamp
  registration_closes_at  timestamp
  status                  enum(DRAFT, OPEN, CLOSED, IN_PROGRESS, FINISHED)

TEAMS
  id                  uuid PK
  tournament_id       uuid FK → TOURNAMENTS
  captain_id          uuid FK → USERS
  name                string
  is_valid            boolean DEFAULT false
  captain_confirmed   boolean DEFAULT false
  validity_checked_at timestamp

TEAM_MEMBERS
  id          uuid PK
  team_id     uuid FK → TEAMS
  user_id     uuid FK → USERS
  role        enum(CAPTAIN, PLAYER)
  joined_at   timestamp

TOURNAMENT_SANCTIONS
  id            uuid PK
  user_id       uuid FK → USERS
  tournament_id uuid FK → TOURNAMENTS
  type          enum(WARNING, MATCH_LOSS, DISQUALIFICATION, BAN)
  reason        string
  severity_level int
  is_active     boolean
  expires_at    timestamp

BRACKETS
  id            uuid PK
  tournament_id uuid FK → TOURNAMENTS
  version       int
  is_active     boolean DEFAULT true   -- solo 1 activo por torneo
  bracket_data  jsonb
  generated_at  timestamp

MATCHES
  id              uuid PK
  tournament_id   uuid FK → TOURNAMENTS
  bracket_id      uuid FK → BRACKETS
  team_a_id       uuid FK → TEAMS (nullable)
  team_b_id       uuid FK → TEAMS (nullable)
  parent_match_id uuid FK → MATCHES (self-ref — partida siguiente)
  status          enum(PENDING, READY, IN_PROGRESS, FINISHED, PENDING_REVIEW)
  format          enum(bo1, bo3, bo5)
  server_id       string
  scheduled_at    timestamp
  started_at      timestamp
  finished_at     timestamp

MATCH_EVENTS
  id               uuid PK
  match_id         uuid FK → MATCHES
  user_id          uuid FK → USERS
  event_type       enum(DISCONNECT, ABANDON, PAUSE, REPORT, OTHER)
  event_data       jsonb
  affects_validity boolean
  occurred_at      timestamp

MATCH_RESULTS
  id              uuid PK
  match_id        uuid FK → MATCHES UNIQUE
  winner_team_id  uuid FK → TEAMS
  score_a         int
  score_b         int
  is_valid        boolean DEFAULT false
  has_pending_reports boolean DEFAULT false
  validated_at    timestamp

AUDIT_LOG
  id           uuid PK
  actor_id     uuid FK → USERS
  entity_type  string   -- 'TEAM' | 'MATCH' | 'TOURNAMENT' | 'SANCTION' | ...
  entity_id    uuid
  action       string   -- 'TEAM_ENROLLED' | 'BRACKET_GENERATED' | ...
  before_state jsonb
  after_state  jsonb
  performed_at timestamp

PRIZE_DISTRIBUTION
  id              uuid PK
  tournament_id   uuid FK → TOURNAMENTS
  team_id         uuid FK → TEAMS
  position        int
  prize_amount    decimal
  status          enum(PENDING, PAID)
  distributed_at  timestamp
```

### Triggers de PostgreSQL (ya definidos)

**`trg_team_member_change`** — Se dispara en INSERT/UPDATE/DELETE sobre `team_members`. Recalcula automáticamente `is_valid` y `validity_checked_at` del equipo afectado evaluando: conteo de jugadores vs min/max, verificación de todos los miembros, ausencia de duplicados en el mismo torneo.

**`trg_bracket_versioning`** — Se dispara en INSERT sobre `brackets`. Desactiva automáticamente todas las versiones anteriores del mismo torneo (`is_active = false`), garantizando que solo exista un bracket activo por torneo en todo momento.

### Relaciones clave

```
USERS         1──* TEAM_MEMBERS
USERS         1──* TOURNAMENT_SANCTIONS
TEAMS         1──* TEAM_MEMBERS
TEAMS         1──1 USERS (capitán)
TOURNAMENTS   1──* TEAMS
TOURNAMENTS   1──* BRACKETS
TOURNAMENTS   1──* MATCHES
BRACKETS      1──* MATCHES
MATCHES       1──? MATCH_RESULTS
MATCHES       *──? MATCH_EVENTS
MATCHES       1──? MATCHES (self-ref: partida siguiente)
```

---

## 4. Reglas de negocio críticas

### 4.1 Elegibilidad de jugador

Un jugador es elegible para un torneo **solo si cumple TODOS** estos criterios:

1. Cuenta con estado `VERIFIED`
2. `ranking_score >= tournament.min_ranking`
3. `region` del jugador está en `tournament.allowed_regions`
4. No tiene sanciones activas (`is_active = true`) en ningún torneo vigente
5. No está inscrito en otro torneo con solapamiento de fechas

### 4.2 Validez de equipo

Un equipo es válido (`is_valid = true`) **solo si**:

1. Número de jugadores entre `min_players` y `max_players`
2. Todos los jugadores tienen `is_verified = true`
3. Ningún jugador pertenece a otro equipo del mismo torneo
4. `captain_confirmed = true` antes del cierre

**La validez se recalcula automáticamente** (trigger) ante cualquier cambio en `team_members`. No hay validación manual.

### 4.3 Inscripción transaccional

La inscripción de equipo es una **transacción completa (todo o nada)**:

- Se ejecuta con `SELECT FOR UPDATE` sobre el torneo (bloqueo pesimista)
- Se re-valida la elegibilidad de CADA jugador en el momento exacto del commit
- Si cualquier jugador falla → `ROLLBACK` completo con detalle de errores por jugador
- Si el torneo cierra entre el inicio y el commit → `ROLLBACK` con 409

### 4.4 Generación de bracket (UC-A04)

1. Equipos ordenados por `ranking_score DESC`
2. Si el total no es potencia de 2 → asignar byes a los mejor posicionados (pasan directo a ronda 2)
3. Aplicar separación regional: equipos del mismo grupo/región no se enfrentan en ronda 1
4. Validar árbol generado con BFS (sin ciclos, sin inconsistencias)
5. El bracket se versiona: al insertar uno nuevo, el trigger desactiva los anteriores
6. Todo cambio invalida versiones previas y queda en historial de auditoría

### 4.5 Control de inicio de partida

Una partida **solo puede iniciar** si:

1. Ambos equipos confirmaron presencia (`team_ready = true`)
2. Todos los jugadores activos pertenecen a la alineación registrada
3. Ningún jugador tiene sanciones activas
4. El servidor asignado está disponible

Al iniciar, el sistema **bloquea toda modificación** de equipo o jugadores para esa partida.

### 4.6 Validación de resultado

Un resultado es válido **solo si**:

1. No existen reportes pendientes (`has_pending_reports = false`)
2. Todos los eventos fueron evaluados (`affects_validity` definido en cada `match_event`)
3. El marcador es consistente con el formato (`bo1`, `bo3`, `bo5`)

Una vez validado, el resultado no puede modificarse sin invalidar todas las partidas dependientes del bracket.

### 4.7 Propagación de resultados (automático)

Al validar un resultado, el sistema automáticamente:

1. Identifica la partida siguiente (`parent_match_id` inverso)
2. Asigna el equipo ganador al slot correspondiente
3. Si ambos equipos están asignados → cambia estado a `READY`
4. Si es la final → marca torneo como `FINISHED` e inicia distribución de premios

### 4.8 Sanciones acumulativas

Las sanciones persisten entre torneos y escalan por reincidencia:

| Reincidencia | Nivel | Tipo |
|---|---|---|
| 1ª infracción | severity 1 | Advertencia |
| 2ª infracción | severity 2 | Pérdida de partida |
| 3ª infracción | severity 3 | Descalificación del torneo |
| 4ª o más | severity 4+ | Ban temporal o permanente |

El escalamiento es automático al registrar una nueva sanción.

### 4.9 Ranking dinámico

El `ranking_score` considera (en orden de prioridad para desempate):

1. Victorias y derrotas
2. Diferencia de rondas/mapas
3. Resultado de enfrentamientos directos
4. Rendimiento reciente (últimas N partidas con mayor peso)

En empates múltiples se aplican los criterios jerárquicamente hasta resolver completamente.

### 4.10 Premios

- La distribución considera posición final, sanciones acumuladas y descalificaciones
- Si un equipo pierde elegibilidad post-clasificación → el sistema redistribuye automáticamente los premios a las posiciones siguientes
- El admin aprueba la distribución calculada antes de ejecutar el pago

---

## 5. Casos de uso del sistema (27 en total)

### Actor: Jugador (10 UC)

| ID | Nombre | Descripción breve |
|---|---|---|
| UC-J01 | Registrarse | Crear cuenta con verificación por email |
| UC-J02 | Iniciar sesión | Autenticación con JWT y manejo de intentos fallidos |
| UC-J03 | Recuperar contraseña | Reset seguro con token de 1 hora |
| UC-J04 | Ver torneos disponibles | Lista filtrada por región con indicador de elegibilidad |
| UC-J05 | Verificar elegibilidad | Reporte de los 5 criterios para un torneo específico |
| UC-J06 | Ver historial de partidas | Historial paginado con estadísticas agregadas |
| UC-J07 | Ver ranking personal | Score, posición global/regional y desglose de factores |
| UC-J08 | Confirmar presencia | Confirmación pre-partida con validación de sanciones nuevas |
| UC-J09 | Reportar evento en partida | Registro de incidentes con evaluación automática de impacto |
| UC-J10 | Ver resultado de partida | Resultado validado con línea de tiempo de eventos |

### Actor: Capitán (8 UC, extiende Jugador)

| ID | Nombre | Descripción breve |
|---|---|---|
| UC-C01 | Crear equipo | Crear equipo en torneo; validez inicial false |
| UC-C02 | Agregar jugadores | Adición con verificación en tiempo real de elegibilidad |
| UC-C03 | Eliminar jugadores | Remoción con recalculo de validez; bloqueada si partida activa |
| UC-C04 | Ver validez del equipo | Panel de indicadores y tiempo restante al cierre |
| UC-C05 | Inscribir equipo | Transacción completa todo-o-nada con bloqueo pesimista |
| UC-C06 | Confirmar participación | captain_confirmed=true; habilita is_valid final |
| UC-C07 | Solicitar reprogramación | Requiere acuerdo de ambos equipos y no romper dependencias |
| UC-C08 | Ver bracket del torneo | Vista del árbol con equipo propio resaltado |

### Actor: Administrador (10 UC)

| ID | Nombre | Descripción breve |
|---|---|---|
| UC-A01 | Crear torneo | Creación en estado DRAFT con publicación explícita |
| UC-A02 | Configurar reglas | Modificación de parámetros con recalculo de validez de equipos |
| UC-A03 | Cerrar inscripciones | Automático o manual; descarta equipos inválidos |
| UC-A04 | Generar bracket | Seeding + separación regional + byes + BFS + versionado |
| UC-A05 | Iniciar partida | Verifica 4 prerrequisitos y bloquea modificaciones |
| UC-A06 | Revisar evento crítico | Decisión administrativa sobre incidentes en partida |
| UC-A07 | Validar resultado | Verifica 3 condiciones y propaga al bracket |
| UC-A08 | Aplicar sanción | Escalamiento automático por reincidencia |
| UC-A09 | Distribuir premios | Cálculo con redistribución automática por descalificaciones |
| UC-A10 | Consultar auditoría | Log filtrable con reconstrucción de estado en cualquier punto |

### Actor: Sistema — automático (5 UC)

| ID | Nombre | Descripción breve |
|---|---|---|
| UC-S01 | Asignar byes | Cuando equipos no es potencia de 2; top-N pasan a ronda 2 |
| UC-S02 | Versionar bracket | Trigger que desactiva versiones anteriores al crear una nueva |
| UC-S03 | Propagar resultado | Asigna ganador al siguiente slot del bracket automáticamente |
| UC-S04 | Escalar sanción | Calcula severity_level por reincidencia al registrar sanción nueva |
| UC-S05 | Recalcular validez equipo | Trigger que evalúa is_valid ante cualquier cambio en team_members |

---

## 6. Estructura de carpetas del frontend

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas de autenticación (sin layout principal)
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (player)/                 # Dashboard del jugador
│   │   ├── dashboard/
│   │   ├── tournaments/
│   │   │   ├── [id]/
│   │   │   └── enroll/
│   │   ├── my-team/
│   │   └── profile/
│   ├── (captain)/                # Dashboard del capitán
│   │   ├── dashboard/
│   │   ├── team/
│   │   │   ├── manage/
│   │   │   └── confirm/
│   │   └── matches/
│   ├── (admin)/                  # Dashboard del administrador
│   │   ├── dashboard/
│   │   ├── tournaments/
│   │   ├── brackets/
│   │   ├── sanctions/
│   │   └── audit-log/
│   └── api/                      # Route handlers de Next.js
│
├── components/
│   ├── ui/                       # Componentes base de shadcn
│   ├── auth/                     # Guards, formularios de auth
│   ├── tournament/
│   │   ├── BracketView           # Visualización interactiva del bracket
│   │   ├── EnrollmentWizard      # Proceso paso a paso de inscripción
│   │   └── EligibilityChecker    # Panel de verificación en tiempo real
│   ├── team/
│   │   ├── TeamCard
│   │   └── ValidityBadge         # Indicador visual de is_valid
│   └── match/
│       ├── LiveMatchPanel        # Panel de partida en curso con Socket.io
│       └── EventTimeline         # Línea de tiempo de eventos de la partida
│
├── hooks/
│   ├── useEligibility.ts
│   ├── useTeamValidity.ts
│   └── useLiveMatch.ts
│
├── services/                     # Clientes HTTP hacia la API
├── store/                        # Slices de Zustand
├── lib/
│   ├── auth.ts                   # Lógica de JWT y refresh
│   └── socket.ts                 # Configuración de Socket.io
└── types/                        # Tipos TypeScript compartidos
```

---

## 7. Estructura de carpetas del backend (NestJS)

```
src/
├── modules/
│   ├── auth/                     # Registro, login, JWT, guards
│   ├── users/                    # Perfil, ranking, historial
│   ├── tournaments/              # CRUD de torneos, reglas, cierre
│   ├── teams/                    # Gestión de equipos y miembros
│   ├── enrollment/               # Lógica transaccional de inscripción
│   ├── brackets/                 # Generación, versionado, visualización
│   ├── matches/                  # Control de partidas, inicio, resultado
│   ├── events/                   # Motor de evaluación de eventos en partida
│   ├── sanctions/                # Sanciones, escalamiento, elegibilidad
│   ├── prizes/                   # Distribución y redistribución de premios
│   ├── ranking/                  # Cálculo dinámico y desempate jerárquico
│   └── audit/                    # Log de auditoría y reconstrucción de estado
│
├── database/
│   ├── migrations/
│   ├── triggers/                 # SQL de triggers (team_member_change, bracket_versioning)
│   └── seeds/
│
├── common/
│   ├── guards/                   # RolesGuard, JwtGuard
│   ├── decorators/
│   ├── interceptors/             # Logging, transform response
│   └── filters/                  # Exception filters globales
│
└── config/                       # Configuración por ambiente
```

---

## 8. Endpoints principales de la API

```
AUTH
  POST   /auth/register
  POST   /auth/login
  POST   /auth/forgot-password
  POST   /auth/reset-password
  GET    /auth/verify?token=

PLAYERS
  GET    /players/me/ranking
  GET    /players/me/matches
  GET    /players/search?q=&tournamentId=

TOURNAMENTS
  GET    /tournaments
  POST   /tournaments                          [ADMIN]
  PATCH  /tournaments/:id/rules               [ADMIN]
  PATCH  /tournaments/:id/publish             [ADMIN]
  POST   /tournaments/:id/close               [ADMIN]
  POST   /tournaments/:id/bracket             [ADMIN]
  GET    /tournaments/:id/bracket
  GET    /tournaments/:id/eligibility
  POST   /tournaments/:id/prizes/distribute   [ADMIN]
  POST   /tournaments/:id/prizes/confirm      [ADMIN]

TEAMS
  POST   /teams                               [CAPTAIN]
  GET    /teams/:id/validity
  POST   /teams/:id/members                   [CAPTAIN]
  DELETE /teams/:id/members/:playerId         [CAPTAIN]
  POST   /teams/:id/confirm                   [CAPTAIN]

ENROLLMENT
  POST   /enrollments                         [CAPTAIN]

MATCHES
  POST   /matches/:id/start                   [ADMIN]
  POST   /matches/:id/confirm-presence        [PLAYER]
  POST   /matches/:id/events
  GET    /matches/:id/events
  GET    /matches/:id/result
  POST   /matches/:id/result/validate         [ADMIN]
  POST   /matches/:id/admin-decision          [ADMIN]
  POST   /matches/:id/reschedule-request      [CAPTAIN]
  PUT    /matches/:id/reschedule-request/:id/accept [CAPTAIN]

SANCTIONS
  GET    /players/:id/sanctions
  POST   /sanctions                           [ADMIN]

AUDIT
  GET    /audit
  GET    /audit/snapshot?entity=&at=
```

---

## 9. Ejemplo de código crítico — Servicio de inscripción

El servicio de inscripción implementa la regla de negocio más compleja del sistema. Es la referencia de cómo deben implementarse todas las operaciones que tocan múltiples entidades.

```typescript
// src/modules/enrollment/enrollment.service.ts
async enrollTeam(dto: EnrollTeamDto, captainId: string): Promise<Team> {
  return await this.dataSource.transaction(async (manager) => {

    // 1. Bloqueo pesimista sobre el torneo
    const tournament = await manager
      .createQueryBuilder(Tournament, 't')
      .where('t.id = :id', { id: dto.tournamentId })
      .setLock('pessimistic_write')
      .getOne();

    if (!tournament || tournament.status !== 'OPEN') {
      throw new BadRequestException('Torneo no disponible para inscripción.');
    }

    // 2. Validación de tamaño de alineación
    if (playerIds.length < tournament.minPlayers ||
        playerIds.length > tournament.maxPlayers) {
      throw new BadRequestException('Alineación fuera del rango permitido.');
    }

    // 3. Carga de jugadores con datos de elegibilidad
    const players = await manager
      .createQueryBuilder(User, 'u')
      .leftJoinAndSelect('u.teamMemberships', 'tm',
        'tm.tournamentId = :tid', { tid: dto.tournamentId })
      .leftJoinAndSelect('u.sanctions', 's', 's.isActive = true')
      .whereInIds(playerIds)
      .getMany();

    // 4. Validación de cada jugador (5 criterios)
    const errors: string[] = [];
    for (const player of players) {
      if (!player.isVerified)
        errors.push(`${player.email}: cuenta no verificada`);
      if (player.rankingScore < tournament.minRanking)
        errors.push(`${player.email}: ranking insuficiente`);
      if (!tournament.allowedRegions.includes(player.region))
        errors.push(`${player.email}: región no permitida`);
      if (player.sanctions?.some(s => s.isActive))
        errors.push(`${player.email}: sanción activa`);
      if (player.teamMemberships?.length > 0)
        errors.push(`${player.email}: ya inscrito en otro equipo`);
      // + verificación de conflicto de horario con query adicional
    }

    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Jugadores inelegibles', errors });
      // ROLLBACK automático al lanzar excepción dentro de la transacción
    }

    // 5. Crear equipo e insertar miembros (dispara trigger de validez)
    const team = manager.create(Team, { ...dto, captainId });
    const savedTeam = await manager.save(team);
    await manager.save(memberships); // trigger recalcula is_valid

    // 6. Auditoría
    await this.auditService.log(manager, {
      actorId: captainId,
      entityType: 'TEAM',
      entityId: savedTeam.id,
      action: 'TEAM_ENROLLED',
      afterState: { teamName: dto.teamName, playerIds },
    });

    return savedTeam;
    // COMMIT automático si no hubo excepciones
  });
}
```

---

## 10. Decisiones de diseño ya tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| ORM | TypeORM | Soporte nativo de transacciones y query builder para JOINs complejos |
| Locking | `SELECT FOR UPDATE` (pesimista) | Previene condiciones de carrera en inscripciones concurrentes |
| Validez de equipo | Trigger de BD, no lógica de aplicación | Garantiza consistencia sin importar qué proceso modifique team_members |
| Versionado de bracket | Trigger automático en INSERT | Elimina la posibilidad de múltiples brackets activos por error de código |
| Inscripción | Transacción única (todo o nada) | Impide estados parciales como equipo inscrito con jugadores inelegibles |
| Auditoría | before_state + after_state en jsonb | Permite reconstruir el estado del sistema en cualquier punto temporal |
| Sanciones | Persistentes entre torneos | Evita que jugadores evadan sanciones creando nuevas cuentas o participando en otros torneos |
| Premios | Redistribución automática | Evitar estados donde un puesto sin equipo válido quede sin premio asignado |
| Ranking | Calculado en background (Bull Queue) | El cálculo con desempate jerárquico es costoso; no debe bloquear flujos síncronos |

---

## 11. Invariantes del sistema (nunca deben violarse)

Estas condiciones deben ser verdaderas en todo momento. Cualquier operación que las viole debe ser bloqueada y registrada como alerta en el audit_log:

1. **No existen dos brackets activos** (`is_active = true`) para el mismo torneo simultáneamente
2. **No existen dos jugadores en equipos distintos** del mismo torneo al mismo tiempo
3. **Ningún resultado validado** (`is_valid = true`) puede ser modificado sin que la modificación invalide todas las partidas dependientes en el bracket
4. **Toda acción de escritura** relevante tiene su correspondiente entrada en `audit_log`
5. **No existen ciclos** en el árbol de dependencias entre matches (`parent_match_id`)
6. **Una partida en estado `IN_PROGRESS`** no permite modificaciones de equipo o jugadores
7. **Un equipo con `is_valid = false`** no puede ser inscrito en ningún torneo

---

## 12. Glosario

| Término | Definición |
|---|---|
| **Bracket** | Árbol de eliminación directa que estructura las partidas de un torneo |
| **Bye** | Pase automático a la siguiente ronda cuando el número de equipos no es potencia de 2 |
| **Seeding** | Asignación de posiciones en el bracket basada en ranking para separar a los mejores equipos |
| **bo1 / bo3 / bo5** | Formato de partida: mejor de 1, 3 o 5 mapas/rondas |
| **is_valid** | Campo booleano de Teams que indica si el equipo cumple todos los requisitos para participar. Calculado automáticamente por trigger |
| **captain_confirmed** | El capitán ha aceptado formalmente participar en el torneo antes del cierre de inscripciones |
| **parent_match_id** | Referencia a la partida siguiente del bracket (la que se desbloquea cuando esta termina) |
| **severity_level** | Nivel numérico de gravedad de una sanción (1=advertencia, 2=pérdida, 3=descalificación, 4+=ban) |
| **affects_validity** | Campo de match_events que indica si un evento en partida impacta la validez del resultado |
| **PENDING_REVIEW** | Estado de partida cuando los eventos superan el umbral y requieren revisión administrativa |

---

*Este documento fue generado como referencia completa del proyecto. Actualizar cuando se tomen nuevas decisiones de arquitectura, se agreguen casos de uso o cambien reglas de negocio.*