import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/tournaments/[id]/brackets/route";
import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { BracketRepository } from "@/repositories/bracket.repository";
import { generateBracket } from "@/lib/algorithms/brackets";

const mocks = vi.hoisted(() => ({
  mockTournamentRepo: { getById: vi.fn(), updateStatus: vi.fn() },
  mockEventEmitter: { emit: vi.fn() },
  mockSaveBracket: vi.fn(),
  mockGetLiveBracket: vi.fn(),
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createTournamentRepository: vi.fn(() => mocks.mockTournamentRepo),
    getEventEmitter: vi.fn(() => mocks.mockEventEmitter),
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/repositories/bracket.repository", () => ({
  BracketRepository: class {
    saveBracket = mocks.mockSaveBracket;
    getLiveBracket = mocks.mockGetLiveBracket;
  },
}));
vi.mock("@/lib/algorithms/brackets", () => ({
  generateBracket: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
  NextRequest: vi.fn(),
}));

describe("/api/tournaments/[id]/brackets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockSaveBracket.mockReset();
    mocks.mockGetLiveBracket.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const createRequest = (body?: any) => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  describe("POST", () => {
    it("should return 401 if not authorized", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      const req = createRequest();

      const res = (await POST(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(res.body).toEqual({ error: "No autorizado" });
      expect(res.init).toEqual({ status: 401 });
    });

    it("should return 400 if less than 4 participants", async () => {
      vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
      const req = createRequest({
        participants: [{ id: "1" }, { id: "2" }, { id: "3" }],
        eliminationMode: "SINGLE_ELIMINATION",
      });

      const res = (await POST(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(res.body).toEqual({
        error: "Se requieren al menos 4 participantes",
      });
      expect(res.init).toEqual({ status: 400 });
    });

    it("should generate and save bracket, update tournament status", async () => {
      vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
      const participants = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];
      vi.mocked(generateBracket).mockReturnValue({ rounds: [] });
      mocks.mockSaveBracket.mockResolvedValue("bracket-1");
      mocks.mockTournamentRepo.getById.mockResolvedValue({ status: "DRAFT" });

      const req = createRequest({
        participants,
        eliminationMode: "SINGLE_ELIMINATION",
      });
      const res = (await POST(req, {
        params: Promise.resolve({ id: "tourn-1" }),
      })) as any;

      expect(generateBracket).toHaveBeenCalledWith(
        participants,
        "SINGLE_ELIMINATION",
      );
      expect(mocks.mockSaveBracket).toHaveBeenCalledWith(
        "tourn-1",
        "user-1",
        { rounds: [] },
        "SINGLE_ELIMINATION",
      );
      expect(mocks.mockTournamentRepo.updateStatus).toHaveBeenCalledWith(
        "tourn-1",
        "IN_PROGRESS",
      );
      expect(mocks.mockEventEmitter.emit).toHaveBeenCalledWith(
        "tournament:statusChanged",
        expect.any(Object),
      );

      expect(res.body).toEqual({
        success: true,
        bracketId: "bracket-1",
        bracketData: { rounds: [] },
      });
    });

    it("should return 500 on error", async () => {
      vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
      vi.mocked(generateBracket).mockImplementation(() => {
        throw new Error("crash");
      });

      const req = createRequest({
        participants: [{}, {}, {}, {}],
        eliminationMode: "SINGLE_ELIMINATION",
      });
      const res = (await POST(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(res.body).toEqual({ error: "crash" });
      expect(res.init).toEqual({ status: 500 });
    });
  });

  describe("GET", () => {
    const createGetRequest = () => ({}) as unknown as NextRequest;

    it("should return null if no live bracket", async () => {
      mocks.mockGetLiveBracket.mockResolvedValue(null);
      const req = createGetRequest();

      const res = (await GET(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(res.body).toEqual({ bracketData: null });
    });

    it("should return bracket data if exists", async () => {
      mocks.mockGetLiveBracket.mockResolvedValue({
        bracketData: { rounds: [] },
        eliminationMode: "SINGLE",
      });
      const req = createGetRequest();

      const res = (await GET(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(res.body).toEqual({
        bracketData: { rounds: [] },
        eliminationMode: "SINGLE",
      });
    });

    it("should return 500 on error", async () => {
      mocks.mockGetLiveBracket.mockRejectedValue(new Error("crash"));
      const req = createGetRequest();

      const res = (await GET(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(res.body).toEqual({ error: "crash" });
      expect(res.init).toEqual({ status: 500 });
    });
  });
});
