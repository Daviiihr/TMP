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
  async recalculateUserStats(userId: string, skipPositionUpdate = false): Promise<{ points: number; wins: number; losses: number }> {
    // 0. Obtener país del usuario y su último match_result_id aprobado
    const userCountryRes = await this.pool.query<{ country: string }>("SELECT country FROM users WHERE id = $1", [userId]);
    const country = userCountryRes.rows[0]?.country || "Chile";

    const lastMatchResultRes = await this.pool.query<{ id: string }>(
      `SELECT mr.id
       FROM match_results mr
       JOIN matches m ON mr.match_id = m.id
       LEFT JOIN team_members tm ON (m.participant1_id = tm.team_id OR m.participant2_id = tm.team_id)
       WHERE mr.status = 'APPROVED'
         AND (m.participant1_id = $1 OR m.participant2_id = $1 OR tm.user_id = $1)
       ORDER BY mr.created_at DESC, mr.id DESC
       LIMIT 1`,
      [userId]
    );
    const lastMatchResultId = lastMatchResultRes.rows[0]?.id || null;

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

    // Guardar en la tabla de ranking por país
    await this.rankingRepo.upsert(userId, country, points, totalWins, totalLosses, lastMatchResultId);

    // Recalcular posiciones del país si no se solicita omitirlo
    if (!skipPositionUpdate) {
      await this.rankingRepo.recalculateCountryPositions();
    }

    return { points, wins: totalWins, losses: totalLosses };
  }

  /**
   * Recalcula el ranking para todos los usuarios registrados en el sistema.
   */
  async recalculateAllRankings(): Promise<void> {
    const usersRes = await this.pool.query<{ id: string }>("SELECT id FROM users");
    const userIds = usersRes.rows.map((u) => u.id);

    // Ejecuta el recálculo concurrentemente para todos los usuarios sin recalcular posiciones individualmente
    await Promise.all(userIds.map((id) => this.recalculateUserStats(id, true)));

    // Recalcula todas las posiciones de forma global y por país una sola vez al final
    await this.rankingRepo.recalculateCountryPositions();
  }
}
