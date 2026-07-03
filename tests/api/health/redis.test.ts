import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/redis/route";
import { assertRedisConnection } from "@/lib/redis";
import { NextResponse } from "next/server";

vi.mock("@/lib/redis", () => ({
  assertRedisConnection: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init })),
  },
}));

describe("GET /api/health/redis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 and redis stats if connection is ok", async () => {
    const mockRedisStats = { pong: "PONG", lastCheck: "time" };
    vi.mocked(assertRedisConnection).mockResolvedValue(mockRedisStats as any);

    const res = (await GET()) as any;

    expect(assertRedisConnection).toHaveBeenCalled();
    expect(res.body).toEqual({
      ok: true,
      service: "redis",
      redis: mockRedisStats,
    });
    expect(res.init).toBeUndefined();
  });

  it("should return 503 if connection fails", async () => {
    vi.mocked(assertRedisConnection).mockRejectedValue(
      new Error("Connection refused"),
    );

    const res = (await GET()) as any;

    expect(assertRedisConnection).toHaveBeenCalled();
    expect(res.body).toEqual({
      ok: false,
      service: "redis",
      error: "Connection refused",
    });
    expect(res.init).toEqual({ status: 503 });
  });

  it("should handle unknown errors gracefully", async () => {
    vi.mocked(assertRedisConnection).mockRejectedValue(12345);

    const res = (await GET()) as any;

    expect(assertRedisConnection).toHaveBeenCalled();
    expect(res.body).toEqual({
      ok: false,
      service: "redis",
      error: "Unknown error",
    });
    expect(res.init).toEqual({ status: 503 });
  });
});
