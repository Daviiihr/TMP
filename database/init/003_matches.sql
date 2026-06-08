CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  
  -- Información de la posición en el bracket
  round_number integer NOT NULL,
  match_number integer NOT NULL,
  
  -- Participante 1 (uuid de usuario o equipo. NULL si es "Por definir")
  participant1_id uuid,
  participant1_name varchar(100),
  
  -- Participante 2
  participant2_id uuid,
  participant2_name varchar(100),
  
  -- Ganador de la partida
  winner_id uuid,
  
  -- Indica si uno de los participantes pasa automáticamente (Bye)
  is_bye boolean NOT NULL DEFAULT false,
  
  -- Tiempos de registro
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Restricción para evitar partidas duplicadas en la misma ronda
  UNIQUE(tournament_id, round_number, match_number)
);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS matches_set_updated_at ON matches;
CREATE TRIGGER matches_set_updated_at
BEFORE UPDATE ON matches
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
