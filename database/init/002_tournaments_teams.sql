DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tournament_status') THEN
    CREATE TYPE tournament_status AS ENUM ('DRAFT', 'REGISTRATION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tournament_type') THEN
    CREATE TYPE tournament_type AS ENUM ('INDIVIDUAL', 'TEAM');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  game varchar(80) NOT NULL DEFAULT 'Sin juego',
  region text[] NOT NULL DEFAULT ARRAY[]::text[],
  max_players integer NOT NULL DEFAULT 4,
  type tournament_type NOT NULL DEFAULT 'INDIVIDUAL',
  elimination_mode varchar(30) NOT NULL DEFAULT 'SINGLE_ELIMINATION',
  min_players_per_team integer,
  max_players_per_team integer,
  start_date timestamptz,
  end_date timestamptz,
  registration_closes_at timestamptz,
  organizer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status tournament_status NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournaments_type_check CHECK (type IN ('INDIVIDUAL', 'TEAM')),
  CONSTRAINT tournaments_elimination_mode_check CHECK (elimination_mode IN ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION')),
  CONSTRAINT tournaments_min_participants_check CHECK (max_players >= 4)
);


ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS game varchar(100) NOT NULL DEFAULT 'Sin juego';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS region text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS max_players integer NOT NULL DEFAULT 4;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS type tournament_type NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS elimination_mode varchar(30) NOT NULL DEFAULT 'SINGLE_ELIMINATION';
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS min_players_per_team integer;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS max_players_per_team integer;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS start_date timestamptz;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS end_date timestamptz;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS registration_closes_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_type_check') THEN
    ALTER TABLE tournaments ADD CONSTRAINT tournaments_type_check CHECK (type IN ('INDIVIDUAL', 'TEAM'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_elimination_mode_check') THEN
    ALTER TABLE tournaments ADD CONSTRAINT tournaments_elimination_mode_check CHECK (elimination_mode IN ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_min_participants_check') THEN
    ALTER TABLE tournaments ADD CONSTRAINT tournaments_min_participants_check CHECK (max_players >= 4);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS unique_tournament_name_ci
ON tournaments (lower(name));

-- Regla de negocio: Solo 1 torneo activo a la vez por usuario.
-- Si el estado no es COMPLETADO o CANCELADO, no puede crear otro.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_tournament_per_organizer 
ON tournaments (organizer_id) 
WHERE status NOT IN ('COMPLETED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(50) NOT NULL UNIQUE,
  captain_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  size integer NOT NULL DEFAULT 1,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teams_size_check CHECK (size >= 1)
);

ALTER TABLE teams ADD COLUMN IF NOT EXISTS size integer NOT NULL DEFAULT 1;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_size_check') THEN
    ALTER TABLE teams ADD CONSTRAINT teams_size_check CHECK (size >= 1);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS individual_enrollments (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tournament_id)
);

ALTER TABLE teams ADD COLUMN IF NOT EXISTS size integer NOT NULL DEFAULT 1;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members (user_id);

CREATE TABLE IF NOT EXISTS individual_enrollments (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tournament_id)
);

CREATE INDEX IF NOT EXISTS individual_enrollments_tournament_id_idx
ON individual_enrollments (tournament_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS tournaments_set_updated_at ON tournaments;
CREATE TRIGGER tournaments_set_updated_at
BEFORE UPDATE ON tournaments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS teams_set_updated_at ON teams;
CREATE TRIGGER teams_set_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
