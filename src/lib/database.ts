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
  const result = await getPostgresPool().query<{
    now: Date;
    database_name: string;
    current_user: string;
  }>("SELECT now(), current_database() AS database_name, current_user");

  return result.rows[0];
}
