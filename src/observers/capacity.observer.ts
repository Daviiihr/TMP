import { Observer } from "./event-emitter";
import { TournamentRepository } from "@/repositories/tournament.repository";
import { TournamentService } from "@/services/tournament.service";

export class CapacityObserver implements Observer<"enrollment:playerJoined" | "enrollment:teamJoined"> {
  constructor(
    private tournamentRepo: TournamentRepository,
    private tournamentService: TournamentService
  ) {}

  async update(eventName: "enrollment:playerJoined" | "enrollment:teamJoined", data: { tournamentId: string }): Promise<void> {
    const { tournamentId } = data;
    
    try {
      const tournament = await this.tournamentRepo.getById(tournamentId);
      if (!tournament) return;

      const currentCount = await this.tournamentRepo.getEnrollmentCount(tournamentId);
      
      // Si llegamos a la capacidad máxima, cerramos el torneo a COMPLETED (o un nuevo estado cerrado si existiera)
      // En nuestra BD actual, tenemos DRAFT, REGISTRATION, CANCELLED, COMPLETED.
      // Un torneo lleno que va a empezar suele ser COMPLETED (en etapa de registro).
      // Por ahora, asumiremos que se pasa a IN_PROGRESS si es válido, pero nuestra DB constraint validStatuses dice:
      // ["DRAFT", "REGISTRATION", "CANCELLED", "COMPLETED"].
      // Usaremos COMPLETED para indicar que el registro está lleno/cerrado.
      if (currentCount >= tournament.max_players && tournament.status === "REGISTRATION") {
        console.log(`[CapacityObserver] Torneo ${tournamentId} lleno (${currentCount}/${tournament.max_players}). Cambiando estado a COMPLETED.`);
        // Note: We use 'SYSTEM' as the user ID for automated actions
        await this.tournamentService.changeStatus(tournamentId, "COMPLETED", tournament.organizer_id);
      }
    } catch (error) {
      console.error(`[CapacityObserver] Error verificando capacidad del torneo ${tournamentId}:`, error);
    }
  }
}
