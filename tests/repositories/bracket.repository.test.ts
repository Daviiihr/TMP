import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BracketRepository } from '@/repositories/bracket.repository';
import { Pool } from 'pg';

vi.mock('pg', () => {
  const Pool = vi.fn();
  Pool.prototype.query = vi.fn();
  Pool.prototype.connect = vi.fn();
  return { Pool };
});

describe('BracketRepository', () => {
  let bracketRepo: BracketRepository;
  let mockPool: vi.Mocked<Pool>;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    mockPool = new Pool() as vi.Mocked<Pool>;
    mockPool.connect = vi.fn().mockResolvedValue(mockClient);
    mockPool.query = vi.fn();
    
    bracketRepo = new BracketRepository(mockPool);
  });

  describe('saveBracket', () => {
    it('should save bracket with transaction and return id', async () => {
      mockClient.query.mockImplementation((queryStr: string) => {
        if (queryStr.includes('gen_random_uuid')) return { rows: [{ uuid: 'generated-uuid' }] };
        if (queryStr.includes('INSERT INTO brackets')) return { rows: [{ id: 'bracket-id' }] };
        return { rows: [] };
      });

      const bracketData = {
        rounds: [{
          roundNumber: 1, label: 'R1', matches: [
            { id: 'm1', round: 1, matchNumber: 1, roundLabel: 'R1', player1: null, player2: null, isBye: false, nextMatchId: 'm2' }
          ]
        }],
        bracketSize: 2,
        totalParticipants: 2,
        totalRounds: 1
      };

      const result = await bracketRepo.saveBracket('t1', 'user1', bracketData);
      
      expect(result).toBe('bracket-id');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      mockClient.query.mockRejectedValue(new Error('DB Error'));

      await expect(bracketRepo.saveBracket('t1', 'user1', { rounds: [] } as any))
        .rejects.toThrow('DB Error');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getActiveBracket', () => {
    it('should return active bracket', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'b1' }] } as any);
      const res = await bracketRepo.getActiveBracket('t1');
      expect(res).toEqual({ id: 'b1' });
    });
  });

  describe('getLiveBracket', () => {
    it('should return null if no active bracket', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);
      expect(await bracketRepo.getLiveBracket('t1')).toBeNull();
    });

    it('should merge bracket data with live matches', async () => {
      const dbBracket = {
        id: 'b1',
        elimination_mode: 'SINGLE_ELIMINATION',
        bracket_data: {
          rounds: [{ matches: [{ id: 'm1', player1: null, player2: null }] }]
        }
      };
      const dbMatches = [
        { id: 'm1', participant1_id: 'p1', participant1_name: 'P1', status: 'FINISHED', winner_id: 'p1' }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [dbBracket] } as any) // getActiveBracket
        .mockResolvedValueOnce({ rows: dbMatches } as any); // matches

      const result = await bracketRepo.getLiveBracket('t1');
      
      expect(result?.eliminationMode).toBe('SINGLE_ELIMINATION');
      const match = result?.bracketData.rounds[0].matches[0];
      expect(match?.player1).toEqual({ id: 'p1', name: 'P1' });
      expect((match as any).status).toBe('FINISHED');
      expect((match as any).winnerId).toBe('p1');
    });
  });

  describe('updateMatchWinner', () => {
    it('should update match winner and move players', async () => {
      const matchInfo = {
        participant1_id: 'p1',
        participant1_name: 'P1',
        participant2_id: 'p2',
        next_match_id: 'm2',
        next_match_slot: 1
      };
      
      mockClient.query.mockImplementation((queryStr: string) => {
        if (queryStr.includes('SELECT participant1_id')) return { rows: [matchInfo] };
        return { rows: [] };
      });

      await bracketRepo.updateMatchWinner('t1', 'm1', 'p1');

      // Check FINISHED update
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE matches SET status = 'FINISHED'"),
        ['p1', null, null, 'm1']
      );

      // Check move winner
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE matches SET participant1_id"),
        ['p1', 'P1', 'm2']
      );
      
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should rollback if match not found', async () => {
      mockClient.query.mockImplementation((queryStr: string) => {
        if (queryStr.includes('SELECT participant1_id')) return { rows: [] };
      });

      await expect(bracketRepo.updateMatchWinner('t1', 'm1', 'p1'))
        .rejects.toThrow('Match no encontrado');
        
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('undoMatchWinner', () => {
    it('should undo match and clear next slots', async () => {
      const matchInfo = {
        winner_id: 'p1',
        next_match_id: 'm2',
        next_match_slot: 1
      };

      mockClient.query.mockImplementation((queryStr: string) => {
        if (queryStr.includes('SELECT winner_id')) return { rows: [matchInfo] };
        return { rows: [] };
      });

      await bracketRepo.undoMatchWinner('t1', 'm1');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE matches SET status = 'PENDING'"),
        ['m1']
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE matches SET participant1_id = NULL"),
        ['m2']
      );
      
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });
});
