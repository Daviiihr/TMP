import { getPostgresPool } from "@/lib/database";
import { Pool } from "pg";

export interface Team {
  id: string;
  name: string;
  captain_id: string;
  size: number;
  tournament_id: string | null;
  created_at: Date;
}

export type TeamWithMemberCount = Team & { member_count: number };

export class TeamRepository {
  constructor(private pool: Pool = getPostgresPool()) {}

  async create(data: { name: string; captain_id: string; size: number }): Promise<Team> {
    const result = await this.pool.query<Team>(
      `INSERT INTO teams (name, captain_id, size) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, captain_id, size, tournament_id, created_at`,
      [data.name, data.captain_id, data.size]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Team | null> {
    const result = await this.pool.query<Team>(
      `SELECT id, name, captain_id, size, tournament_id, created_at FROM teams WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByCaptain(captainId: string): Promise<Team[]> {
    const result = await this.pool.query<Team>(
      `SELECT id, name, captain_id, size, tournament_id, created_at FROM teams WHERE captain_id = $1`,
      [captainId]
    );
    return result.rows;
  }

  async findByMember(userId: string): Promise<TeamWithMemberCount[]> {
    const result = await this.pool.query<TeamWithMemberCount>(
      `SELECT t.id, t.name, t.captain_id, t.size, t.tournament_id, t.created_at,
              COUNT(all_members.user_id)::int as member_count
       FROM teams t
       INNER JOIN team_members user_members ON t.id = user_members.team_id
       LEFT JOIN team_members all_members ON t.id = all_members.team_id
       WHERE user_members.user_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async assignToTournament(teamId: string, tournamentId: string) {
    await this.pool.query(
      `UPDATE teams SET tournament_id = $2 WHERE id = $1`,
      [teamId, tournamentId]
    );
  }

  async searchTeams(query: string): Promise<TeamWithMemberCount[]> {
    const result = await this.pool.query(
      `SELECT t.id, t.name, t.captain_id, t.size, t.tournament_id, t.created_at,
              COUNT(tm.user_id)::int as member_count
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id
       WHERE t.name ILIKE $1
       GROUP BY t.id`,
      [`%${query}%`]
    );
    return result.rows;
  }

  async addMember(teamId: string, userId: string) {
    await this.pool.query(
      `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)`,
      [teamId, userId]
    );
  }

  async getMemberCount(teamId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM team_members WHERE team_id = $1`,
      [teamId]
    );
    return parseInt(result.rows[0].count);
  }

  async isUserInTeam(teamId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId]
    );
    return result.rows.length > 0;
  }
}
