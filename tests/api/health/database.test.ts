import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/database/route";
import { assertDatabaseConnection } from "@/lib/database";
import { NextResponse } from "next/server";

vi.mock("@/lib/database", () => ({
  assertDatabaseConnection: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

describe("GET /api/health/database", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 and db stats if connection is ok", async () => {
    const mockDbStats = { now: "time", database_name: "test" };
    vi.mocked(assertDatabaseConnection).mockResolvedValue(mockDbStats as any);

    const res = (await GET()) as any;

    expect(assertDatabaseConnection).toHaveBeenCalled();
    expect(res.body).toEqual({
      ok: true,
      service: "postgres",
      database: mockDbStats,
    });
    expect(res.init).toBeUndefined();
  });

  it("should return 503 if connection fails", async () => {
    vi.mocked(assertDatabaseConnection).mockRejectedValue(
      new Error("Connection timeout"),
    );

    const res = (await GET()) as any;

    expect(assertDatabaseConnection).toHaveBeenCalled();
    expect(res.body).toEqual({
      ok: false,
      service: "postgres",
      error: "Connection timeout",
    });
    expect(res.init).toEqual({ status: 503 });
  });

  it("should handle unknown errors gracefully", async () => {
    vi.mocked(assertDatabaseConnection).mockRejectedValue(
      "Unknown string error",
    );

    const res = (await GET()) as any;

    expect(assertDatabaseConnection).toHaveBeenCalled();
    expect(res.body).toEqual({
      ok: false,
      service: "postgres",
      error: "Unknown error",
    });
    expect(res.init).toEqual({ status: 503 });
  });
});
