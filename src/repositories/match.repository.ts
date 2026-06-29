import { getPostgresPool } from "@/lib/database";
import { Pool } from "pg";

export class MatchRepository {
  constructor(private pool: Pool = getPostgresPool()) {}

  async updateMatchStatus(matchId: string, status: string): Promise<void> {
    await this.pool.query(
      `UPDATE matches SET status = $1 WHERE id = $2`,
      [status, matchId]
    );
  }

  async updateNextMatchParticipant(
    nextMatchId: string,
    slot: number,
    participantId: string,
    participantName: string
  ): Promise<void> {
    const participantField = slot === 1 ? "participant1_id" : "participant2_id";
    const nameField = slot === 1 ? "participant1_name" : "participant2_name";

    await this.pool.query(
      `UPDATE matches 
       SET ${participantField} = $1, ${nameField} = $2 
       WHERE id = $3`,
      [participantId, participantName, nextMatchId]
    );
  }
}
