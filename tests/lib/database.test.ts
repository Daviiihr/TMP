import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getPostgresPool, assertDatabaseConnection } from "@/lib/database";
import { Pool } from "pg";

vi.mock("pg");
vi.mock("@/lib/env", () => ({
  databaseUrl: vi.fn(() => "postgres://mocked-url"),
}));

describe("Database Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.tmpPostgresPool = undefined;
  });

  afterEach(() => {
    globalThis.tmpPostgresPool = undefined;
  });

  describe("getPostgresPool", () => {
    it("should create a new pg Pool if one does not exist", () => {
      const pool = getPostgresPool();
      expect(Pool).toHaveBeenCalledWith({
        connectionString: "postgres://mocked-url",
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      expect(pool).toBeDefined();
    });

    it("should reuse the existing pg Pool", () => {
      const pool1 = getPostgresPool();
      const pool2 = getPostgresPool();
      expect(Pool).toHaveBeenCalledTimes(1);
      expect(pool1).toBe(pool2);
    });
  });

  describe("assertDatabaseConnection", () => {
    it("should execute basic test query and return result", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        rows: [
          {
            now: new Date(),
            database_name: "test_db",
            current_user: "test_user",
          },
        ],
      });

      vi.mocked(Pool).mockImplementation(function () {
        return { query: mockQuery };
      } as unknown as any);

      const result = await assertDatabaseConnection();

      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT now(), current_database() AS database_name, current_user",
      );
      expect(result).toBeDefined();
      expect(result.database_name).toBe("test_db");
    });

    it("should handle migrations logic safely", async () => {
      const mockQuery = vi.fn().mockImplementation(async (query: string) => {
        if (query.includes("SELECT now()"))
          return { rows: [{ now: new Date() }] };
        if (query.includes("table_name = 'country_rankings'"))
          return { rows: [{ exists: false }] };
        if (query.includes("table_name = 'matches'"))
          return { rows: [{ exists: true }] };
        return { rows: [] };
      });

      vi.mocked(Pool).mockImplementation(function () {
        return { query: mockQuery };
      } as unknown as any);

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      await assertDatabaseConnection();

      expect(mockQuery.mock.calls.length).toBeGreaterThan(5);

      consoleLogSpy.mockRestore();
    });

    it("should catch errors during migration gracefully", async () => {
      const mockQuery = vi.fn().mockImplementation(async (query: string) => {
        if (query.includes("SELECT now()"))
          return { rows: [{ now: new Date() }] };
        throw new Error("Migration failed");
      });

      vi.mocked(Pool).mockImplementation(function () {
        return { query: mockQuery };
      } as unknown as any);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await assertDatabaseConnection();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Error en migración dinámica de base de datos:",
        expect.any(Error),
      );
      expect(result).toBeDefined();

      consoleErrorSpy.mockRestore();
    });
  });
});
