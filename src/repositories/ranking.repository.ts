import { Pool } from "pg";
import { getPostgresPool } from "@/lib/database";

export interface RankingRow {
  position: number;
  username: string;
  country: string;
  points: number;
  wins: number;
  losses: number;
}

export class RankingRepository {
  constructor(private pool: Pool = getPostgresPool()) {}

  async upsert(userId: string, points: number, wins: number, losses: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO ranking (user_id, points, wins, losses, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET 
         points = EXCLUDED.points,
         wins = EXCLUDED.wins,
         losses = EXCLUDED.losses,
         updated_at = NOW()`,
      [userId, points, wins, losses]
    );
  }

  async getRankingsByCountry(country?: string): Promise<RankingRow[]> {
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY COALESCE(r.points, 0) DESC, COALESCE(r.wins, 0) DESC, COALESCE(r.losses, 0) ASC) as position,
        u.username,
        u.country,
        COALESCE(r.points, 0) as points,
        COALESCE(r.wins, 0) as wins,
        COALESCE(r.losses, 0) as losses
      FROM users u
      LEFT JOIN ranking r ON r.user_id = u.id
      WHERE ($1::varchar IS NULL OR u.country = $1)
      ORDER BY points DESC, wins DESC, losses ASC
    `;
    const result = await this.pool.query<RankingRow>(query, [country || null]);
    return result.rows.map(row => ({
      ...row,
      position: Number(row.position),
      points: Number(row.points),
      wins: Number(row.wins),
      losses: Number(row.losses),
    }));
  }

  async getUserRanking(userId: string): Promise<{ position: number; points: number; wins: number; losses: number } | null> {
    const query = `
      WITH all_rankings AS (
        SELECT 
          u.id as user_id,
          ROW_NUMBER() OVER (ORDER BY COALESCE(r.points, 0) DESC, COALESCE(r.wins, 0) DESC, COALESCE(r.losses, 0) ASC) as position,
          COALESCE(r.points, 0) as points,
          COALESCE(r.wins, 0) as wins,
          COALESCE(r.losses, 0) as losses
        FROM users u
        LEFT JOIN ranking r ON r.user_id = u.id
      )
      SELECT position, points, wins, losses 
      FROM all_rankings 
      WHERE user_id = $1
    `;
    const result = await this.pool.query<{ position: string; points: number; wins: number; losses: number }>(query, [userId]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      position: Number(row.position),
      points: Number(row.points),
      wins: Number(row.wins),
      losses: Number(row.losses),
    };
  }
}
