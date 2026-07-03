import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/tournaments/[id]/route";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const mocks = vi.hoisted(() => ({
  mockTournamentService: { changeStatus: vi.fn() },
  mockTournamentRepo: { getById: vi.fn() },
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createTournamentService: vi.fn(() => mocks.mockTournamentService),
    createTournamentRepository: vi.fn(() => mocks.mockTournamentRepo),
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
  },
}));

describe("/api/tournaments/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockTournamentService.changeStatus.mockReset();
    mocks.mockTournamentRepo.getById.mockReset();
  });

  const createRequest = (body?: any) => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as Request;
  };

  describe("GET", () => {
    it("should return 404 if tournament not found", async () => {
      mocks.mockTournamentRepo.getById.mockResolvedValue(null);
      const req = createRequest();

      const res = (await GET(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(res.body).toEqual({ ok: false, message: "Torneo no encontrado." });
      expect(res.init).toEqual({ status: 404 });
    });

    it("should return tournament on success", async () => {
      mocks.mockTournamentRepo.getById.mockResolvedValue({
        id: "1",
        name: "T",
      });
      const req = createRequest();

      const res = (await GET(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(mocks.mockTournamentRepo.getById).toHaveBeenCalledWith("1");
      expect(res.body).toEqual({
        ok: true,
        tournament: { id: "1", name: "T" },
      });
      expect(res.init).toBeUndefined();
    });

    it("should return 500 on error", async () => {
      mocks.mockTournamentRepo.getById.mockRejectedValue(new Error("crash"));
      const req = createRequest();

      const res = (await GET(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(res.body).toEqual({
        ok: false,
        message: "Error al obtener el torneo.",
      });
      expect(res.init).toEqual({ status: 500 });
    });
  });

  describe("PATCH", () => {
    it("should return 401/403 if not admin", async () => {
      vi.mocked(getSession).mockResolvedValue({ role: "PLAYER" } as any);
      const req = createRequest({ status: "IN_PROGRESS" });

      const res = (await PATCH(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(res.body.message).toEqual("Error al actualizar el torneo.");
      expect(res.init.status).toBe(403);
    });

    it("should return 200 on success", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
      } as any);
      mocks.mockTournamentService.changeStatus.mockResolvedValue({
        message: "Status updated",
      });

      const req = createRequest({ status: "IN_PROGRESS" });
      const res = (await PATCH(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(mocks.mockTournamentService.changeStatus).toHaveBeenCalledWith(
        "1",
        "IN_PROGRESS",
        "admin-1",
      );
      expect(res.body).toEqual({ ok: true, message: "Status updated" });
      expect(res.init).toBeUndefined();
    });

    it("should return 500 on error", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: "admin-1",
        role: "ADMIN",
      } as any);
      mocks.mockTournamentService.changeStatus.mockRejectedValue(
        new Error("crash"),
      );

      const req = createRequest({ status: "IN_PROGRESS" });
      const res = (await PATCH(req, {
        params: Promise.resolve({ id: "1" }),
      })) as any;

      expect(res.body).toEqual({
        ok: false,
        message: "Error al actualizar el torneo.",
        details: "crash",
      });
      expect(res.init).toEqual({ status: 500 });
    });
  });
});
