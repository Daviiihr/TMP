import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ranking/recalculate/route";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  mockRankingService: { recalculateAllRankings: vi.fn() },
  mockPool: { query: vi.fn() },
}));

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createRankingService: vi.fn(() => mocks.mockRankingService),
    createPostgresPool: vi.fn(() => mocks.mockPool),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed"),
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

describe("POST /api/ranking/recalculate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockRankingService.recalculateAllRankings.mockReset();
    mocks.mockPool.query.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const createRequest = (url: string) => {
    return { url } as unknown as Request;
  };

  it("should trigger recalculation without seeding", async () => {
    mocks.mockRankingService.recalculateAllRankings.mockResolvedValue(
      undefined,
    );

    const req = createRequest("http://localhost/api/ranking/recalculate");
    const res = (await POST(req)) as any;

    expect(mocks.mockRankingService.recalculateAllRankings).toHaveBeenCalled();
    expect(mocks.mockPool.query).not.toHaveBeenCalled();
    expect(res.body).toEqual({
      ok: true,
      message: "Rankings actualizados correctamente",
    });
  });

  it("should handle seeding if seed=true and few users", async () => {
    mocks.mockRankingService.recalculateAllRankings.mockResolvedValue(
      undefined,
    );
    mocks.mockPool.query.mockImplementation(async (q: string) => {
      if (q.includes("COUNT(*)")) return { rows: [{ count: "0" }] };
      if (q.includes("INSERT INTO users")) return { rows: [{ id: "user-id" }] };
      if (q.includes("INSERT INTO tournaments"))
        return { rows: [{ id: "tourn-id" }] };
      if (q.includes("INSERT INTO matches"))
        return { rows: [{ id: "match-id" }] };
      return { rows: [] };
    });

    const req = createRequest(
      "http://localhost/api/ranking/recalculate?seed=true",
    );
    const res = (await POST(req)) as any;

    expect(mocks.mockRankingService.recalculateAllRankings).toHaveBeenCalled();
    // At least the query checking the user count should be called
    expect(mocks.mockPool.query).toHaveBeenCalledWith(
      "SELECT COUNT(*) FROM users",
    );
    expect(res.body).toEqual({
      ok: true,
      message: "Rankings actualizados correctamente (con semillas de prueba)",
    });
  });

  it("should not seed if enough users exist", async () => {
    mocks.mockRankingService.recalculateAllRankings.mockResolvedValue(
      undefined,
    );
    mocks.mockPool.query.mockImplementation(async (q: string) => {
      if (q.includes("COUNT(*)")) return { rows: [{ count: "10" }] };
      return { rows: [] };
    });

    const req = createRequest(
      "http://localhost/api/ranking/recalculate?seed=true",
    );
    const res = (await POST(req)) as any;

    expect(mocks.mockRankingService.recalculateAllRankings).toHaveBeenCalled();
    expect(mocks.mockPool.query).toHaveBeenCalledWith(
      "SELECT COUNT(*) FROM users",
    );
    // It shouldn't try to insert admin
    expect(mocks.mockPool.query).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO users"),
    );
  });

  it("should handle errors gracefully", async () => {
    mocks.mockRankingService.recalculateAllRankings.mockRejectedValue(
      new Error("Recalculate failed"),
    );

    const req = createRequest("http://localhost/api/ranking/recalculate");
    const res = (await POST(req)) as any;

    expect(res.body).toEqual({
      ok: false,
      message: "Error al recalcular rankings",
      error: "Recalculate failed",
    });
    expect(res.init).toEqual({ status: 500 });
  });
});
