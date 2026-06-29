import { Pool } from "pg";
import { databaseUrl } from "./env";

declare global {
  var tmpPostgresPool: Pool | undefined;
}

export function getPostgresPool() {
  if (!globalThis.tmpPostgresPool) {
    globalThis.tmpPostgresPool = new Pool({
      connectionString: databaseUrl(),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return globalThis.tmpPostgresPool;
}

export async function assertDatabaseConnection() {
  const pool = getPostgresPool();
  const result = await pool.query<{
    now: Date;
    database_name: string;
    current_user: string;
  }>("SELECT now(), current_database() AS database_name, current_user");

  // Migración dinámica auto-ejecutable para la tabla de rankings por país y columna de país en users
  try {
    // 0. Eliminar la tabla obsoleta 'ranking' si existe
    await pool.query(`DROP TABLE IF EXISTS ranking CASCADE;`);

    const tableCheck = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_name = 'country_rankings'
       );`
    );
    const rankingsTableExists = tableCheck.rows[0]?.exists;

    if (!rankingsTableExists) {
      console.log("🛠️ Base de datos: Creando tabla 'country_rankings' y agregando columna 'country' en 'users'...");
      
      // 1. Agregar columna country si no existe
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country varchar(50) NOT NULL DEFAULT 'Chile';`);
      
      // 2. Crear tabla country_rankings
      await pool.query(`
        CREATE TABLE IF NOT EXISTS country_rankings (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
          country varchar(80) NOT NULL,
          accumulated_points integer NOT NULL DEFAULT 0,
          country_position integer NOT NULL,
          wins integer NOT NULL DEFAULT 0,
          losses integer NOT NULL DEFAULT 0,
          last_match_result_id uuid REFERENCES match_results(id) ON DELETE SET NULL,
          calculated_at timestamptz NOT NULL DEFAULT now(),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT country_rankings_points_check CHECK (accumulated_points >= 0),
          CONSTRAINT country_rankings_position_check CHECK (country_position >= 1),
          CONSTRAINT country_rankings_wins_check CHECK (wins >= 0),
          CONSTRAINT country_rankings_losses_check CHECK (losses >= 0)
        );
      `);

      // 3. Crear índices
      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS country_rankings_country_position_idx
        ON country_rankings (country, country_position);
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS country_rankings_country_points_idx
        ON country_rankings (country, accumulated_points DESC, wins DESC, losses ASC);
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS country_rankings_user_id_idx
        ON country_rankings (user_id);
      `);

      // 4. Crear disparadores
      await pool.query(`
        DROP TRIGGER IF EXISTS country_rankings_set_updated_at ON country_rankings;
        CREATE TRIGGER country_rankings_set_updated_at
        BEFORE UPDATE ON country_rankings
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `);

      console.log("✅ Migraciones de base de datos aplicadas correctamente.");
    }

    // 5. Migraciones para la tabla de matches (Funcionalidad avanzada de Brackets)
    const matchesTableCheck = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_name = 'matches'
       );`
    );
    if (matchesTableCheck.rows[0]?.exists) {
      await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS score1 INT DEFAULT 0;`);
      await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS score2 INT DEFAULT 0;`);
      await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS loser_next_match_id UUID;`);
      await pool.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS loser_next_match_slot SMALLINT;`);
    }

  } catch (error) {
    console.error("❌ Error en migración dinámica de base de datos:", error);
  }

  return result.rows[0];
}
