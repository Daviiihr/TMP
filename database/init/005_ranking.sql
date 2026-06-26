-- Agregar columna country a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS country varchar(50) NOT NULL DEFAULT 'Chile';

-- Crear la tabla ranking
CREATE TABLE IF NOT EXISTS ranking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  points integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para mantener actualizado updated_at en la tabla ranking
DROP TRIGGER IF EXISTS ranking_set_updated_at ON ranking;
CREATE TRIGGER ranking_set_updated_at
BEFORE UPDATE ON ranking
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Índice para mejorar las consultas del ranking ordenado por puntos descendentemente
CREATE INDEX IF NOT EXISTS ranking_points_idx ON ranking (points DESC);
