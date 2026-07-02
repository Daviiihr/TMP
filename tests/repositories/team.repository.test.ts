import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamRepository } from '@/repositories/team.repository';
import { Pool } from 'pg';

vi.mock('pg', () => {
  const Pool = vi.fn();
  Pool.prototype.query = vi.fn();
  return { Pool };
});

describe('TeamRepository', () => {
  let teamRepo: TeamRepository;
  let mockPool: vi.Mocked<Pool>;

  beforeEach(() => {
    mockPool = new Pool() as vi.Mocked<Pool>;
    teamRepo = new TeamRepository(mockPool);
  });

  describe('create', () => {
    it('should insert a team and return it', async () => {
      const mockTeam = { id: '1', name: 'Fnatic', captain_id: 'c1', size: 5, tournament_id: null, created_at: new Date() };
      mockPool.query.mockResolvedValueOnce({ rows: [mockTeam] } as any);

      const result = await teamRepo.create({ name: 'Fnatic', captain_id: 'c1', size: 5 });
      
      expect(result).toEqual(mockTeam);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO teams'),
        ['Fnatic', 'c1', 5]
      );
    });
  });

  describe('findById', () => {
    it('should return team when found', async () => {
      const mockTeam = { id: '1', name: 'Fnatic' };
      mockPool.query.mockResolvedValueOnce({ rows: [mockTeam] } as any);
      
      const result = await teamRepo.findById('1');
      expect(result).toEqual(mockTeam);
    });

    it('should return null when not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);
      const result = await teamRepo.findById('99');
      expect(result).toBeNull();
    });
  });

  describe('findByCaptain', () => {
    it('should return teams for captain', async () => {
      const mockTeams = [{ id: '1', name: 'T1', member_count: 5 }];
      mockPool.query.mockResolvedValueOnce({ rows: mockTeams } as any);

      const result = await teamRepo.findByCaptain('c1');
      expect(result).toEqual(mockTeams);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE t.captain_id = $1'),
        ['c1']
      );
    });
  });

  describe('findByMember', () => {
    it('should return teams for member', async () => {
      const mockTeams = [{ id: '1', name: 'G2', member_count: 4 }];
      mockPool.query.mockResolvedValueOnce({ rows: mockTeams } as any);

      const result = await teamRepo.findByMember('m1');
      expect(result).toEqual(mockTeams);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_members.user_id = $1'),
        ['m1']
      );
    });
  });

  describe('assignToTournament', () => {
    it('should update tournament id', async () => {
      await teamRepo.assignToTournament('team-1', 'tourn-1');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE teams SET tournament_id = $2'),
        ['team-1', 'tourn-1']
      );
    });
  });

  describe('searchTeams', () => {
    it('should return matched teams', async () => {
      const mockTeams = [{ id: '1', name: 'NaVi', member_count: 5 }];
      mockPool.query.mockResolvedValueOnce({ rows: mockTeams } as any);

      const result = await teamRepo.searchTeams('navi');
      expect(result).toEqual(mockTeams);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE t.name ILIKE $1'),
        ['%navi%']
      );
    });
  });

  describe('addMember', () => {
    it('should insert into team_members', async () => {
      await teamRepo.addMember('team-1', 'user-1');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO team_members'),
        ['team-1', 'user-1']
      );
    });
  });

  describe('getMemberCount', () => {
    it('should return parsed count', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: '4' }] } as any);
      const count = await teamRepo.getMemberCount('team-1');
      expect(count).toBe(4);
    });
  });

  describe('isUserInTeam', () => {
    it('should return true if user is in team', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as any);
      const isMember = await teamRepo.isUserInTeam('team-1', 'user-1');
      expect(isMember).toBe(true);
    });

    it('should return false if user is not in team', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);
      const isMember = await teamRepo.isUserInTeam('team-1', 'user-1');
      expect(isMember).toBe(false);
    });
  });
});
