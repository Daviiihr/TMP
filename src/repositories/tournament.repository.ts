import { getPostgresPool } from "@/lib/database";
import { Pool } from "pg";
import type { ValidTournamentCreationInput } from "@/domain/tournament.rules";

export type TournamentSummary = {
  id: string;
  name: string;
  status: string;
  created_at: Date;
};

export class TournamentRepository {
  constructor(private pool: Pool = getPostgresPool()) {}

  async create(data: ValidTournamentCreationInput) {
    const result = await this.pool.query(
      `INSERT INTO tournaments
       (name, game, region, max_players, type, elimination_mode, min_players_per_team, max_players_per_team, start_date, end_date, registration_closes_at, status, organizer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10, 'DRAFT', $11)
       RETURNING id, name, type, elimination_mode, min_players_per_team, max_players_per_team, max_players, organizer_id, status`,
      [
        data.name,
        data.game,
        data.regions,
        data.maxPlayers,
        data.type,
        data.eliminationMode,
        data.playersPerTeam,
        data.startDate,
        data.endDate,
        data.registrationClosesAt,
        data.organizerId,
      ],
    );
    return result.rows[0];
  }

  async existsByName(name: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM tournaments WHERE lower(name) = lower($1) LIMIT 1`,
      [name],
    );
    return result.rows.length > 0;
  }

  /** CRUD — Read: Buscar torneo por ID */
  async getById(id: string) {
    const result = await this.pool.query(
      `SELECT id, name, type, elimination_mode, min_players_per_team, max_players_per_team, max_players, organizer_id, status, start_date, end_date FROM tournaments WHERE id = $1`,
      [id],
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
        [tournamentId],
      );
      return parseInt(result.rows[0].count);
    } else {
      const result = await this.pool.query(
        `SELECT COUNT(*) as count FROM teams WHERE tournament_id = $1`,
        [tournamentId],
      );
      return parseInt(result.rows[0].count);
    }
  }

  /** CRUD — Read: Obtener jugadores inscritos de un torneo individual */
  async getEnrolledPlayers(tournamentId: string) {
    const result = await this.pool.query(
      `SELECT u.id, u.username as name FROM individual_enrollments e JOIN users u ON e.user_id = u.id WHERE e.tournament_id = $1`,
      [tournamentId],
    );
    return result.rows;
  }
  /** CRUD — Read: Obtener equipos inscritos de un torneo por equipos */
  async getEnrolledTeams(tournamentId: string) {
    const result = await this.pool.query(
      `SELECT id, name FROM teams WHERE tournament_id = $1`,
      [tournamentId],
    );
    return result.rows;
  }

  /** CRUD — Read: Torneos activos (para la landing page) */
  async findActive(limit: number): Promise<TournamentSummary[]> {
    const result = await this.pool.query<TournamentSummary>(
      `SELECT id, name, status, created_at 
       FROM tournaments 
       WHERE status NOT IN ('CANCELLED', 'COMPLETED') 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit],
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
      [organizerId],
    );
    return result.rows;
  }

  /** CRUD — Update: Cambiar estado del torneo */
  async updateStatus(id: string, status: string) {
    await this.pool.query(`UPDATE tournaments SET status = $1 WHERE id = $2`, [
      status,
      id,
    ]);
  }

  /** CRUD — Read: Historial de Participación de un usuario */
  async getUserParticipationHistory(userId: string) {
    const result = await this.pool.query(
      `SELECT DISTINCT t.id, t.name, t.game, t.type, t.status, t.created_at,
              CASE WHEN t.type = 'TEAM' THEN tm.name ELSE NULL END as team_name
       FROM tournaments t
       LEFT JOIN individual_enrollments ie ON t.id = ie.tournament_id AND t.type = 'INDIVIDUAL'
       LEFT JOIN teams tm ON t.id = tm.tournament_id AND t.type = 'TEAM'
       LEFT JOIN team_members tmem ON tm.id = tmem.team_id
       WHERE (ie.user_id = $1) OR (tmem.user_id = $1)
       ORDER BY t.created_at DESC`,
      [userId],
    );
    return result.rows;
  }
}
