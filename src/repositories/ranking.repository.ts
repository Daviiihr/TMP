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

  async upsert(
    userId: string,
    country: string,
    points: number,
    wins: number,
    losses: number,
    lastMatchResultId: string | null
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO country_rankings (
        user_id, 
        country, 
        accumulated_points, 
        country_position, 
        wins, 
        losses, 
        last_match_result_id, 
        updated_at
      )
       VALUES (
         $1, 
         $2, 
         $3, 
         COALESCE((SELECT MAX(country_position) + 1 FROM country_rankings WHERE country = $2), 1), 
         $4, 
         $5, 
         $6, 
         NOW()
       )
       ON CONFLICT (user_id)
       DO UPDATE SET 
         country = EXCLUDED.country,
         accumulated_points = EXCLUDED.accumulated_points,
         wins = EXCLUDED.wins,
         losses = EXCLUDED.losses,
         last_match_result_id = EXCLUDED.last_match_result_id,
         updated_at = NOW()`,
      [userId, country, points, wins, losses, lastMatchResultId]
    );
  }

  async recalculateCountryPositions(): Promise<void> {
    await this.pool.query(`
      WITH ranked AS (
        SELECT 
          id,
          ROW_NUMBER() OVER (
            PARTITION BY country 
            ORDER BY accumulated_points DESC, wins DESC, losses ASC
          ) as new_position
        FROM country_rankings
      )
      UPDATE country_rankings cr
      SET country_position = r.new_position
      FROM ranked r
      WHERE cr.id = r.id;
    `);
  }

  async getRankingsByCountry(country?: string): Promise<RankingRow[]> {
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY COALESCE(r.accumulated_points, 0) DESC, COALESCE(r.wins, 0) DESC, COALESCE(r.losses, 0) ASC) as position,
        u.username,
        u.country,
        COALESCE(r.accumulated_points, 0) as points,
        COALESCE(r.wins, 0) as wins,
        COALESCE(r.losses, 0) as losses
      FROM users u
      LEFT JOIN country_rankings r ON r.user_id = u.id
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

  async getUserRanking(userId: string): Promise<{ position: number; points: number; wins: number; losses: number; country: string } | null> {
    const query = `
      WITH all_rankings AS (
        SELECT 
          u.id as user_id,
          ROW_NUMBER() OVER (
            PARTITION BY u.country 
            ORDER BY COALESCE(r.accumulated_points, 0) DESC, COALESCE(r.wins, 0) DESC, COALESCE(r.losses, 0) ASC
          ) as position,
          COALESCE(r.accumulated_points, 0) as points,
          COALESCE(r.wins, 0) as wins,
          COALESCE(r.losses, 0) as losses,
          u.country
        FROM users u
        LEFT JOIN country_rankings r ON r.user_id = u.id
      )
      SELECT position, points, wins, losses, country
      FROM all_rankings 
      WHERE user_id = $1
    `;
    const result = await this.pool.query<{ position: string; points: number; wins: number; losses: number; country: string }>(query, [userId]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      position: Number(row.position),
      points: Number(row.points),
      wins: Number(row.wins),
      losses: Number(row.losses),
      country: row.country,
    };
  }
}
