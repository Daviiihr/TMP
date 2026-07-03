import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/admin/validations/[id]/route";
import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { MatchResultRepository } from "@/repositories/matchResult.repository";
import { BracketRepository } from "@/repositories/bracket.repository";
import { getPostgresPool } from "@/lib/database";

const mocks = vi.hoisted(() => ({
  mockPool: { query: vi.fn() },
  mockEventEmitter: { emit: vi.fn() },
  mockUpdateStatus: vi.fn(),
  mockUpdateMatchWinner: vi.fn(),
}));

vi.mock("@/lib/database", () => ({
  getPostgresPool: vi.fn(() => mocks.mockPool),
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    getEventEmitter: vi.fn(() => mocks.mockEventEmitter),
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/repositories/matchResult.repository", () => ({
  MatchResultRepository: class {
    updateStatus = mocks.mockUpdateStatus;
  },
}));
vi.mock("@/repositories/bracket.repository", () => ({
  BracketRepository: class {
    updateMatchWinner = mocks.mockUpdateMatchWinner;
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

describe("PATCH /api/admin/validations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUpdateStatus.mockReset();
    mocks.mockUpdateMatchWinner.mockReset();
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
    const res = (await PATCH(req, {
      params: Promise.resolve({ id: "1" }),
    })) as any;

    expect(res.body).toEqual({ error: "No autorizado" });
    expect(res.init).toEqual({ status: 401 });
  });

  it("should return 400 if invalid status", async () => {
    vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
    const req = createRequest({ status: "INVALID" });
    const res = (await PATCH(req, {
      params: Promise.resolve({ id: "1" }),
    })) as any;

    expect(res.body).toEqual({ error: "Estado inválido" });
    expect(res.init).toEqual({ status: 400 });
  });

  it("should return 404 if validation not found", async () => {
    vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
    mocks.mockPool.query.mockResolvedValue({ rows: [] });

    const req = createRequest({ status: "APPROVED" });
    const res = (await PATCH(req, {
      params: Promise.resolve({ id: "1" }),
    })) as any;

    expect(res.body).toEqual({ error: "Validación no encontrada" });
    expect(res.init).toEqual({ status: 404 });
  });

  it("should return 400 if tie", async () => {
    vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
    mocks.mockPool.query.mockResolvedValue({
      rows: [
        {
          score_participant1: 1,
          score_participant2: 1,
        },
      ],
    });

    const req = createRequest({ status: "APPROVED" });
    const res = (await PATCH(req, {
      params: Promise.resolve({ id: "1" }),
    })) as any;

    expect(res.body).toEqual({
      error: "Empate no soportado para definir ganador",
    });
    expect(res.init).toEqual({ status: 400 });
  });

  it("should approve and update bracket", async () => {
    vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
    mocks.mockPool.query.mockResolvedValue({
      rows: [
        {
          match_id: "m1",
          tournament_id: "t1",
          participant1_id: "p1",
          participant2_id: "p2",
          score_participant1: 2,
          score_participant2: 0,
        },
      ],
    });
    mocks.mockUpdateStatus.mockResolvedValue({ id: "val-1" });

    const req = createRequest({ status: "APPROVED" });
    const res = (await PATCH(req, {
      params: Promise.resolve({ id: "val-1" }),
    })) as any;

    expect(mocks.mockUpdateStatus).toHaveBeenCalledWith(
      "val-1",
      "APPROVED",
      undefined,
    );
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
    expect(res.body).toEqual({ success: true, validation: { id: "val-1" } });
  });

  it("should reject validation", async () => {
    vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
    mocks.mockPool.query.mockResolvedValue({
      rows: [
        {
          match_id: "m1",
          tournament_id: "t1",
          participant1_id: "p1",
          participant2_id: "p2",
          score_participant1: 2,
          score_participant2: 0,
        },
      ],
    });
    mocks.mockUpdateStatus.mockResolvedValue({ id: "val-1" });

    const req = createRequest({
      status: "REJECTED",
      rejectionReason: "Bad proof",
    });
    const res = (await PATCH(req, {
      params: Promise.resolve({ id: "val-1" }),
    })) as any;

    expect(mocks.mockUpdateStatus).toHaveBeenCalledWith(
      "val-1",
      "REJECTED",
      "Bad proof",
    );
    expect(mocks.mockUpdateMatchWinner).not.toHaveBeenCalled();
    expect(res.body).toEqual({ success: true, validation: { id: "val-1" } });
  });

  it("should return 500 on error", async () => {
    vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);
    mocks.mockPool.query.mockRejectedValue(new Error("crash"));

    const req = createRequest({ status: "APPROVED" });
    const res = (await PATCH(req, {
      params: Promise.resolve({ id: "1" }),
    })) as any;

    expect(res.body).toEqual({ error: "crash" });
    expect(res.init).toEqual({ status: 500 });
  });
});
