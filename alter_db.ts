import { Pool } from "pg";
import fs from "fs";
import path from "path";

const envLocal = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const match = envLocal.match(/POSTGRES_URL="?([^"\n]+)"?/);
const connectionString = match ? match[1] : undefined;

const pool = new Pool({
  connectionString: connectionString,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Altering matches table...");
    await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS score1 INT;`);
    await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS score2 INT;`);
    await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS loser_next_match_id UUID;`);
    await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS loser_next_match_slot SMALLINT;`);
    console.log("Alter complete!");
  } catch (err) {
    console.error("Error altering DB", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
