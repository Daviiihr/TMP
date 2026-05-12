import { getPostgresPool } from "@/lib/database";

export type TournamentSummary = {
  id: string;
  name: string;
  status: string;
  created_at: Date;
};

export class TournamentRepository {
  private pool = getPostgresPool();

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
