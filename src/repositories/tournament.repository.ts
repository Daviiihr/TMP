import { getPostgresPool } from "@/lib/database";
import { Pool } from "pg";

export type TournamentSummary = {
  id: string;
  name: string;
  status: string;
  created_at: Date;
};

export class TournamentRepository {
  constructor(private pool: Pool = getPostgresPool()) {}

  /** CRUD — Read: Buscar torneo por ID */
  async getById(id: string) {
    const result = await this.pool.query(
      `SELECT id, name, type, min_players_per_team, max_players_per_team, max_players FROM tournaments WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /** CRUD — Read: Contar inscripciones de un torneo */
  async getEnrollmentCount(tournamentId: string): Promise<number> {
    const tournament = await this.getById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado.");

    if (tournament.type === "INDIVIDUAL") {
      const result = await this.pool.query(
        `SELECT COUNT(*) as count FROM individual_enrollments WHERE tournament_id = $1`,
        [tournamentId]
      );
      return parseInt(result.rows[0].count);
    } else {
      const result = await this.pool.query(
        `SELECT COUNT(*) as count FROM teams WHERE tournament_id = $1`,
        [tournamentId]
      );
      return parseInt(result.rows[0].count);
    }
  }

  /** CRUD — Read: Torneos activos (para la landing page) */
  async findActive(limit: number): Promise<TournamentSummary[]> {
    const result = await this.pool.query<TournamentSummary>(
      `SELECT id, name, status, created_at 
       FROM tournaments 
       WHERE status NOT IN ('CANCELLED', 'COMPLETED') 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /** CRUD — Read: Torneos creados por un organizador (para el dashboard) */
  async findByOrganizer(organizerId: string): Promise<TournamentSummary[]> {
    const result = await this.pool.query<TournamentSummary>(
      `SELECT id, name, status, created_at 
       FROM tournaments 
       WHERE organizer_id = $1 
       ORDER BY created_at DESC`,
      [organizerId]
    );
    return result.rows;
  }
}
