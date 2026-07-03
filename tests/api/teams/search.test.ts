import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/teams/search/route";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  mockTeamService: { searchTeams: vi.fn() },
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createTeamService: vi.fn(() => mocks.mockTeamService),
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

describe("GET /api/teams/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockTeamService.searchTeams.mockReset();
  });

  const createRequest = (url: string) => {
    return { url } as unknown as Request;
  };

  it("should return teams on success", async () => {
    const mockTeams = [{ id: "team-1" }];
    mocks.mockTeamService.searchTeams.mockResolvedValue(mockTeams);

    const req = createRequest("http://localhost/api/teams/search?q=test");
    const res = (await GET(req)) as any;

    expect(mocks.mockTeamService.searchTeams).toHaveBeenCalledWith("test");
    expect(res.body).toEqual({ ok: true, teams: mockTeams });
    expect(res.init).toEqual({ status: 200 });
  });

  it("should default query to empty string", async () => {
    mocks.mockTeamService.searchTeams.mockResolvedValue([]);

    const req = createRequest("http://localhost/api/teams/search");
    const res = (await GET(req)) as any;

    expect(mocks.mockTeamService.searchTeams).toHaveBeenCalledWith("");
    expect(res.body).toEqual({ ok: true, teams: [] });
    expect(res.init).toEqual({ status: 200 });
  });

  it("should return 500 on error", async () => {
    mocks.mockTeamService.searchTeams.mockRejectedValue(new Error("crash"));

    const req = createRequest("http://localhost/api/teams/search");
    const res = (await GET(req)) as any;

    expect(res.body).toEqual({ ok: false, message: "crash" });
    expect(res.init).toEqual({ status: 500 });
  });
});
