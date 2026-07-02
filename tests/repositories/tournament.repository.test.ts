import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TournamentRepository } from '@/repositories/tournament.repository';
import { Pool } from 'pg';

vi.mock('pg', () => {
  const Pool = vi.fn();
  Pool.prototype.query = vi.fn();
  return { Pool };
});

describe('TournamentRepository', () => {
  let tournamentRepo: TournamentRepository;
  let mockPool: vi.Mocked<Pool>;

  beforeEach(() => {
    mockPool = new Pool() as vi.Mocked<Pool>;
    tournamentRepo = new TournamentRepository(mockPool);
  });

  describe('create', () => {
    it('should insert and return tournament', async () => {
      const mockResult = { id: '1', name: 'T1' };
      mockPool.query.mockResolvedValueOnce({ rows: [mockResult] } as any);

      const input: any = {
        name: 'T1', game: 'FIFA', regions: ['NA'], maxPlayers: 16,
        type: 'INDIVIDUAL', eliminationMode: 'SINGLE', playersPerTeam: null,
        startDate: 'date1', endDate: 'date2', registrationClosesAt: 'date3', organizerId: 'org1'
      };

      const result = await tournamentRepo.create(input);
      expect(result).toEqual(mockResult);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tournaments'),
        ['T1', 'FIFA', ['NA'], 16, 'INDIVIDUAL', 'SINGLE', null, 'date1', 'date2', 'date3', 'org1']
      );
    });
  });

  describe('existsByName', () => {
    it('should return true if name exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any);
      expect(await tournamentRepo.existsByName('T1')).toBe(true);
    });

    it('should return false if name does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);
      expect(await tournamentRepo.existsByName('T1')).toBe(false);
    });
  });

  describe('getById', () => {
    it('should return tournament when found', async () => {
      const mockResult = { id: '1', name: 'T1' };
      mockPool.query.mockResolvedValueOnce({ rows: [mockResult] } as any);
      
      const result = await tournamentRepo.getById('1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getEnrollmentCount', () => {
    it('should throw if tournament not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any); // getById
      await expect(tournamentRepo.getEnrollmentCount('1')).rejects.toThrow('Torneo no encontrado');
    });

    it('should count individual enrollments', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ type: 'INDIVIDUAL' }] } as any); // getById
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: '10' }] } as any); // count
      
      const result = await tournamentRepo.getEnrollmentCount('1');
      expect(result).toBe(10);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM individual_enrollments'),
        ['1']
      );
    });

    it('should count team enrollments', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ type: 'TEAM' }] } as any); // getById
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: '5' }] } as any); // count
      
      const result = await tournamentRepo.getEnrollmentCount('1');
      expect(result).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM teams'),
        ['1']
      );
    });
  });

  describe('getEnrolledPlayers & Teams', () => {
    it('should get enrolled players', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'u1' }] } as any);
      const result = await tournamentRepo.getEnrolledPlayers('t1');
      expect(result).toEqual([{ id: 'u1' }]);
    });

    it('should get enrolled teams', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'team1' }] } as any);
      const result = await tournamentRepo.getEnrolledTeams('t1');
      expect(result).toEqual([{ id: 'team1' }]);
    });
  });

  describe('findActive & findByOrganizer', () => {
    it('should return active tournaments', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 't1' }] } as any);
      const result = await tournamentRepo.findActive(5);
      expect(result).toEqual([{ id: 't1' }]);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT $1'), [5]);
    });

    it('should return tournaments by organizer', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 't1' }] } as any);
      const result = await tournamentRepo.findByOrganizer('org1');
      expect(result).toEqual([{ id: 't1' }]);
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      await tournamentRepo.updateStatus('t1', 'COMPLETED');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tournaments SET status'),
        ['COMPLETED', 't1']
      );
    });
  });

  describe('getUserParticipationHistory', () => {
    it('should return user history', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 't1' }] } as any);
      const result = await tournamentRepo.getUserParticipationHistory('u1');
      expect(result).toEqual([{ id: 't1' }]);
    });
  });
});
