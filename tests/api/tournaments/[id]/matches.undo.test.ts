import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/tournaments/[id]/matches/[matchId]/undo/route";
import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { BracketRepository } from "@/repositories/bracket.repository";

const mocks = vi.hoisted(() => ({
  mockPool: { query: vi.fn() },
  mockUndoMatchWinner: vi.fn(),
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createPostgresPool: vi.fn(() => mocks.mockPool),
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/repositories/bracket.repository", () => ({
  BracketRepository: class {
    undoMatchWinner = mocks.mockUndoMatchWinner;
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

describe("POST /api/tournaments/[id]/matches/[matchId]/undo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUndoMatchWinner.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const createRequest = () => ({}) as unknown as NextRequest;

  it("should return 401 if not authorized", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = createRequest();

    const res = (await POST(req, {
      params: Promise.resolve({ id: "1", matchId: "m1" }),
    })) as any;

    expect(res.body).toEqual({ error: "No autorizado" });
    expect(res.init).toEqual({ status: 401 });
  });

  it("should return 404 if tournament not found", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    mocks.mockPool.query.mockResolvedValue({ rows: [] });

    const req = createRequest();
    const res = (await POST(req, {
      params: Promise.resolve({ id: "1", matchId: "m1" }),
    })) as any;

    expect(res.body).toEqual({ error: "Torneo no encontrado" });
    expect(res.init).toEqual({ status: 404 });
  });

  it("should return 403 if user is not organizer or admin", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "user-1",
      role: "PLAYER",
    } as any);
    mocks.mockPool.query.mockResolvedValue({
      rows: [{ organizer_id: "user-2" }],
    });

    const req = createRequest();
    const res = (await POST(req, {
      params: Promise.resolve({ id: "1", matchId: "m1" }),
    })) as any;

    expect(res.body).toEqual({
      error: "No tienes permiso para modificar este bracket",
    });
    expect(res.init).toEqual({ status: 403 });
  });

  it("should undo match if user is organizer", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "user-1",
      role: "PLAYER",
    } as any);
    mocks.mockPool.query.mockResolvedValue({
      rows: [{ organizer_id: "user-1" }],
    });
    mocks.mockUndoMatchWinner.mockResolvedValue(undefined);

    const req = createRequest();
    const res = (await POST(req, {
      params: Promise.resolve({ id: "t1", matchId: "m1" }),
    })) as any;

    expect(mocks.mockUndoMatchWinner).toHaveBeenCalledWith("t1", "m1");
    expect(res.body).toEqual({
      success: true,
      message: "Resultado deshecho exitosamente",
    });
  });

  it("should return 500 on error", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "user-1",
      role: "PLAYER",
    } as any);
    mocks.mockPool.query.mockResolvedValue({
      rows: [{ organizer_id: "user-1" }],
    });
    mocks.mockUndoMatchWinner.mockRejectedValue(new Error("crash"));

    const req = createRequest();
    const res = (await POST(req, {
      params: Promise.resolve({ id: "t1", matchId: "m1" }),
    })) as any;

    expect(res.body).toEqual({ error: "crash" });
    expect(res.init).toEqual({ status: 500 });
  });
});
