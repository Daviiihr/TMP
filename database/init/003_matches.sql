CREATE TABLE IF NOT EXISTS brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,

  -- Versionado del bracket. Cada regeneración crea una nueva versión.
  version integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,

  -- Resumen calculado por el generador de brackets.
  elimination_mode varchar(30) NOT NULL DEFAULT 'SINGLE_ELIMINATION',
  bracket_size integer NOT NULL,
  total_participants integer NOT NULL,
  total_rounds integer NOT NULL,
  seeding_strategy varchar(40) NOT NULL DEFAULT 'RANKING',

  -- Snapshot completo del árbol generado: rondas, matches, slots y BYEs.
  bracket_data jsonb NOT NULL DEFAULT '{}'::jsonb,

  generated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT brackets_version_check CHECK (version >= 1),
  CONSTRAINT brackets_bracket_size_check CHECK (bracket_size >= 2),
  CONSTRAINT brackets_total_participants_check CHECK (total_participants >= 2),
  CONSTRAINT brackets_total_rounds_check CHECK (total_rounds >= 1),
  CONSTRAINT brackets_elimination_mode_check CHECK (elimination_mode IN ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION'))
);

ALTER TABLE brackets ADD COLUMN IF NOT EXISTS version integer;
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS elimination_mode varchar(30) NOT NULL DEFAULT 'SINGLE_ELIMINATION';
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS bracket_size integer NOT NULL DEFAULT 2;
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS total_participants integer NOT NULL DEFAULT 2;
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS total_rounds integer NOT NULL DEFAULT 1;
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS seeding_strategy varchar(40) NOT NULL DEFAULT 'RANKING';
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS bracket_data jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS generated_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS generated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

WITH ranked_brackets AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY tournament_id ORDER BY generated_at, created_at, id)::integer AS next_version
  FROM brackets
  WHERE version IS NULL
)
UPDATE brackets
SET version = ranked_brackets.next_version
FROM ranked_brackets
WHERE brackets.id = ranked_brackets.id;

ALTER TABLE brackets ALTER COLUMN version SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brackets_version_check') THEN
    ALTER TABLE brackets ADD CONSTRAINT brackets_version_check CHECK (version >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brackets_bracket_size_check') THEN
    ALTER TABLE brackets ADD CONSTRAINT brackets_bracket_size_check CHECK (bracket_size >= 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brackets_total_participants_check') THEN
    ALTER TABLE brackets ADD CONSTRAINT brackets_total_participants_check CHECK (total_participants >= 2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brackets_total_rounds_check') THEN
    ALTER TABLE brackets ADD CONSTRAINT brackets_total_rounds_check CHECK (total_rounds >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brackets_elimination_mode_check') THEN
    ALTER TABLE brackets ADD CONSTRAINT brackets_elimination_mode_check CHECK (elimination_mode IN ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION'));
  END IF;
END $$;

WITH ranked_active_brackets AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY tournament_id ORDER BY generated_at DESC, created_at DESC, id DESC) AS active_rank
  FROM brackets
  WHERE is_active = true
)
UPDATE brackets
SET is_active = false
FROM ranked_active_brackets
WHERE brackets.id = ranked_active_brackets.id
  AND ranked_active_brackets.active_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS unique_bracket_version_per_tournament
ON brackets (tournament_id, version);

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_bracket_per_tournament
ON brackets (tournament_id)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS brackets_tournament_id_idx
ON brackets (tournament_id);

CREATE OR REPLACE FUNCTION set_bracket_version_and_active()
RETURNS trigger AS $$
BEGIN
  IF NEW.version IS NULL THEN
    SELECT COALESCE(MAX(version), 0) + 1
    INTO NEW.version
    FROM brackets
    WHERE tournament_id = NEW.tournament_id;
  END IF;

  IF NEW.is_active THEN
    UPDATE brackets
    SET is_active = false
    WHERE tournament_id = NEW.tournament_id
      AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bracket_versioning ON brackets;
CREATE TRIGGER trg_bracket_versioning
BEFORE INSERT ON brackets
FOR EACH ROW EXECUTE FUNCTION set_bracket_version_and_active();

DROP TRIGGER IF EXISTS brackets_set_updated_at ON brackets;
CREATE TRIGGER brackets_set_updated_at
BEFORE UPDATE ON brackets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  bracket_id uuid NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
  
  -- Información de la posición en el bracket
  round_number integer NOT NULL,
  match_number integer NOT NULL,
  round_label varchar(60),
  
  -- Participante 1 (uuid de usuario o equipo. NULL si es "Por definir")
  participant1_id uuid,
  participant1_name varchar(100),
  
  -- Participante 2
  participant2_id uuid,
  participant2_name varchar(100),
  
  -- Ganador de la partida
  winner_id uuid,

  -- Relación con la siguiente partida donde avanza el ganador
  next_match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  next_match_slot smallint,
  
  -- Indica si uno de los participantes pasa automáticamente (Bye)
  is_bye boolean NOT NULL DEFAULT false,
  status varchar(30) NOT NULL DEFAULT 'PENDING',
  
  -- Tiempos de registro
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Restricción para evitar partidas duplicadas en la misma ronda
  CONSTRAINT matches_unique_bracket_position UNIQUE (tournament_id, bracket_id, round_number, match_number),
  CONSTRAINT matches_status_check CHECK (status IN ('PENDING', 'READY', 'IN_PROGRESS', 'FINISHED', 'PENDING_REVIEW')),
  CONSTRAINT matches_next_match_slot_check CHECK (next_match_slot IS NULL OR next_match_slot IN (1, 2))
);

ALTER TABLE matches ADD COLUMN IF NOT EXISTS bracket_id uuid REFERENCES brackets(id) ON DELETE CASCADE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round_label varchar(60);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS next_match_id uuid REFERENCES matches(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS next_match_slot smallint;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status varchar(30) NOT NULL DEFAULT 'PENDING';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS finished_at timestamptz;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_tournament_id_round_number_match_number_key') THEN
    ALTER TABLE matches DROP CONSTRAINT matches_tournament_id_round_number_match_number_key;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_unique_bracket_position') THEN
    ALTER TABLE matches ADD CONSTRAINT matches_unique_bracket_position UNIQUE (tournament_id, bracket_id, round_number, match_number);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_status_check') THEN
    ALTER TABLE matches ADD CONSTRAINT matches_status_check CHECK (status IN ('PENDING', 'READY', 'IN_PROGRESS', 'FINISHED', 'PENDING_REVIEW'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_next_match_slot_check') THEN
    ALTER TABLE matches ADD CONSTRAINT matches_next_match_slot_check CHECK (next_match_slot IS NULL OR next_match_slot IN (1, 2));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS matches_bracket_id_idx
ON matches (bracket_id);

CREATE INDEX IF NOT EXISTS matches_next_match_id_idx
ON matches (next_match_id);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS matches_set_updated_at ON matches;
CREATE TRIGGER matches_set_updated_at
BEFORE UPDATE ON matches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
