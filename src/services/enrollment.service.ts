import { TeamRepository } from "@/repositories/team.repository";
import { TournamentRepository } from "@/repositories/tournament.repository";
import { AppEventEmitter } from "@/observers/event-emitter";
import { Pool } from "pg";

export class EnrollmentService {
  constructor(
    private teamRepo: TeamRepository,
    private tournamentRepo: TournamentRepository,
    private pool: Pool,
    private eventEmitter: AppEventEmitter,
  ) {}

  async enrollPlayerInTournament(userId: string, tournamentId: string) {
    const tournament = await this.tournamentRepo.getById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado.");

    if (tournament.status !== "DRAFT" && tournament.status !== "REGISTRATION") {
      throw new Error(
        "El periodo de inscripciones para este torneo está cerrado.",
      );
    }

    if (tournament.type !== "INDIVIDUAL") {
      throw new Error("Este torneo es solo para equipos.");
    }

    // Verificar si el jugador ya está inscrito
    const isEnrolled = await this.pool.query(
      `SELECT 1 FROM individual_enrollments WHERE user_id = $1 AND tournament_id = $2 LIMIT 1`,
      [userId, tournamentId],
    );
    if (isEnrolled.rows.length > 0) {
      throw new Error("Ya te encuentras inscrito en este torneo.");
    }

    const currentCount =
      await this.tournamentRepo.getEnrollmentCount(tournamentId);
    if (currentCount >= tournament.max_players) {
      throw new Error("El torneo ya ha alcanzado el máximo de jugadores.");
    }

    await this.pool.query(
      `INSERT INTO individual_enrollments (user_id, tournament_id) VALUES ($1, $2)`,
      [userId, tournamentId],
    );

    await this.eventEmitter.emit("enrollment:playerJoined", {
      userId,
      tournamentId,
    });

    return {
      success: true,
      message: "Te has inscrito exitosamente al torneo.",
    };
  }

  async enrollTeamInTournament(teamId: string, tournamentId: string) {
    const team = await this.teamRepo.findById(teamId);
    const tournament = await this.tournamentRepo.getById(tournamentId);

    if (!team) throw new Error("Equipo no encontrado.");
    if (!tournament) throw new Error("Torneo no encontrado.");

    if (tournament.status !== "DRAFT" && tournament.status !== "REGISTRATION") {
      throw new Error(
        "El periodo de inscripciones para este torneo está cerrado.",
      );
    }

    if (tournament.type !== "TEAM") {
      throw new Error("Este torneo es solo para jugadores individuales.");
    }

    if (team.tournament_id === tournamentId) {
      throw new Error("Tu equipo ya está inscrito en este torneo.");
    }
    if (team.tournament_id) {
      throw new Error("Tu equipo ya está participando en otro torneo.");
    }

    const currentCount =
      await this.tournamentRepo.getEnrollmentCount(tournamentId);
    if (currentCount >= tournament.max_players) {
      throw new Error("El torneo ya ha alcanzado el máximo de equipos.");
    }

    const actualMemberCount = await this.teamRepo.getMemberCount(teamId);
    const requiredSize = tournament.min_players_per_team;

    if (team.size !== requiredSize) {
      throw new Error(
        `Este torneo requiere equipos diseñados para ${requiredSize} jugadores.`,
      );
    }

    if (actualMemberCount !== requiredSize) {
      throw new Error(
        `El equipo está incompleto. Tienes ${actualMemberCount} de ${requiredSize} jugadores necesarios.`,
      );
    }

    await this.teamRepo.assignToTournament(teamId, tournamentId);

    await this.eventEmitter.emit("enrollment:teamJoined", {
      teamId,
      tournamentId,
    });

    return {
      success: true,
      message: "El equipo se ha inscrito exitosamente en el torneo.",
    };
  }
}
