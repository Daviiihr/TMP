import { Pool } from "pg";
import type { TournamentCreationInput } from "@/domain/tournament.rules";
import { validateTournamentCreation } from "@/domain/tournament.rules";
import { AppEventEmitter } from "@/observers/event-emitter";
import { TournamentRepository } from "@/repositories/tournament.repository";

export class TournamentService {
  constructor(
    private tournamentRepo: TournamentRepository,
    private pool: Pool,
    private eventEmitter: AppEventEmitter
  ) {}

  async createTournament(input: TournamentCreationInput) {
    const data = validateTournamentCreation(input);

    const nameAlreadyExists = await this.tournamentRepo.existsByName(data.name);
    if (nameAlreadyExists) {
      throw new Error("Ya existe un torneo con ese nombre.");
    }

    return this.tournamentRepo.create(data);
  }

  async changeStatus(tournamentId: string, newStatus: string, userId: string) {
    const validStatuses = ["DRAFT", "REGISTRATION", "IN_PROGRESS", "CANCELLED", "COMPLETED"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Status inválido. Debe ser: ${validStatuses.join(", ")}`);
    }

    const tournament = await this.tournamentRepo.getById(tournamentId);

    if (!tournament) {
      throw new Error("Torneo no encontrado.");
    }

    if (tournament.organizer_id !== userId && userId !== 'SYSTEM') {
      throw new Error("No tienes permiso para modificar este torneo.");
    }

    const oldStatus = tournament.status;
    if (oldStatus === newStatus) {
      return { success: true, message: `El torneo ya está en estado ${newStatus}` };
    }

    // Si se quiere activar (REGISTRATION), verificar que no haya otro activo
    if (newStatus === "REGISTRATION") {
      const active = await this.pool.query(
        "SELECT id, name FROM tournaments WHERE organizer_id = $1 AND status = 'REGISTRATION' AND id != $2",
        [tournament.organizer_id, tournamentId] // Usar organizer_id del torneo
      );
      if (active.rows.length > 0) {
        throw new Error(`Ya tienes un torneo activo: "${active.rows[0].name}". Desactívalo primero.`);
      }
    }

    await this.pool.query("UPDATE tournaments SET status = $1 WHERE id = $2", [newStatus, tournamentId]);

    // Emitir evento
    await this.eventEmitter.emit("tournament:statusChanged", {
      tournamentId,
      oldStatus,
      newStatus,
      userId
    });

    return {
      success: true,
      message: `Torneo actualizado a ${newStatus}.`,
    };
  }
}
