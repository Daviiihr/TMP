import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TournamentService } from '@/services/tournament.service';
import { TournamentRepository } from '@/repositories/tournament.repository';
import { AppEventEmitter } from '@/observers/event-emitter';
import { Pool } from 'pg';

vi.mock('pg', () => {
  const Pool = vi.fn();
  Pool.prototype.query = vi.fn();
  return { Pool };
});

describe('TournamentService', () => {
  let tournamentService: TournamentService;
  let mockRepo: vi.Mocked<TournamentRepository>;
  let mockPool: vi.Mocked<Pool>;
  let mockEmitter: vi.Mocked<AppEventEmitter>;

  beforeEach(() => {
    mockRepo = {
      existsByName: vi.fn(),
      create: vi.fn(),
      getById: vi.fn(),
    } as unknown as vi.Mocked<TournamentRepository>;

    mockPool = new Pool() as vi.Mocked<Pool>;

    mockEmitter = {
      emit: vi.fn(),
    } as unknown as vi.Mocked<AppEventEmitter>;

    tournamentService = new TournamentService(mockRepo, mockPool, mockEmitter);
  });

  describe('createTournament', () => {
    const validInput = {
      name: 'Super Cup',
      game: 'Fifa',
      regions: ['NA'],
      type: 'INDIVIDUAL',
      eliminationMode: 'SINGLE_ELIMINATION',
      maxPlayers: 16,
      startDate: '2027-01-01',
      endDate: '2027-01-02',
      registrationClosesAt: '2026-12-31',
      organizerId: 'org-1',
    };

    it('should throw if name already exists', async () => {
      mockRepo.existsByName.mockResolvedValue(true);
      
      await expect(tournamentService.createTournament(validInput))
        .rejects.toThrow('Ya existe un torneo con ese nombre.');
    });

    it('should create tournament successfully', async () => {
      mockRepo.existsByName.mockResolvedValue(false);
      mockRepo.create.mockResolvedValue('new-tournament-id');
      
      const result = await tournamentService.createTournament(validInput);
      
      expect(result).toBe('new-tournament-id');
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Super Cup',
      }));
    });

    it('should throw if validation fails', async () => {
      const invalidInput = { ...validInput, maxPlayers: 2 }; // Min is 4
      
      await expect(tournamentService.createTournament(invalidInput))
        .rejects.toThrow('El torneo debe permitir al menos');
    });
  });

  describe('changeStatus', () => {
    const mockTournament = {
      id: 'tourn-1',
      name: 'Super Cup',
      status: 'DRAFT',
      organizer_id: 'org-1',
    };

    it('should throw on invalid status', async () => {
      await expect(tournamentService.changeStatus('tourn-1', 'INVALID', 'org-1'))
        .rejects.toThrow('Status inválido');
    });

    it('should throw if tournament not found', async () => {
      mockRepo.getById.mockResolvedValue(null);
      
      await expect(tournamentService.changeStatus('tourn-1', 'IN_PROGRESS', 'org-1'))
        .rejects.toThrow('Torneo no encontrado');
    });

    it('should throw if user is not organizer or system', async () => {
      mockRepo.getById.mockResolvedValue(mockTournament as any);
      
      await expect(tournamentService.changeStatus('tourn-1', 'IN_PROGRESS', 'hacker'))
        .rejects.toThrow('No tienes permiso para modificar este torneo.');
    });

    it('should return immediately if status is the same', async () => {
      mockRepo.getById.mockResolvedValue({ ...mockTournament, status: 'IN_PROGRESS' } as any);
      
      const result = await tournamentService.changeStatus('tourn-1', 'IN_PROGRESS', 'org-1');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('ya está en estado');
    });

    it('should prevent setting REGISTRATION if another is active', async () => {
      mockRepo.getById.mockResolvedValue(mockTournament as any);
      mockPool.query.mockResolvedValue({ rows: [{ name: 'Another Active' }] } as any);
      
      await expect(tournamentService.changeStatus('tourn-1', 'REGISTRATION', 'org-1'))
        .rejects.toThrow('Ya tienes un torneo activo');
    });

    it('should successfully update status and emit event', async () => {
      mockRepo.getById.mockResolvedValue(mockTournament as any);
      mockPool.query.mockResolvedValue({ rows: [] } as any);
      
      const result = await tournamentService.changeStatus('tourn-1', 'IN_PROGRESS', 'org-1');
      
      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE tournaments SET status = $1 WHERE id = $2",
        ["IN_PROGRESS", "tourn-1"]
      );
      
      expect(mockEmitter.emit).toHaveBeenCalledWith("tournament:statusChanged", {
        tournamentId: 'tourn-1',
        oldStatus: 'DRAFT',
        newStatus: 'IN_PROGRESS',
        userId: 'org-1'
      });
      
      expect(result.success).toBe(true);
    });

    it('should allow SYSTEM user to update status', async () => {
      mockRepo.getById.mockResolvedValue(mockTournament as any);
      mockPool.query.mockResolvedValue({ rows: [] } as any);
      
      const result = await tournamentService.changeStatus('tourn-1', 'COMPLETED', 'SYSTEM');
      
      expect(result.success).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        "UPDATE tournaments SET status = $1 WHERE id = $2",
        ["COMPLETED", "tourn-1"]
      );
    });
  });
});
