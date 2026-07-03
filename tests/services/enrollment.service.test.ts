import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnrollmentService } from "@/services/enrollment.service";
import { TeamRepository } from "@/repositories/team.repository";
import { TournamentRepository } from "@/repositories/tournament.repository";
import { AppEventEmitter } from "@/observers/event-emitter";
import { Pool } from "pg";

vi.mock("pg", () => {
  const Pool = vi.fn();
  Pool.prototype.query = vi.fn();
  return { Pool };
});

describe("EnrollmentService", () => {
  let enrollmentService: EnrollmentService;
  let mockTeamRepo: vi.Mocked<TeamRepository>;
  let mockTournamentRepo: vi.Mocked<TournamentRepository>;
  let mockPool: vi.Mocked<Pool>;
  let mockEmitter: vi.Mocked<AppEventEmitter>;

  beforeEach(() => {
    mockTeamRepo = {
      findById: vi.fn(),
      getMemberCount: vi.fn(),
      assignToTournament: vi.fn(),
    } as unknown as vi.Mocked<TeamRepository>;

    mockTournamentRepo = {
      getById: vi.fn(),
      getEnrollmentCount: vi.fn(),
    } as unknown as vi.Mocked<TournamentRepository>;

    mockPool = new Pool() as vi.Mocked<Pool>;

    mockEmitter = {
      emit: vi.fn(),
    } as unknown as vi.Mocked<AppEventEmitter>;

    enrollmentService = new EnrollmentService(
      mockTeamRepo,
      mockTournamentRepo,
      mockPool,
      mockEmitter,
    );
  });

  describe("enrollPlayerInTournament", () => {
    it("should throw if tournament not found", async () => {
      mockTournamentRepo.getById.mockResolvedValueOnce(null);
      await expect(
        enrollmentService.enrollPlayerInTournament("u1", "t1"),
      ).rejects.toThrow("Torneo no encontrado");
    });

    it("should throw if tournament is not DRAFT or REGISTRATION", async () => {
      mockTournamentRepo.getById.mockResolvedValueOnce({
        status: "IN_PROGRESS",
      } as any);
      await expect(
        enrollmentService.enrollPlayerInTournament("u1", "t1"),
      ).rejects.toThrow("cerrado");
    });

    it("should throw if tournament is not INDIVIDUAL", async () => {
      mockTournamentRepo.getById.mockResolvedValueOnce({
        status: "REGISTRATION",
        type: "TEAM",
      } as any);
      await expect(
        enrollmentService.enrollPlayerInTournament("u1", "t1"),
      ).rejects.toThrow("solo para equipos");
    });

    it("should throw if player is already enrolled", async () => {
      mockTournamentRepo.getById.mockResolvedValueOnce({
        status: "REGISTRATION",
        type: "INDIVIDUAL",
      } as any);
      mockPool.query.mockResolvedValueOnce({
        rows: [{ "?column?": 1 }],
      } as any); // isEnrolled = true

      await expect(
        enrollmentService.enrollPlayerInTournament("u1", "t1"),
      ).rejects.toThrow("Ya te encuentras inscrito");
    });

    it("should throw if tournament is full", async () => {
      mockTournamentRepo.getById.mockResolvedValueOnce({
        status: "REGISTRATION",
        type: "INDIVIDUAL",
        max_players: 8,
      } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any); // isEnrolled = false
      mockTournamentRepo.getEnrollmentCount.mockResolvedValueOnce(8);

      await expect(
        enrollmentService.enrollPlayerInTournament("u1", "t1"),
      ).rejects.toThrow("máximo de jugadores");
    });

    it("should enroll player successfully", async () => {
      mockTournamentRepo.getById.mockResolvedValueOnce({
        status: "REGISTRATION",
        type: "INDIVIDUAL",
        max_players: 8,
      } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any); // isEnrolled = false
      mockTournamentRepo.getEnrollmentCount.mockResolvedValueOnce(7);

      const res = await enrollmentService.enrollPlayerInTournament("u1", "t1");

      expect(res.success).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO individual_enrollments"),
        ["u1", "t1"],
      );
      expect(mockEmitter.emit).toHaveBeenCalledWith("enrollment:playerJoined", {
        userId: "u1",
        tournamentId: "t1",
      });
    });
  });

  describe("enrollTeamInTournament", () => {
    it("should throw if team not found", async () => {
      mockTeamRepo.findById.mockResolvedValueOnce(null);
      mockTournamentRepo.getById.mockResolvedValueOnce({} as any);

      await expect(
        enrollmentService.enrollTeamInTournament("team1", "tourn1"),
      ).rejects.toThrow("Equipo no encontrado");
    });

    it("should throw if tournament not TEAM", async () => {
      mockTeamRepo.findById.mockResolvedValueOnce({ id: "team1" } as any);
      mockTournamentRepo.getById.mockResolvedValueOnce({
        status: "REGISTRATION",
        type: "INDIVIDUAL",
      } as any);

      await expect(
        enrollmentService.enrollTeamInTournament("team1", "tourn1"),
      ).rejects.toThrow("solo para jugadores individuales");
    });

    it("should throw if team already in a tournament", async () => {
      mockTeamRepo.findById.mockResolvedValueOnce({
        id: "team1",
        tournament_id: "other-tourn",
      } as any);
      mockTournamentRepo.getById.mockResolvedValueOnce({
        status: "REGISTRATION",
        type: "TEAM",
      } as any);

      await expect(
        enrollmentService.enrollTeamInTournament("team1", "tourn1"),
      ).rejects.toThrow("participando en otro torneo");
    });

    it("should throw if team sizes mismatch", async () => {
      mockTeamRepo.findById.mockResolvedValueOnce({
        id: "team1",
        size: 5,
      } as any);
      mockTournamentRepo.getById.mockResolvedValueOnce({
        status: "REGISTRATION",
        type: "TEAM",
        min_players_per_team: 4,
        max_players: 8,
      } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);
      mockTournamentRepo.getEnrollmentCount.mockResolvedValueOnce(0);

      await expect(
        enrollmentService.enrollTeamInTournament("team1", "tourn1"),
      ).rejects.toThrow("requiere equipos diseñados para 4 jugadores");
    });

    it("should throw if team is incomplete", async () => {
      mockTeamRepo.findById.mockResolvedValueOnce({
        id: "team1",
        size: 5,
      } as any);
      mockTournamentRepo.getById.mockResolvedValueOnce({
        status: "REGISTRATION",
        type: "TEAM",
        min_players_per_team: 5,
        max_players: 8,
      } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);
      mockTournamentRepo.getEnrollmentCount.mockResolvedValueOnce(0);
      mockTeamRepo.getMemberCount.mockResolvedValueOnce(4); // Only 4 members!

      await expect(
        enrollmentService.enrollTeamInTournament("team1", "tourn1"),
      ).rejects.toThrow("El equipo está incompleto");
    });

    it("should enroll team successfully", async () => {
      mockTeamRepo.findById.mockResolvedValueOnce({
        id: "team1",
        size: 5,
      } as any);
      mockTournamentRepo.getById.mockResolvedValueOnce({
        status: "REGISTRATION",
        type: "TEAM",
        min_players_per_team: 5,
        max_players: 8,
      } as any);
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);
      mockTournamentRepo.getEnrollmentCount.mockResolvedValueOnce(0);
      mockTeamRepo.getMemberCount.mockResolvedValueOnce(5);

      const res = await enrollmentService.enrollTeamInTournament(
        "team1",
        "tourn1",
      );

      expect(res.success).toBe(true);
      expect(mockTeamRepo.assignToTournament).toHaveBeenCalledWith(
        "team1",
        "tourn1",
      );
      expect(mockEmitter.emit).toHaveBeenCalledWith("enrollment:teamJoined", {
        teamId: "team1",
        tournamentId: "tourn1",
      });
    });
  });
});
