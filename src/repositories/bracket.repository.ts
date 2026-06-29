import { getPostgresPool } from "@/lib/database";
import { Pool } from "pg";
import { BracketResult, Match } from "@/lib/algorithms/brackets";

export class BracketRepository {
  constructor(private pool: Pool = getPostgresPool()) {}

  async saveBracket(
    tournamentId: string, 
    userId: string, 
    bracketData: BracketResult, 
    eliminationMode: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' = 'SINGLE_ELIMINATION'
  ) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Insert into brackets
      const bracketRes = await client.query(
        `INSERT INTO brackets 
         (tournament_id, elimination_mode, bracket_size, total_participants, total_rounds, bracket_data, generated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          tournamentId,
          eliminationMode,
          bracketData.bracketSize,
          bracketData.totalParticipants,
          bracketData.totalRounds,
          JSON.stringify(bracketData),
          userId
        ]
      );
      
      const bracketId = bracketRes.rows[0].id;
      
      // 2. Insert into matches
      // Flatten all rounds (winners and losers) to extract matches
      const allMatches: Match[] = [];
      bracketData.rounds.forEach(r => allMatches.push(...r.matches));
      if (bracketData.loserRounds) {
        bracketData.loserRounds.forEach(r => allMatches.push(...r.matches));
      }

      // In Postgres, we can't easily insert self-referential rows with their final UUIDs 
      // if we don't have them yet, unless we map the algorithm's string IDs to Postgres UUIDs first.
      // So we will first generate UUIDs for all matches, map them, then insert.
      
      const matchIdMap = new Map<string, string>(); // 'w_r1_m1' -> 'postgres_uuid'
      
      for (const m of allMatches) {
        const idRes = await client.query(`SELECT gen_random_uuid() as uuid`);
        matchIdMap.set(m.id, idRes.rows[0].uuid);
      }
      
      // Now insert each match
      for (const m of allMatches) {
        const pgId = matchIdMap.get(m.id);
        const nextPgId = m.nextMatchId ? matchIdMap.get(m.nextMatchId) : null;
        
        await client.query(
          `INSERT INTO matches
           (id, tournament_id, bracket_id, round_number, match_number, round_label, 
            participant1_id, participant1_name, participant2_id, participant2_name, 
            next_match_id, next_match_slot, is_bye, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            pgId,
            tournamentId,
            bracketId,
            m.round,
            m.matchNumber,
            m.roundLabel,
            m.player1?.id || null,
            m.player1?.name || null,
            m.player2?.id || null,
            m.player2?.name || null,
            nextPgId,
            m.nextMatchSlot || null,
            m.isBye,
            m.isBye ? 'FINISHED' : 'PENDING'
          ]
        );
        
        // If it's a Bye, the single player automatically advances
        if (m.isBye && nextPgId) {
          const advancingPlayer = m.player1 || m.player2;
          if (advancingPlayer) {
             const participantField = m.nextMatchSlot === 1 ? 'participant1_id' : 'participant2_id';
             const nameField = m.nextMatchSlot === 1 ? 'participant1_name' : 'participant2_name';
             await client.query(
               `UPDATE matches SET ${participantField} = $1, ${nameField} = $2 WHERE id = $3`,
               [advancingPlayer.id, advancingPlayer.name, nextPgId]
             );
          }
        }
      }
      
      await client.query('COMMIT');
      return bracketId;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  
  async getActiveBracket(tournamentId: string) {
    const res = await this.pool.query(
      `SELECT * FROM brackets WHERE tournament_id = $1 AND is_active = true LIMIT 1`,
      [tournamentId]
    );
    return res.rows[0] || null;
  }
}
