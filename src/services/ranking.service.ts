import { Pool } from "pg";
import { getPostgresPool } from "@/lib/database";
import { RankingRepository } from "@/repositories/ranking.repository";

export class RankingService {
  constructor(
    private rankingRepo = new RankingRepository(),
    private pool: Pool = getPostgresPool()
  ) {}

  /**
   * Recalcula y persiste los puntos, victorias y derrotas de un usuario
   * analizando todos los partidos aprobados (individuales y por equipos).
   */
  async recalculateUserStats(userId: string): Promise<{ points: number; wins: number; losses: number }> {
    // 1. Partidas individuales aprobadas
    const indQuery = `
      SELECT 
        COUNT(CASE WHEN m.winner_id = $1 THEN 1 END) as wins,
        COUNT(CASE WHEN m.winner_id != $1 AND m.winner_id IS NOT NULL THEN 1 END) as losses
      FROM matches m
      JOIN match_results mr ON mr.match_id = m.id
      WHERE mr.status = 'APPROVED' AND (m.participant1_id = $1 OR m.participant2_id = $1)
    `;
    const indRes = await this.pool.query<{ wins: string; losses: string }>(indQuery, [userId]);
    const indWins = parseInt(indRes.rows[0]?.wins || "0", 10);
    const indLosses = parseInt(indRes.rows[0]?.losses || "0", 10);

    // 2. Partidas grupales (por equipos) aprobadas
    const teamQuery = `
      SELECT 
        COUNT(CASE WHEN m.winner_id = tm.team_id THEN 1 END) as wins,
        COUNT(CASE WHEN m.winner_id != tm.team_id AND m.winner_id IS NOT NULL THEN 1 END) as losses
      FROM matches m
      JOIN match_results mr ON mr.match_id = m.id
      JOIN team_members tm ON (m.participant1_id = tm.team_id OR m.participant2_id = tm.team_id)
      WHERE mr.status = 'APPROVED' AND tm.user_id = $1
    `;
    const teamRes = await this.pool.query<{ wins: string; losses: string }>(teamQuery, [userId]);
    const teamWins = parseInt(teamRes.rows[0]?.wins || "0", 10);
    const teamLosses = parseInt(teamRes.rows[0]?.losses || "0", 10);

    const totalWins = indWins + teamWins;
    const totalLosses = indLosses + teamLosses;

    // Regla de cálculo de puntos: 3 por victoria, 1 por derrota/participación
    const points = (totalWins * 3) + (totalLosses * 1);

    // Guardar en la tabla de ranking
    await this.rankingRepo.upsert(userId, points, totalWins, totalLosses);

    return { points, wins: totalWins, losses: totalLosses };
  }

  /**
   * Recalcula el ranking para todos los usuarios registrados en el sistema.
   */
  async recalculateAllRankings(): Promise<void> {
    const usersRes = await this.pool.query<{ id: string }>("SELECT id FROM users");
    const userIds = usersRes.rows.map((u) => u.id);

    // Ejecuta el recálculo concurrentemente para todos los usuarios
    await Promise.all(userIds.map((id) => this.recalculateUserStats(id)));
  }
}
