import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/tournaments/[id]/enrollments/route";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { TournamentRepository } from "@/repositories/tournament.repository";

const mocks = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockGetEnrolledPlayers: vi.fn(),
  mockGetEnrolledTeams: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/repositories/tournament.repository", () => ({
  TournamentRepository: class {
    getById = mocks.mockGetById;
    getEnrolledPlayers = mocks.mockGetEnrolledPlayers;
    getEnrolledTeams = mocks.mockGetEnrolledTeams;
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

describe("GET /api/tournaments/[id]/enrollments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetById.mockReset();
    mocks.mockGetEnrolledPlayers.mockReset();
    mocks.mockGetEnrolledTeams.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const createRequest = () => ({}) as unknown as Request;

  it("should return 401 if not authorized", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = createRequest();

    const res = (await GET(req, {
      params: Promise.resolve({ id: "1" }),
    })) as any;

    expect(res.body).toEqual({ error: "Unauthorized" });
    expect(res.init).toEqual({ status: 401 });
  });

  it("should return 404 if tournament not found", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    mocks.mockGetById.mockResolvedValue(null);
    const req = createRequest();

    const res = (await GET(req, {
      params: Promise.resolve({ id: "1" }),
    })) as any;

    expect(res.body).toEqual({ error: "Torneo no encontrado" });
    expect(res.init).toEqual({ status: 404 });
  });

  it("should return 403 if user is not organizer", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    mocks.mockGetById.mockResolvedValue({ organizer_id: "user-2" });
    const req = createRequest();

    const res = (await GET(req, {
      params: Promise.resolve({ id: "1" }),
    })) as any;

    expect(res.body).toEqual({ error: "No tienes permiso para ver esto" });
    expect(res.init).toEqual({ status: 403 });
  });

  it("should return enrolled players for INDIVIDUAL tournament", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "admin-1" } as any);
    mocks.mockGetById.mockResolvedValue({
      organizer_id: "admin-1",
      type: "INDIVIDUAL",
    });
    mocks.mockGetEnrolledPlayers.mockResolvedValue([{ id: "p1" }]);
    const req = createRequest();

    const res = (await GET(req, {
      params: Promise.resolve({ id: "1" }),
    })) as any;

    expect(mocks.mockGetEnrolledPlayers).toHaveBeenCalledWith("1");
    expect(res.body).toEqual({ players: [{ id: "p1" }] });
  });

  it("should return enrolled teams for TEAM tournament", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "admin-1" } as any);
    mocks.mockGetById.mockResolvedValue({
      organizer_id: "admin-1",
      type: "TEAM",
    });
    mocks.mockGetEnrolledTeams.mockResolvedValue([{ id: "t1" }]);
    const req = createRequest();

    const res = (await GET(req, {
      params: Promise.resolve({ id: "1" }),
    })) as any;

    expect(mocks.mockGetEnrolledTeams).toHaveBeenCalledWith("1");
    expect(res.body).toEqual({ players: [{ id: "t1" }] });
  });

  it("should return 500 on error", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "admin-1" } as any);
    mocks.mockGetById.mockRejectedValue(new Error("crash"));
    const req = createRequest();

    const res = (await GET(req, {
      params: Promise.resolve({ id: "1" }),
    })) as any;

    expect(res.body).toEqual({ error: "Internal Server Error" });
    expect(res.init).toEqual({ status: 500 });
  });
});
