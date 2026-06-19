DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'validation_status') THEN
    CREATE TYPE validation_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  
  -- Puntuaciones finales
  score_participant1 integer NOT NULL DEFAULT 0,
  score_participant2 integer NOT NULL DEFAULT 0,
  
  -- Estado de validación
  status validation_status NOT NULL DEFAULT 'PENDING',
  
  -- Detalles en caso de rechazo
  rejection_reason text,
  
  -- Tiempos de registro
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS match_results_set_updated_at ON match_results;
CREATE TRIGGER match_results_set_updated_at
BEFORE UPDATE ON match_results
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
