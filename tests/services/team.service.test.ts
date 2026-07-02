import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamService } from '@/services/team.service';
import { TeamRepository } from '@/repositories/team.repository';
import { UserRepository } from '@/repositories/user.repository';
import { AppEventEmitter } from '@/observers/event-emitter';

describe('TeamService', () => {
  let teamService: TeamService;
  let mockTeamRepo: vi.Mocked<TeamRepository>;
  let mockUserRepo: vi.Mocked<UserRepository>;
  let mockEmitter: vi.Mocked<AppEventEmitter>;

  beforeEach(() => {
    mockTeamRepo = {
      create: vi.fn(),
      addMember: vi.fn(),
      findByCaptain: vi.fn(),
      findById: vi.fn(),
      searchTeams: vi.fn(),
      isUserInTeam: vi.fn(),
      getMemberCount: vi.fn(),
    } as unknown as vi.Mocked<TeamRepository>;

    mockUserRepo = {
      findById: vi.fn(),
      updateRole: vi.fn(),
    } as unknown as vi.Mocked<UserRepository>;

    mockEmitter = {
      emit: vi.fn(),
    } as unknown as vi.Mocked<AppEventEmitter>;

    teamService = new TeamService(mockTeamRepo, mockUserRepo, mockEmitter);
  });

  describe('createTeam', () => {
    it('should throw if size < 1', async () => {
      await expect(teamService.createTeam('Fnatic', 'c1', 0))
        .rejects.toThrow('El tamaño del equipo debe ser al menos 1');
    });

    it('should create team, add captain, update role, and emit event', async () => {
      const mockTeam = { id: 't1', name: 'Fnatic', captain_id: 'c1', size: 5, created_at: new Date(), tournament_id: null };
      mockTeamRepo.create.mockResolvedValueOnce(mockTeam);
      mockUserRepo.findById.mockResolvedValueOnce({ id: 'c1', role: 'PLAYER' } as any);

      const result = await teamService.createTeam('Fnatic', 'c1', 5);

      expect(result).toEqual(mockTeam);
      expect(mockTeamRepo.addMember).toHaveBeenCalledWith('t1', 'c1');
      expect(mockUserRepo.updateRole).toHaveBeenCalledWith('c1', 'CAPTAIN');
      expect(mockEmitter.emit).toHaveBeenCalledWith('team:created', { teamId: 't1', captainId: 'c1', name: 'Fnatic' });
    });

    it('should not update role if not PLAYER', async () => {
      const mockTeam = { id: 't1', name: 'Fnatic', captain_id: 'c1', size: 5, created_at: new Date(), tournament_id: null };
      mockTeamRepo.create.mockResolvedValueOnce(mockTeam);
      mockUserRepo.findById.mockResolvedValueOnce({ id: 'c1', role: 'ADMIN' } as any);

      await teamService.createTeam('Fnatic', 'c1', 5);

      expect(mockUserRepo.updateRole).not.toHaveBeenCalled();
    });
  });

  describe('getMyTeams', () => {
    it('should call findByCaptain', async () => {
      mockTeamRepo.findByCaptain.mockResolvedValueOnce([] as any);
      const res = await teamService.getMyTeams('c1');
      expect(res).toEqual([]);
      expect(mockTeamRepo.findByCaptain).toHaveBeenCalledWith('c1');
    });
  });

  describe('getTeam', () => {
    it('should call findById', async () => {
      mockTeamRepo.findById.mockResolvedValueOnce(null);
      const res = await teamService.getTeam('1');
      expect(res).toBeNull();
      expect(mockTeamRepo.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('searchTeams', () => {
    it('should call searchTeams', async () => {
      mockTeamRepo.searchTeams.mockResolvedValueOnce([]);
      const res = await teamService.searchTeams('FNC');
      expect(res).toEqual([]);
      expect(mockTeamRepo.searchTeams).toHaveBeenCalledWith('FNC');
    });
  });

  describe('joinTeam', () => {
    it('should throw if team not found', async () => {
      mockTeamRepo.findById.mockResolvedValueOnce(null);
      await expect(teamService.joinTeam('t1', 'u1')).rejects.toThrow('Equipo no encontrado');
    });

    it('should throw if user is already a member', async () => {
      mockTeamRepo.findById.mockResolvedValueOnce({ id: 't1', size: 5 } as any);
      mockTeamRepo.isUserInTeam.mockResolvedValueOnce(true);
      
      await expect(teamService.joinTeam('t1', 'u1')).rejects.toThrow('Ya eres miembro');
    });

    it('should throw if team is full', async () => {
      mockTeamRepo.findById.mockResolvedValueOnce({ id: 't1', size: 5 } as any);
      mockTeamRepo.isUserInTeam.mockResolvedValueOnce(false);
      mockTeamRepo.getMemberCount.mockResolvedValueOnce(5);
      
      await expect(teamService.joinTeam('t1', 'u1')).rejects.toThrow('El equipo ya está lleno');
    });

    it('should join successfully', async () => {
      mockTeamRepo.findById.mockResolvedValueOnce({ id: 't1', size: 5 } as any);
      mockTeamRepo.isUserInTeam.mockResolvedValueOnce(false);
      mockTeamRepo.getMemberCount.mockResolvedValueOnce(4);
      
      const res = await teamService.joinTeam('t1', 'u1');
      expect(res.success).toBe(true);
      expect(mockTeamRepo.addMember).toHaveBeenCalledWith('t1', 'u1');
    });
  });
});
