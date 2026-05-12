import { TeamRepository, Team } from "@/repositories/team.repository";
import { UserRepository } from "@/repositories/user.repository";

export class TeamService {
  private teamRepo = new TeamRepository();
  private userRepo = new UserRepository();

  async createTeam(name: string, captainId: string, size: number): Promise<Team> {
    if (size < 1) throw new Error("El tamaño del equipo debe ser al menos 1.");
    
    const team = await this.teamRepo.create({ name, captain_id: captainId, size });
    
    // Automatically add the captain as the first member
    await this.teamRepo.addMember(team.id, captainId);

    // Update user role to CAPTAIN only if they are currently a PLAYER
    const user = await this.userRepo.findById(captainId);
    if (user && user.role === "PLAYER") {
      await this.userRepo.updateRole(captainId, "CAPTAIN");
    }
    
    return team;
  }

  async getMyTeams(captainId: string): Promise<Team[]> {
    return this.teamRepo.findByCaptain(captainId);
  }

  async getTeam(id: string): Promise<Team | null> {
    return this.teamRepo.findById(id);
  }

  async searchTeams(query: string) {
    return this.teamRepo.searchTeams(query);
  }

  async joinTeam(teamId: string, userId: string) {
    const team = await this.teamRepo.findById(teamId);
    if (!team) throw new Error("Equipo no encontrado.");

    const isMember = await this.teamRepo.isUserInTeam(teamId, userId);
    if (isMember) throw new Error("Ya eres miembro de este equipo.");

    const currentCount = await this.teamRepo.getMemberCount(teamId);
    if (currentCount >= team.size) {
      throw new Error("El equipo ya está lleno.");
    }

    await this.teamRepo.addMember(teamId, userId);
    return { success: true, message: "Te has unido al equipo exitosamente." };
  }
}
