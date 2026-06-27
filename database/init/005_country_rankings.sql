-- Agregar columna country a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS country varchar(50) NOT NULL DEFAULT 'Chile';

CREATE TABLE IF NOT EXISTS country_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  country varchar(80) NOT NULL,

  -- Ranking acumulado del usuario dentro de su pais.
  accumulated_points integer NOT NULL DEFAULT 0,
  country_position integer NOT NULL,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,

  -- Ultimo resultado considerado por el recalculo del ranking.
  last_match_result_id uuid REFERENCES match_results(id) ON DELETE SET NULL,

  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT country_rankings_points_check CHECK (accumulated_points >= 0),
  CONSTRAINT country_rankings_position_check CHECK (country_position >= 1),
  CONSTRAINT country_rankings_wins_check CHECK (wins >= 0),
  CONSTRAINT country_rankings_losses_check CHECK (losses >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS country_rankings_country_position_idx
ON country_rankings (country, country_position);

CREATE INDEX IF NOT EXISTS country_rankings_country_points_idx
ON country_rankings (country, accumulated_points DESC, wins DESC, losses ASC);

CREATE INDEX IF NOT EXISTS country_rankings_user_id_idx
ON country_rankings (user_id);

DROP TRIGGER IF EXISTS country_rankings_set_updated_at ON country_rankings;
CREATE TRIGGER country_rankings_set_updated_at
BEFORE UPDATE ON country_rankings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
