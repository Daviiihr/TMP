import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "@/services/auth.service";
import { UserRepository, UserRow } from "@/repositories/user.repository";
import bcrypt from "bcryptjs";
import * as authLib from "@/lib/auth";
import * as redisLib from "@/lib/redis";

// Mock dependencies
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  createAccessToken: vi.fn(() => "access-token"),
  createRefreshToken: vi.fn(() => "refresh-token"),
}));

vi.mock("@/lib/redis", () => ({
  getRedisClient: vi.fn(),
}));

vi.mock("next/server", () => {
  const setCookie = vi.fn();
  return {
    NextResponse: {
      json: vi.fn().mockImplementation((data) => ({
        ...data,
        cookies: {
          set: setCookie,
        },
      })),
    },
  };
});

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepo: vi.Mocked<UserRepository>;
  let mockRedis: any;

  beforeEach(() => {
    mockUserRepo = {
      resetLoginAttempts: vi.fn(),
      updateLoginAttempts: vi.fn(),
    } as unknown as vi.Mocked<UserRepository>;

    mockRedis = {
      status: "ready",
      set: vi.fn(),
      connect: vi.fn(),
    };
    vi.mocked(redisLib.getRedisClient).mockReturnValue(mockRedis as any);

    authService = new AuthService(mockUserRepo);
  });

  describe("verifyPassword", () => {
    const mockUser: UserRow = {
      id: "user-1",
      username: "test",
      email: "test@test.com",
      password_hash: "hashed_pw",
      role: "PLAYER",
      region: "LATAM",
      country: "Chile",
      failed_login_attempts: 0,
      locked_until: null,
      created_at: new Date(),
    };

    it("should return error if account is temporarily locked", async () => {
      const lockedUser = {
        ...mockUser,
        locked_until: new Date(Date.now() + 10000),
      };
      const result = await authService.verifyPassword(lockedUser, "password");

      expect(result.ok).toBe(false);
      expect(result.status).toBe(423);
      expect(result.message).toContain("bloqueada");
    });

    it("should handle failed login and increment attempts", async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      const result = await authService.verifyPassword(
        mockUser,
        "wrongpassword",
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
      expect(mockUserRepo.updateLoginAttempts).toHaveBeenCalledWith(
        "user-1",
        1,
        null,
      );
    });

    it("should lock account after 5 failed attempts", async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false);
      const failingUser = { ...mockUser, failed_login_attempts: 4 };

      await authService.verifyPassword(failingUser, "wrongpassword");

      expect(mockUserRepo.updateLoginAttempts).toHaveBeenCalledWith(
        "user-1",
        5,
        expect.any(Date), // Should pass a date for lockedUntil
      );
    });

    it("should return success and reset attempts on correct password", async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const result = await authService.verifyPassword(
        mockUser,
        "correctpassword",
      );

      expect(result.ok).toBe(true);
      expect(result.status).toBe(200);
      expect(mockUserRepo.resetLoginAttempts).toHaveBeenCalledWith("user-1");
    });
  });

  describe("createSession", () => {
    const mockUser: UserRow = {
      id: "user-1",
      username: "test",
      email: "test@test.com",
      password_hash: "hashed",
      role: "PLAYER",
      region: "NA",
      country: "USA",
      failed_login_attempts: 0,
      locked_until: null,
      created_at: new Date(),
    };

    it("should generate tokens and return NextResponse with cookies", async () => {
      const response = await authService.createSession(mockUser);

      // Verify tokens created
      expect(authLib.createAccessToken).toHaveBeenCalled();
      expect(authLib.createRefreshToken).toHaveBeenCalled();

      // Verify Redis saved refresh token
      expect(mockRedis.set).toHaveBeenCalledWith(
        "refresh:user-1",
        "refresh-token",
        "EX",
        3600,
      );

      // Verify response structure
      expect(response.ok).toBe(true);
      expect((response as any).accessToken).toBe("access-token");
      expect((response as any).cookies.set).toHaveBeenCalledTimes(2);
    });
  });
});
