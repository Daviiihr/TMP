import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRedisClient, assertRedisConnection } from "@/lib/redis";
import Redis from "ioredis";

vi.mock("ioredis");
vi.mock("@/lib/env", () => ({
  redisUrl: vi.fn(() => "redis://mocked-url"),
}));

describe("Redis Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.tmpRedisClient = undefined;
  });

  afterEach(() => {
    globalThis.tmpRedisClient = undefined;
  });

  describe("getRedisClient", () => {
    it("should create a new Redis client if one does not exist", () => {
      const client = getRedisClient();
      expect(Redis).toHaveBeenCalledWith(
        "redis://mocked-url",
        expect.any(Object),
      );
      expect(client).toBeDefined();
    });

    it("should reuse the existing Redis client", () => {
      const client1 = getRedisClient();
      const client2 = getRedisClient();
      expect(Redis).toHaveBeenCalledTimes(1);
      expect(client1).toBe(client2);
    });
  });

  describe("assertRedisConnection", () => {
    it("should connect if status is wait", async () => {
      const mockConnect = vi.fn().mockResolvedValue(undefined);
      const mockPing = vi.fn().mockResolvedValue("PONG");
      const mockSet = vi.fn().mockResolvedValue("OK");
      const mockGet = vi.fn().mockResolvedValue("time");

      vi.mocked(Redis).mockImplementation(function () {
        return {
          status: "wait",
          connect: mockConnect,
          ping: mockPing,
          set: mockSet,
          get: mockGet,
        };
      } as unknown as any);

      const result = await assertRedisConnection();

      expect(mockConnect).toHaveBeenCalled();
      expect(mockPing).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        "tmp:healthcheck",
        expect.any(String),
        "EX",
        60,
      );
      expect(mockGet).toHaveBeenCalledWith("tmp:healthcheck");
      expect(result).toEqual({ pong: "PONG", lastCheck: "time" });
    });

    it("should connect if status is end", async () => {
      const mockConnect = vi.fn().mockResolvedValue(undefined);

      vi.mocked(Redis).mockImplementation(function () {
        return {
          status: "end",
          connect: mockConnect,
          ping: vi.fn(),
          set: vi.fn(),
          get: vi.fn(),
        };
      } as unknown as any);

      await assertRedisConnection();
      expect(mockConnect).toHaveBeenCalled();
    });

    it("should not connect if status is ready", async () => {
      const mockConnect = vi.fn();

      vi.mocked(Redis).mockImplementation(function () {
        return {
          status: "ready",
          connect: mockConnect,
          ping: vi.fn(),
          set: vi.fn(),
          get: vi.fn(),
        };
      } as unknown as any);

      await assertRedisConnection();
      expect(mockConnect).not.toHaveBeenCalled();
    });
  });
});
