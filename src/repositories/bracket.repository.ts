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
      
      // 1. Generate UUIDs and mutate the bracketData so the JSON stores the Postgres UUIDs
      const allMatches: Match[] = [];
      bracketData.rounds.forEach(r => allMatches.push(...r.matches));
      if (bracketData.loserRounds) {
        bracketData.loserRounds.forEach(r => allMatches.push(...r.matches));
      }

      const matchIdMap = new Map<string, string>(); // 'w_r1_m1' -> 'postgres_uuid'
      
      for (const m of allMatches) {
        const idRes = await client.query(`SELECT gen_random_uuid() as uuid`);
        matchIdMap.set(m.id, idRes.rows[0].uuid);
      }
      
      // Mutate the original bracketData so the IDs match postgres
      for (const m of allMatches) {
        m.id = matchIdMap.get(m.id)!;
        if (m.nextMatchId) {
          m.nextMatchId = matchIdMap.get(m.nextMatchId)!;
        }
        if (m.loserNextMatchId) {
          m.loserNextMatchId = matchIdMap.get(m.loserNextMatchId)!;
        }
      }

      // 2. Insert into brackets
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

      // 3. Insert each match into matches table (first pass: no forward FKs)
      for (const m of allMatches) {
        const pgId = m.id;
        
        await client.query(
           `INSERT INTO matches
           (id, tournament_id, bracket_id, round_number, match_number, round_label, 
            participant1_id, participant1_name, participant2_id, participant2_name, 
            is_bye, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
            m.isBye,
            m.isBye ? 'FINISHED' : 'PENDING'
          ]
        );
      }
        
      // 4. Update foreign keys and bye advancements (second pass)
      for (const m of allMatches) {
        const pgId = m.id;
        const nextPgId = m.nextMatchId || null;
        const loserNextPgId = m.loserNextMatchId || null;

        if (nextPgId || loserNextPgId) {
          await client.query(
            `UPDATE matches SET next_match_id = $1, next_match_slot = $2, loser_next_match_id = $3, loser_next_match_slot = $4 WHERE id = $5`,
            [nextPgId, m.nextMatchSlot || null, loserNextPgId, m.loserNextMatchSlot || null, pgId]
          );
        }
        
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

  async getLiveBracket(tournamentId: string): Promise<{ bracketData: BracketResult, eliminationMode: string } | null> {
    const bracketRow = await this.getActiveBracket(tournamentId);
    if (!bracketRow) return null;

    const bracketData = bracketRow.bracket_data as BracketResult;
    const bracketId = bracketRow.id;

    // Fetch all live matches
    const matchesRes = await this.pool.query(
      `SELECT id, participant1_id, participant1_name, participant2_id, participant2_name, status, winner_id, score1, score2
       FROM matches WHERE bracket_id = $1`,
      [bracketId]
    );

    const matchMap = new Map(matchesRes.rows.map(m => [m.id, m]));

    // Travese bracket data and update it
    const updateMatch = (m: Match) => {
      const liveData = matchMap.get(m.id);
      if (liveData) {
        if (liveData.participant1_id) m.player1 = { id: liveData.participant1_id, name: liveData.participant1_name };
        else m.player1 = null;

        if (liveData.participant2_id) m.player2 = { id: liveData.participant2_id, name: liveData.participant2_name };
        else m.player2 = null;

        // Extending the Match interface dynamically to include status and winner in the JSON payload
        (m as unknown as Record<string, unknown>).status = liveData.status;
        (m as unknown as Record<string, unknown>).winnerId = liveData.winner_id;
        m.score1 = liveData.score1 !== null ? liveData.score1 : undefined;
        m.score2 = liveData.score2 !== null ? liveData.score2 : undefined;
      }
    };

    bracketData.rounds.forEach(r => r.matches.forEach(updateMatch));
    if (bracketData.loserRounds) {
      bracketData.loserRounds.forEach(r => r.matches.forEach(updateMatch));
    }

    return {
      bracketData,
      eliminationMode: bracketRow.elimination_mode
    };
  }

  async updateMatchWinner(tournamentId: string, matchId: string, winnerId: string, score1?: number, score2?: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get current match info to find who the winner is and what the next match is
      const matchRes = await client.query(
        `SELECT participant1_id, participant1_name, participant2_id, participant2_name, next_match_id, next_match_slot, loser_next_match_id, loser_next_match_slot
         FROM matches WHERE id = $1 AND tournament_id = $2`,
        [matchId, tournamentId]
      );

      if (matchRes.rows.length === 0) {
        throw new Error('Match no encontrado');
      }

      const matchInfo = matchRes.rows[0];
      
      let winnerName = null;
      let loserId = null;
      let loserName = null;

      if (matchInfo.participant1_id === winnerId) {
        winnerName = matchInfo.participant1_name;
        loserId = matchInfo.participant2_id;
        loserName = matchInfo.participant2_name;
      } else if (matchInfo.participant2_id === winnerId) {
        winnerName = matchInfo.participant2_name;
        loserId = matchInfo.participant1_id;
        loserName = matchInfo.participant1_name;
      } else {
        throw new Error('El ganador no pertenece a este partido');
      }

      // 2. Mark match as FINISHED and set winner and scores
      await client.query(
        `UPDATE matches SET status = 'FINISHED', winner_id = $1, score1 = $2, score2 = $3, finished_at = now() WHERE id = $4`,
        [winnerId, score1 ?? null, score2 ?? null, matchId]
      );

      // 3. Move winner to next match if there is one
      if (matchInfo.next_match_id) {
        const participantField = matchInfo.next_match_slot === 1 ? 'participant1_id' : 'participant2_id';
        const nameField = matchInfo.next_match_slot === 1 ? 'participant1_name' : 'participant2_name';
        
        await client.query(
          `UPDATE matches SET ${participantField} = $1, ${nameField} = $2 WHERE id = $3`,
          [winnerId, winnerName, matchInfo.next_match_id]
        );
      }

      // 4. Move loser to loser bracket if applicable
      if (loserId && matchInfo.loser_next_match_id) {
        const loserField = matchInfo.loser_next_match_slot === 1 ? 'participant1_id' : 'participant2_id';
        const loserNameField = matchInfo.loser_next_match_slot === 1 ? 'participant1_name' : 'participant2_name';
        
        await client.query(
          `UPDATE matches SET ${loserField} = $1, ${loserNameField} = $2 WHERE id = $3`,
          [loserId, loserName, matchInfo.loser_next_match_id]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async undoMatchWinner(tournamentId: string, matchId: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const matchRes = await client.query(
        `SELECT winner_id, next_match_id, next_match_slot, loser_next_match_id, loser_next_match_slot
         FROM matches WHERE id = $1 AND tournament_id = $2`,
        [matchId, tournamentId]
      );

      if (matchRes.rows.length === 0) {
        throw new Error('Match no encontrado');
      }

      const matchInfo = matchRes.rows[0];
      if (!matchInfo.winner_id) {
        // Ya está sin resolver
        await client.query('ROLLBACK');
        return true;
      }

      // 1. Resetear el partido actual a PENDING, borrar puntajes y ganador
      await client.query(
        `UPDATE matches SET status = 'PENDING', winner_id = NULL, score1 = NULL, score2 = NULL, finished_at = NULL WHERE id = $1`,
        [matchId]
      );

      // 2. Limpiar la ranura del siguiente partido de ganadores
      if (matchInfo.next_match_id) {
        const participantField = matchInfo.next_match_slot === 1 ? 'participant1_id' : 'participant2_id';
        const nameField = matchInfo.next_match_slot === 1 ? 'participant1_name' : 'participant2_name';
        
        await client.query(
          `UPDATE matches SET ${participantField} = NULL, ${nameField} = NULL WHERE id = $1`,
          [matchInfo.next_match_id]
        );
      }

      // 3. Limpiar la ranura del siguiente partido de perdedores
      if (matchInfo.loser_next_match_id) {
        const loserField = matchInfo.loser_next_match_slot === 1 ? 'participant1_id' : 'participant2_id';
        const loserNameField = matchInfo.loser_next_match_slot === 1 ? 'participant1_name' : 'participant2_name';
        
        await client.query(
          `UPDATE matches SET ${loserField} = NULL, ${loserNameField} = NULL WHERE id = $1`,
          [matchInfo.loser_next_match_id]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
