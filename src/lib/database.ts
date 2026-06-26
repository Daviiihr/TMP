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

  // Migración dinámica auto-ejecutable para la tabla de ranking y columna de país en users
  try {
    const tableCheck = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_name = 'ranking'
       );`
    );
    const rankingTableExists = tableCheck.rows[0]?.exists;

    if (!rankingTableExists) {
      console.log("🛠️ Base de datos: Creando tabla 'ranking' y agregando columna 'country' en 'users'...");
      
      // 1. Agregar columna country si no existe
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country varchar(50) NOT NULL DEFAULT 'Chile';`);
      
      // 2. Crear tabla ranking
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ranking (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
          points integer NOT NULL DEFAULT 0,
          wins integer NOT NULL DEFAULT 0,
          losses integer NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `);

      // 3. Crear disparadores y disparar actualización de fecha
      await pool.query(`
        DROP TRIGGER IF EXISTS ranking_set_updated_at ON ranking;
        CREATE TRIGGER ranking_set_updated_at
        BEFORE UPDATE ON ranking
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `);

      // 4. Crear índice
      await pool.query(`
        CREATE INDEX IF NOT EXISTS ranking_points_idx ON ranking (points DESC);
      `);

      console.log("✅ Migraciones de base de datos aplicadas correctamente.");
    }
  } catch (error) {
    console.error("❌ Error en migración dinámica de base de datos:", error);
  }

  return result.rows[0];
}
