import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import * as env from "@/lib/env";

describe("Env Utils", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should throw error if required env is missing", () => {
    delete process.env.DATABASE_URL;
    expect(() => env.databaseUrl()).toThrow(
      "Missing required environment variable: DATABASE_URL",
    );
  });

  it("should return value if env is present", () => {
    process.env.DATABASE_URL = "postgres://localhost";
    process.env.REDIS_URL = "redis://localhost";
    process.env.JWT_ACCESS_SECRET = "secret1";
    process.env.JWT_REFRESH_SECRET = "secret2";

    expect(env.databaseUrl()).toBe("postgres://localhost");
    expect(env.redisUrl()).toBe("redis://localhost");
    expect(env.jwtAccessSecret()).toBe("secret1");
    expect(env.jwtRefreshSecret()).toBe("secret2");
  });

  it("should parse allowed email domains", () => {
    process.env.ALLOWED_EMAIL_DOMAINS = "gmail.com, hotmail.com , Yahoo.com";
    const domains = env.allowedEmailDomains();
    expect(domains).toEqual(["gmail.com", "hotmail.com", "yahoo.com"]);
  });

  it("should fallback to gmail.com if ALLOWED_EMAIL_DOMAINS is not set", () => {
    delete process.env.ALLOWED_EMAIL_DOMAINS;
    expect(env.allowedEmailDomains()).toEqual(["gmail.com"]);
  });
});
