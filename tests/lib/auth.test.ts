import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createAccessToken,
  createRefreshToken,
  emailMatchesAllowedDomain,
  allowedEmailDomainsMessage,
  getAuthUser,
  AuthUser,
} from "@/lib/auth";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  jwtAccessSecret: vi.fn(() => "access-secret"),
  jwtRefreshSecret: vi.fn(() => "refresh-secret"),
  allowedEmailDomains: vi.fn(() => ["gmail.com", "test.com"]),
}));

describe("Auth Utils", () => {
  const mockUser: AuthUser = {
    id: "user-123",
    email: "test@gmail.com",
    username: "testuser",
    role: "PLAYER",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Tokens", () => {
    it("should create access token", () => {
      vi.mocked(jwt.sign).mockReturnValue("access-token-string" as any);

      const token = createAccessToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(mockUser, "access-secret", {
        expiresIn: "60m",
        subject: "user-123",
      });
      expect(token).toBe("access-token-string");
    });

    it("should create refresh token", () => {
      vi.mocked(jwt.sign).mockReturnValue("refresh-token-string" as any);

      const token = createRefreshToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser.id },
        "refresh-secret",
        { expiresIn: "60m", subject: "user-123" },
      );
      expect(token).toBe("refresh-token-string");
    });
  });

  describe("Email Domains", () => {
    it("should return true if email matches allowed domain", () => {
      expect(emailMatchesAllowedDomain("user@gmail.com")).toBe(true);
      expect(emailMatchesAllowedDomain("user@test.com")).toBe(true);
      expect(emailMatchesAllowedDomain("  user@TEST.com  ")).toBe(true);
    });

    it("should return false if email does not match", () => {
      expect(emailMatchesAllowedDomain("user@hotmail.com")).toBe(false);
      expect(emailMatchesAllowedDomain("user@yahoo.com")).toBe(false);
      expect(emailMatchesAllowedDomain("invalid-email")).toBe(false);
    });

    it("should return true if allowed domains array is empty", async () => {
      const envModule = await import("@/lib/env");
      vi.mocked(envModule.allowedEmailDomains).mockReturnValueOnce([]);

      expect(emailMatchesAllowedDomain("user@any.com")).toBe(true);
    });

    it("should generate allowed domains message", () => {
      const msg = allowedEmailDomainsMessage();
      expect(msg).toBe(
        "Usa un correo con dominio autorizado: gmail.com, test.com.",
      );
    });
  });

  describe("getAuthUser", () => {
    it("should return hardcoded admin if no auth header", async () => {
      const req = new NextRequest("http://localhost", {
        headers: new Headers(),
      });
      const user = await getAuthUser(req);

      expect(user).toEqual({
        id: "00000000-0000-0000-0000-000000000000",
        username: "Test Admin",
        email: "admin@test.com",
        role: "ADMIN",
      });
    });

    it("should return decoded user if auth header is valid", async () => {
      const headers = new Headers();
      headers.set("authorization", "Bearer valid-token");
      const req = new NextRequest("http://localhost", { headers });

      vi.mocked(jwt.verify).mockReturnValue(mockUser as any);

      const user = await getAuthUser(req);

      expect(jwt.verify).toHaveBeenCalledWith("valid-token", "access-secret");
      expect(user).toEqual(mockUser);
    });

    it("should return null if jwt verification fails", async () => {
      const headers = new Headers();
      headers.set("authorization", "Bearer invalid-token");
      const req = new NextRequest("http://localhost", { headers });

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const user = await getAuthUser(req);
      expect(user).toBeNull();
    });
  });
});
