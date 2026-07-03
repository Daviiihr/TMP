import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/enrollments/team/route";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const mocks = vi.hoisted(() => ({
  mockEnrollmentService: { enrollTeamInTournament: vi.fn() },
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createEnrollmentService: vi.fn(() => mocks.mockEnrollmentService),
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

describe("POST /api/enrollments/team", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockEnrollmentService.enrollTeamInTournament.mockReset();
  });

  const createRequest = (body: any) => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as Request;
  };

  it("should return 401 if no session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const req = createRequest({});
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({ ok: false, message: "Sesión no iniciada." });
    expect(res.init).toEqual({ status: 401 });
  });

  it("should return 400 if teamId or tournamentId is missing", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    const req = createRequest({ teamId: "team-1" }); // missing tournamentId
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({
      ok: false,
      message: "Team ID y Tournament ID son obligatorios.",
    });
    expect(res.init).toEqual({ status: 400 });
  });

  it("should enroll team and return 200 on success", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    mocks.mockEnrollmentService.enrollTeamInTournament.mockResolvedValue({
      enrollment: { id: "enroll-1" },
    });

    const req = createRequest({ teamId: "team-1", tournamentId: "tour-1" });
    const res = (await POST(req)) as any;

    expect(
      mocks.mockEnrollmentService.enrollTeamInTournament,
    ).toHaveBeenCalledWith("team-1", "tour-1");
    expect(res.body).toEqual({ ok: true, enrollment: { id: "enroll-1" } });
    expect(res.init).toEqual({ status: 200 });
  });

  it("should return 400 on error", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    mocks.mockEnrollmentService.enrollTeamInTournament.mockRejectedValue(
      new Error("Equipo lleno"),
    );

    const req = createRequest({ teamId: "team-1", tournamentId: "tour-1" });
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({ ok: false, message: "Equipo lleno" });
    expect(res.init).toEqual({ status: 400 });
  });
});
