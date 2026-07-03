import { Pool } from "pg";
import { getPostgresPool } from "@/lib/database";

export interface MatchResultRow {
  id: string;
  match_id: string;
  score_participant1: number;
  score_participant2: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PendingValidationRow {
  validation_id: string;
  match_id: string;
  score_participant1: number;
  score_participant2: number;
  created_at: Date;
  participant1_name: string | null;
  participant2_name: string | null;
  round_label: string | null;
  round_number: number;
  match_number: number;
  tournament_id: string;
  tournament_name: string;
}

export class MatchResultRepository {
  constructor(private pool: Pool = getPostgresPool()) {}

  async reportResult(
    matchId: string,
    score1: number,
    score2: number,
  ): Promise<MatchResultRow> {
    const res = await this.pool.query<MatchResultRow>(
      `INSERT INTO match_results (match_id, score_participant1, score_participant2, status)
       VALUES ($1, $2, $3, 'PENDING')
       ON CONFLICT (match_id) DO UPDATE SET 
         score_participant1 = EXCLUDED.score_participant1,
         score_participant2 = EXCLUDED.score_participant2,
         status = 'PENDING',
         rejection_reason = NULL,
         updated_at = now()
       RETURNING *`,
      [matchId, score1, score2],
    );

    await this.pool.query(
      `UPDATE matches SET status = 'PENDING_REVIEW', updated_at = now() WHERE id = $1`,
      [matchId],
    );

    return res.rows[0];
  }

  async getPendingResults(): Promise<PendingValidationRow[]> {
    const res = await this.pool.query<PendingValidationRow>(
      `SELECT 
         mr.id as validation_id,
         mr.match_id,
         mr.score_participant1,
         mr.score_participant2,
         mr.created_at,
         m.participant1_name,
         m.participant2_name,
         m.round_label,
         m.round_number,
         m.match_number,
         t.id as tournament_id,
         t.name as tournament_name
       FROM match_results mr
       JOIN matches m ON mr.match_id = m.id
       JOIN tournaments t ON m.tournament_id = t.id
       WHERE mr.status = 'PENDING'
       ORDER BY mr.created_at ASC`,
    );
    return res.rows;
  }

  async updateStatus(
    validationId: string,
    status: "APPROVED" | "REJECTED",
    rejectionReason?: string,
  ): Promise<MatchResultRow | null> {
    const res = await this.pool.query<MatchResultRow>(
      `UPDATE match_results 
       SET status = $1, rejection_reason = $2, updated_at = now() 
       WHERE id = $3 
       RETURNING *`,
      [status, rejectionReason || null, validationId],
    );

    if (res.rows.length > 0 && status === "REJECTED") {
      await this.pool.query(
        `UPDATE matches SET status = 'IN_PROGRESS', updated_at = now() WHERE id = $1`,
        [res.rows[0].match_id],
      );
    }

    return res.rows[0] || null;
  }
}
