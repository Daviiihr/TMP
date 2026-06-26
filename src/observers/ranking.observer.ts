import { Observer, AppEvents } from "./event-emitter";
import { Pool } from "pg";
import { getPostgresPool } from "@/lib/database";
import { RankingService } from "@/services/ranking.service";

export class RankingObserver implements Observer<"match:resultApproved"> {
  constructor(
    private rankingService = new RankingService(),
    private pool: Pool = getPostgresPool()
  ) {}

  async update(eventName: "match:resultApproved", data: AppEvents["match:resultApproved"]): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📊 Evento recibido en RankingObserver: ${eventName} para Match ${data.matchId}`);

    try {
      // 1. Obtener detalles del partido y del torneo para saber si es INDIVIDUAL o TEAM
      const matchQuery = `
        SELECT m.participant1_id, m.participant2_id, t.type 
        FROM matches m
        JOIN tournaments t ON m.tournament_id = t.id
        WHERE m.id = $1
      `;
      const matchRes = await this.pool.query<{
        participant1_id: string | null;
        participant2_id: string | null;
        type: "INDIVIDUAL" | "TEAM";
      }>(matchQuery, [data.matchId]);

      if (matchRes.rows.length === 0) {
        console.warn(`[RankingObserver] Partido con ID ${data.matchId} no encontrado en la base de datos.`);
        return;
      }

      const { participant1_id, participant2_id, type } = matchRes.rows[0];
      const playerIdsToUpdate = new Set<string>();

      // 2. Resolver los IDs de usuarios involucrados
      if (type === "INDIVIDUAL") {
        if (participant1_id) playerIdsToUpdate.add(participant1_id);
        if (participant2_id) playerIdsToUpdate.add(participant2_id);
      } else if (type === "TEAM") {
        // Obtener miembros de los equipos participantes
        const teamIds = [participant1_id, participant2_id].filter(Boolean) as string[];
        if (teamIds.length > 0) {
          const membersQuery = `
            SELECT user_id 
            FROM team_members 
            WHERE team_id = ANY($1::uuid[])
          `;
          const membersRes = await this.pool.query<{ user_id: string }>(membersQuery, [teamIds]);
          membersRes.rows.forEach((row) => playerIdsToUpdate.add(row.user_id));
        }
      }

      // 3. Recalcular estadísticas para todos los usuarios encontrados
      const ids = Array.from(playerIdsToUpdate);
      if (ids.length > 0) {
        console.log(`[RankingObserver] Recalculando estadísticas de ranking para ${ids.length} usuarios...`);
        await Promise.all(ids.map((id) => this.rankingService.recalculateUserStats(id)));
        console.log(`[RankingObserver] Recálculo completado exitosamente para los usuarios.`);
      }
    } catch (err) {
      console.error("[RankingObserver] Error al procesar recalculo de ranking en evento:", err);
    }
  }
}
