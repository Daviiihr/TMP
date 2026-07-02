import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RankingService } from '@/services/ranking.service';
import { RankingRepository } from '@/repositories/ranking.repository';
import { Pool } from 'pg';

vi.mock('pg', () => {
  const Pool = vi.fn();
  Pool.prototype.query = vi.fn();
  return { Pool };
});

describe('RankingService', () => {
  let rankingService: RankingService;
  let mockRankingRepo: vi.Mocked<RankingRepository>;
  let mockPool: vi.Mocked<Pool>;

  beforeEach(() => {
    mockRankingRepo = {
      upsert: vi.fn(),
      recalculateCountryPositions: vi.fn(),
      getRankingsByCountry: vi.fn(),
      getUserRanking: vi.fn(),
    } as unknown as vi.Mocked<RankingRepository>;

    mockPool = new Pool() as vi.Mocked<Pool>;
    rankingService = new RankingService(mockRankingRepo, mockPool);
  });

  describe('recalculateUserStats', () => {
    it('should calculate points and call upsert', async () => {
      mockPool.query.mockImplementation((queryStr: string) => {
        if (queryStr.includes('SELECT country')) return { rows: [{ country: 'CL' }] };
        if (queryStr.includes('SELECT mr.id')) return { rows: [{ id: 'm1' }] };
        if (queryStr.includes('indQuery') || queryStr.includes('m.winner_id = $1')) return { rows: [{ wins: '5', losses: '2' }] };
        if (queryStr.includes('teamQuery') || queryStr.includes('m.winner_id = tm.team_id')) return { rows: [{ wins: '2', losses: '1' }] };
        return { rows: [] };
      });

      const result = await rankingService.recalculateUserStats('u1');
      
      // wins: 5+2=7, losses: 2+1=3
      // points: 7*3 + 3*1 = 21 + 3 = 24
      expect(result).toEqual({ points: 24, wins: 7, losses: 3 });
      expect(mockRankingRepo.upsert).toHaveBeenCalledWith('u1', 'CL', 24, 7, 3, 'm1');
      expect(mockRankingRepo.recalculateCountryPositions).toHaveBeenCalled();
    });

    it('should handle zero results safely', async () => {
      mockPool.query.mockImplementation(() => {
        return { rows: [] };
      });

      const result = await rankingService.recalculateUserStats('u1', true);
      
      expect(result).toEqual({ points: 0, wins: 0, losses: 0 });
      expect(mockRankingRepo.upsert).toHaveBeenCalledWith('u1', 'Chile', 0, 0, 0, null);
      expect(mockRankingRepo.recalculateCountryPositions).not.toHaveBeenCalled();
    });
  });

  describe('recalculateAllRankings', () => {
    it('should iterate over all users', async () => {
      mockPool.query.mockImplementation((queryStr: string) => {
        if (queryStr.includes('SELECT id FROM users')) return { rows: [{ id: 'u1' }, { id: 'u2' }] };
        if (queryStr.includes('SELECT country')) return { rows: [{ country: 'CL' }] };
        if (queryStr.includes('SELECT mr.id')) return { rows: [] };
        if (queryStr.includes('m.winner_id')) return { rows: [{ wins: '1', losses: '0' }] };
        return { rows: [] };
      });

      await rankingService.recalculateAllRankings();

      expect(mockRankingRepo.upsert).toHaveBeenCalledTimes(2);
      expect(mockRankingRepo.recalculateCountryPositions).toHaveBeenCalledTimes(1);
    });
  });
});
