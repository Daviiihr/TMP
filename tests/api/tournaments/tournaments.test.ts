import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/tournaments/route";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const mocks = vi.hoisted(() => ({
  mockTournamentService: { createTournament: vi.fn() },
  mockPool: { query: vi.fn() },
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createTournamentService: vi.fn(() => mocks.mockTournamentService),
    createPostgresPool: vi.fn(() => mocks.mockPool),
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/domain/tournament.rules", () => ({
  assertAdminAccess: vi.fn((session) => {
    if (!session || session.role !== "ADMIN")
      throw new Error("Solo administradores");
  }),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
    redirect: vi.fn((url) => ({ url })),
  },
}));

describe("/api/tournaments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockTournamentService.createTournament.mockReset();
    mocks.mockPool.query.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("GET", () => {
    const createRequest = (url: string) => {
      return { url } as unknown as Request;
    };

    it("should return list of tournaments if list=true", async () => {
      mocks.mockPool.query.mockResolvedValue({ rows: [{ id: "1" }] });
      const req = createRequest("http://localhost/api/tournaments?list=true");
      const res = (await GET(req)) as any;

      expect(mocks.mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY created_at DESC"),
      );
      expect(res.body).toEqual({ ok: true, tournaments: [{ id: "1" }] });
    });

    it("should return count if list!=true", async () => {
      mocks.mockPool.query.mockResolvedValue({ rows: [{ count: "5" }] });
      const req = createRequest("http://localhost/api/tournaments");
      const res = (await GET(req)) as any;

      expect(mocks.mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("count(*) as count"),
      );
      expect(res.body).toEqual({ ok: true, count: 5 });
    });

    it("should return 500 on error", async () => {
      mocks.mockPool.query.mockRejectedValue(new Error("crash"));
      const req = createRequest("http://localhost/api/tournaments");
      const res = (await GET(req)) as any;

      expect(res.body).toEqual({
        ok: false,
        message: "Error al obtener los torneos.",
      });
      expect(res.init).toEqual({ status: 500 });
    });
  });

  describe("POST", () => {
    const createFormDataRequest = (data: any) => {
      const formData = new Map(Object.entries(data));
      return {
        url: "http://localhost/api/tournaments",
        formData: vi.fn().mockResolvedValue({
          get: (key: string) => formData.get(key),
        }),
      } as unknown as Request;
    };

    it("should return 401 if no session (or not admin via rules)", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "PLAYER" } as any);
      const req = createFormDataRequest({});

      const res = (await POST(req)) as any;

      expect(res.body.message).toContain("No se pudo crear");
      expect(res.init.status).toBe(403);
    });

    it("should return 201/redirect on success", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
      } as any);
      mocks.mockTournamentService.createTournament.mockResolvedValue(undefined);

      const req = createFormDataRequest({
        name: "Tourney",
        game: "Game",
        regions: "LATAM,EU",
        type: "INDIVIDUAL",
        elimination_mode: "SINGLE",
        max_players: "16",
        start_date: "2025-01-01",
        end_date: "2025-01-02",
        registration_closes_at: "2024-12-31",
      });

      const res = (await POST(req)) as any;

      expect(mocks.mockTournamentService.createTournament).toHaveBeenCalledWith(
        {
          name: "Tourney",
          game: "Game",
          regions: ["LATAM", "EU"],
          type: "INDIVIDUAL",
          eliminationMode: "SINGLE",
          maxPlayers: 16,
          playersPerTeam: null,
          startDate: "2025-01-01",
          endDate: "2025-01-02",
          registrationClosesAt: "2024-12-31",
          organizerId: "admin-1",
        },
      );
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it("should return 409 on duplicate error", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
      } as any);

      const conflictError = new Error("duplicate");
      (conflictError as any).code = "23505";
      mocks.mockTournamentService.createTournament.mockRejectedValue(
        conflictError,
      );

      const req = createFormDataRequest({ name: "Tourney" });
      const res = (await POST(req)) as any;

      expect(res.body.message).toBe("Ya existe un torneo con ese nombre.");
      expect(res.init.status).toBe(409);
    });
  });
});
