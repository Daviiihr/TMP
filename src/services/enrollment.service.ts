import { TeamRepository } from "@/repositories/team.repository";
import { TournamentRepository } from "@/repositories/tournament.repository";
import { Pool } from "pg";

export class EnrollmentService {
  constructor(
    private teamRepo: TeamRepository,
    private tournamentRepo: TournamentRepository,
    private pool: Pool,
  ) {}

  async enrollPlayerInTournament(userId: string, tournamentId: string) {
    const tournament = await this.tournamentRepo.getById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado.");

    if (tournament.type !== "INDIVIDUAL") {
      throw new Error("Este torneo es solo para equipos.");
    }

    const currentCount = await this.tournamentRepo.getEnrollmentCount(tournamentId);
    if (currentCount >= tournament.max_players) {
      throw new Error("El torneo ya ha alcanzado el máximo de jugadores.");
    }

    await this.pool.query(
      `INSERT INTO individual_enrollments (user_id, tournament_id) VALUES ($1, $2)`,
      [userId, tournamentId]
    );

    return { success: true, message: "Te has inscrito exitosamente al torneo." };
  }

  async enrollTeamInTournament(teamId: string, tournamentId: string) {
    const team = await this.teamRepo.findById(teamId);
    const tournament = await this.tournamentRepo.getById(tournamentId);

    if (!team) throw new Error("Equipo no encontrado.");
    if (!tournament) throw new Error("Torneo no encontrado.");

    if (tournament.type !== "TEAM") {
      throw new Error("Este torneo es solo para jugadores individuales.");
    }

    const currentCount = await this.tournamentRepo.getEnrollmentCount(tournamentId);
    if (currentCount >= tournament.max_players) {
      throw new Error("El torneo ya ha alcanzado el máximo de equipos.");
    }

    const teamSize = team.size;
    const requiredSize = tournament.min_players_per_team; // Usamos el mismo valor ya que ahora es fijo

    if (teamSize !== requiredSize) {
      throw new Error(`El equipo debe tener exactamente ${requiredSize} jugadores.`);
    }

    await this.teamRepo.assignToTournament(teamId, tournamentId);
    return { success: true, message: "El equipo se ha inscrito exitosamente en el torneo." };
  }
}
