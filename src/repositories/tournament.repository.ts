import { getPostgresPool } from "@/lib/database";

export class TournamentRepository {
  private pool = getPostgresPool();

  async getById(id: string) {
    const result = await this.pool.query(
      `SELECT id, name, type, min_players_per_team, max_players_per_team, max_players FROM tournaments WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getEnrollmentCount(tournamentId: string): Promise<number> {
    // For individual tournaments, count individual_enrollments
    // For team tournaments, count teams linked to this tournament
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
}
