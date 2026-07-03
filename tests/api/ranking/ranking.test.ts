import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/ranking/route";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  mockRankingRepo: { getRankingsByCountry: vi.fn() },
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createRankingRepository: vi.fn(() => mocks.mockRankingRepo),
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

describe("GET /api/ranking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockRankingRepo.getRankingsByCountry.mockReset();
  });

  const createRequest = (url: string) => {
    return { url } as unknown as Request;
  };

  it("should return rankings", async () => {
    const mockRankings = [{ id: "1", rank: 1 }];
    mocks.mockRankingRepo.getRankingsByCountry.mockResolvedValue(mockRankings);

    const req = createRequest("http://localhost/api/ranking");
    const res = (await GET(req)) as any;

    expect(mocks.mockRankingRepo.getRankingsByCountry).toHaveBeenCalledWith(
      undefined,
    );
    expect(res.body).toEqual({ ok: true, rankings: mockRankings });
  });

  it("should pass country filter to repo", async () => {
    const mockRankings = [{ id: "1", rank: 1 }];
    mocks.mockRankingRepo.getRankingsByCountry.mockResolvedValue(mockRankings);

    const req = createRequest("http://localhost/api/ranking?country=Chile");
    const res = (await GET(req)) as any;

    expect(mocks.mockRankingRepo.getRankingsByCountry).toHaveBeenCalledWith(
      "Chile",
    );
    expect(res.body).toEqual({ ok: true, rankings: mockRankings });
  });

  it("should handle errors", async () => {
    mocks.mockRankingRepo.getRankingsByCountry.mockRejectedValue(
      new Error("DB error"),
    );

    const req = createRequest("http://localhost/api/ranking");
    const res = (await GET(req)) as any;

    expect(res.body).toEqual({
      ok: false,
      message: "Error al obtener rankings",
      error: "DB error",
    });
    expect(res.init).toEqual({ status: 500 });
  });
});
