import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/teams/join/route";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const mocks = vi.hoisted(() => ({
  mockTeamService: { joinTeam: vi.fn() },
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createTeamService: vi.fn(() => mocks.mockTeamService),
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

describe("POST /api/teams/join", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockTeamService.joinTeam.mockReset();
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

  it("should return 400 if teamId missing", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    const req = createRequest({});
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({ ok: false, message: "Team ID es obligatorio." });
    expect(res.init).toEqual({ status: 400 });
  });

  it("should return 200 on success", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    mocks.mockTeamService.joinTeam.mockResolvedValue({ joined: true });

    const req = createRequest({ teamId: "team-1" });
    const res = (await POST(req)) as any;

    expect(mocks.mockTeamService.joinTeam).toHaveBeenCalledWith(
      "team-1",
      "user-1",
    );
    expect(res.body).toEqual({ ok: true, joined: true });
    expect(res.init).toEqual({ status: 200 });
  });

  it("should return 400 on error", async () => {
    vi.mocked(getSession).mockResolvedValue({ id: "user-1" } as any);
    mocks.mockTeamService.joinTeam.mockRejectedValue(new Error("crash"));

    const req = createRequest({ teamId: "team-1" });
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({ ok: false, message: "crash" });
    expect(res.init).toEqual({ status: 400 });
  });
});
