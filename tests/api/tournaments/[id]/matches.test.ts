import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "@/app/api/tournaments/[id]/matches/[matchId]/route";
import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { BracketRepository } from "@/repositories/bracket.repository";
import { MatchResultRepository } from "@/repositories/matchResult.repository";

const mocks = vi.hoisted(() => ({
  mockEventEmitter: { emit: vi.fn() },
  mockTournamentRepo: { getById: vi.fn(), updateStatus: vi.fn() },
  mockUpdateMatchWinner: vi.fn(),
  mockGetLiveBracket: vi.fn(),
  mockReportResult: vi.fn(),
  mockUpdateStatus: vi.fn(),
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    getEventEmitter: vi.fn(() => mocks.mockEventEmitter),
    createTournamentRepository: vi.fn(() => mocks.mockTournamentRepo),
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/repositories/bracket.repository", () => ({
  BracketRepository: class {
    updateMatchWinner = mocks.mockUpdateMatchWinner;
    getLiveBracket = mocks.mockGetLiveBracket;
  },
}));

vi.mock("@/repositories/matchResult.repository", () => ({
  MatchResultRepository: class {
    reportResult = mocks.mockReportResult;
    updateStatus = mocks.mockUpdateStatus;
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

describe("PUT /api/tournaments/[id]/matches/[matchId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUpdateMatchWinner.mockReset();
    mocks.mockGetLiveBracket.mockReset();
    mocks.mockReportResult.mockReset();
    mocks.mockUpdateStatus.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const createRequest = (body: any) => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  it("should return 401 if not authorized", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = createRequest({});

    const res = (await PUT(req, {
      params: Promise.resolve({ id: "1", matchId: "m1" }),
    })) as any;

    expect(res.body).toEqual({ error: "No autorizado" });
    expect(res.init).toEqual({ status: 401 });
  });

  it("should return 400 if winnerId missing", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    const req = createRequest({});

    const res = (await PUT(req, {
      params: Promise.resolve({ id: "1", matchId: "m1" }),
    })) as any;

    expect(res.body).toEqual({ error: "Faltan datos del ganador" });
    expect(res.init).toEqual({ status: 400 });
  });

  it("should set pending validation for normal player", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "player-1",
      role: "PLAYER",
    } as any);

    const req = createRequest({ winnerId: "p1", score1: 2, score2: 0 });
    const res = (await PUT(req, {
      params: Promise.resolve({ id: "1", matchId: "m1" }),
    })) as any;

    expect(mocks.mockReportResult).toHaveBeenCalledWith("m1", 2, 0);
    expect(mocks.mockUpdateMatchWinner).not.toHaveBeenCalled();
    expect(res.body).toEqual({ success: true, pendingValidation: true });
  });

  it("should approve directly for ADMIN", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
    } as any);
    mocks.mockReportResult.mockResolvedValue({ id: "result-1" });

    const req = createRequest({ winnerId: "p1", score1: 2, score2: 0 });
    const res = (await PUT(req, {
      params: Promise.resolve({ id: "t1", matchId: "m1" }),
    })) as any;

    expect(mocks.mockUpdateMatchWinner).toHaveBeenCalledWith(
      "t1",
      "m1",
      "p1",
      2,
      0,
    );
    expect(mocks.mockEventEmitter.emit).toHaveBeenCalledWith(
      "match:resultApproved",
      { matchId: "m1", tournamentId: "t1" },
    );
    expect(mocks.mockReportResult).toHaveBeenCalledWith("m1", 2, 0);
    expect(mocks.mockUpdateStatus).toHaveBeenCalledWith("result-1", "APPROVED");
    expect(res.body).toEqual({ success: true });
  });

  it("should mark tournament as COMPLETED if final match is finished", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
    } as any);
    mocks.mockReportResult.mockResolvedValue({ id: "result-1" });

    mocks.mockGetLiveBracket.mockResolvedValue({
      bracketData: {
        rounds: [{ matches: [{ status: "FINISHED", winnerId: "p1" }] }],
      },
    });
    mocks.mockTournamentRepo.getById.mockResolvedValue({
      status: "IN_PROGRESS",
    });

    const req = createRequest({ winnerId: "p1", score1: 2, score2: 0 });
    const res = (await PUT(req, {
      params: Promise.resolve({ id: "t1", matchId: "m1" }),
    })) as any;

    expect(mocks.mockTournamentRepo.updateStatus).toHaveBeenCalledWith(
      "t1",
      "COMPLETED",
    );
    expect(mocks.mockEventEmitter.emit).toHaveBeenCalledWith(
      "tournament:statusChanged",
      expect.any(Object),
    );
    expect(res.body).toEqual({ success: true });
  });

  it("should return 500 on error", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
    } as any);
    mocks.mockUpdateMatchWinner.mockRejectedValue(new Error("crash"));

    const req = createRequest({ winnerId: "p1", score1: 2, score2: 0 });
    const res = (await PUT(req, {
      params: Promise.resolve({ id: "t1", matchId: "m1" }),
    })) as any;

    expect(res.body).toEqual({ error: "crash" });
    expect(res.init).toEqual({ status: 500 });
  });
});
