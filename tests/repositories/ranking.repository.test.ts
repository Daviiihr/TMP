import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RankingRepository } from '@/repositories/ranking.repository';
import { Pool } from 'pg';

vi.mock('pg', () => {
  const Pool = vi.fn();
  Pool.prototype.query = vi.fn();
  return { Pool };
});

describe('RankingRepository', () => {
  let rankingRepo: RankingRepository;
  let mockPool: vi.Mocked<Pool>;

  beforeEach(() => {
    mockPool = new Pool() as vi.Mocked<Pool>;
    rankingRepo = new RankingRepository(mockPool);
  });

  describe('upsert', () => {
    it('should upsert ranking', async () => {
      await rankingRepo.upsert('u1', 'CL', 100, 10, 2, 'm1');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO country_rankings'),
        ['u1', 'CL', 100, 10, 2, 'm1']
      );
    });
  });

  describe('recalculateCountryPositions', () => {
    it('should execute update query', async () => {
      await rankingRepo.recalculateCountryPositions();
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE country_rankings cr')
      );
    });
  });

  describe('getRankingsByCountry', () => {
    it('should parse numbers and return ranking rows', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ position: '1', username: 'gabox', country: 'CL', points: '100', wins: '10', losses: '2' }]
      } as any);

      const res = await rankingRepo.getRankingsByCountry('CL');
      expect(res).toEqual([{ position: 1, username: 'gabox', country: 'CL', points: 100, wins: 10, losses: 2 }]);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE ($1::varchar IS NULL OR u.country = $1)'), ['CL']);
    });
  });

  describe('getUserRanking', () => {
    it('should return null if user not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);
      const res = await rankingRepo.getUserRanking('u1');
      expect(res).toBeNull();
    });

    it('should return parsed user ranking', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ position: '2', points: 150, wins: 15, losses: 5, country: 'CL' }]
      } as any);
      const res = await rankingRepo.getUserRanking('u1');
      expect(res).toEqual({ position: 2, points: 150, wins: 15, losses: 5, country: 'CL' });
    });
  });
});
