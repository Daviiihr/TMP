import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "@/app/api/teams/route";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const mocks = vi.hoisted(() => ({
  mockTeamService: { createTeam: vi.fn() },
  mockTeamRepo: { findByCaptain: vi.fn() },
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createTeamService: vi.fn(() => mocks.mockTeamService),
    createTeamRepository: vi.fn(() => mocks.mockTeamRepo),
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

describe("/api/teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockTeamService.createTeam.mockReset();
    mocks.mockTeamRepo.findByCaptain.mockReset();
  });

  const createRequest = (body?: any) => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as Request;
  };

  describe("POST", () => {
    it("should return 401 if not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      const req = createRequest({});
      const res = (await POST(req)) as any;

      expect(res.body).toEqual({ ok: false, message: "Sesión no iniciada." });
      expect(res.init).toEqual({ status: 401 });
    });

    it("should return 400 if missing name or size", async () => {
      vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
      const req = createRequest({ name: "Team" }); // missing size
      const res = (await POST(req)) as any;

      expect(res.body).toEqual({
        ok: false,
        message: "Nombre y tamaño son obligatorios.",
      });
      expect(res.init).toEqual({ status: 400 });
    });

    it("should return 201 and create team", async () => {
      vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
      mocks.mockTeamService.createTeam.mockResolvedValue({
        id: "team-1",
        name: "Team",
      });

      const req = createRequest({ name: "Team", size: "5" });
      const res = (await POST(req)) as any;

      expect(mocks.mockTeamService.createTeam).toHaveBeenCalledWith(
        "Team",
        "user-1",
        5,
      );
      expect(res.body).toEqual({
        ok: true,
        message: "Equipo creado exitosamente.",
        team: { id: "team-1", name: "Team" },
      });
      expect(res.init).toEqual({ status: 201 });
    });

    it("should return 500 on error", async () => {
      vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
      mocks.mockTeamService.createTeam.mockRejectedValue(new Error("crash"));

      const req = createRequest({ name: "Team", size: "5" });
      const res = (await POST(req)) as any;

      expect(res.body).toEqual({ ok: false, message: "crash" });
      expect(res.init).toEqual({ status: 500 });
    });
  });

  describe("GET", () => {
    it("should return 401 if not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      const req = createRequest();
      const res = (await GET(req)) as any;

      expect(res.body).toEqual({ ok: false, message: "Sesión no iniciada." });
      expect(res.init).toEqual({ status: 401 });
    });

    it("should return teams for captain", async () => {
      vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
      const mockTeams = [{ id: "team-1" }];
      mocks.mockTeamRepo.findByCaptain.mockResolvedValue(mockTeams);

      const req = createRequest();
      const res = (await GET(req)) as any;

      expect(mocks.mockTeamRepo.findByCaptain).toHaveBeenCalledWith("user-1");
      expect(res.body).toEqual({ ok: true, teams: mockTeams });
      expect(res.init).toEqual({ status: 200 });
    });

    it("should return 500 on error", async () => {
      vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
      mocks.mockTeamRepo.findByCaptain.mockRejectedValue(new Error("crash"));

      const req = createRequest();
      const res = (await GET(req)) as any;

      expect(res.body).toEqual({ ok: false, message: "crash" });
      expect(res.init).toEqual({ status: 500 });
    });
  });
});
