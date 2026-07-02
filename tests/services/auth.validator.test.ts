import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthValidator } from "@/services/auth.validator";
import * as authLib from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  emailMatchesAllowedDomain: vi.fn(),
}));

describe("AuthValidator", () => {
  let validator: AuthValidator;

  beforeEach(() => {
    validator = new AuthValidator();
    vi.mocked(authLib.emailMatchesAllowedDomain).mockReturnValue(true);
  });

  describe("validateRegister", () => {
    it("should validate correct data", () => {
      const data = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        region: "LATAM",
        country: "México",
      };
      const result = validator.validateRegister(data);
      expect(result.isValid).toBe(true);
    });

    it("should fail if username is too short", () => {
      const result = validator.validateRegister({
        username: "ab",
        email: "test@example.com",
        password: "password123",
        region: "LATAM",
        country: "México",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("entre 3 y 40");
    });

    it("should fail if username is too long", () => {
      const result = validator.validateRegister({
        username: "a".repeat(41),
        email: "test@example.com",
        password: "password123",
        region: "LATAM",
        country: "México",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("entre 3 y 40");
    });

    it("should fail if email is invalid", () => {
      const result = validator.validateRegister({
        username: "testuser",
        email: "invalid-email",
        password: "password123",
        region: "LATAM",
        country: "México",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("correo valido");
    });

    it("should fail if email domain is not allowed", () => {
      vi.mocked(authLib.emailMatchesAllowedDomain).mockReturnValue(false);
      const result = validator.validateRegister({
        username: "testuser",
        email: "test@notallowed.com",
        password: "password123",
        region: "LATAM",
        country: "México",
      });
      expect(result.isValid).toBe(false);
      expect(result.status).toBe(403);
    });

    it("should fail if password is too short", () => {
      const result = validator.validateRegister({
        username: "testuser",
        email: "test@example.com",
        password: "short",
        region: "LATAM",
        country: "México",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("8 caracteres");
    });

    it("should fail if region is invalid", () => {
      const result = validator.validateRegister({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        region: "INVALID_REGION",
        country: "México",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("region valida");
    });

    it("should fail if country is invalid", () => {
      const result = validator.validateRegister({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        region: "LATAM",
        country: "Narnia",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("país válido");
    });
  });

  describe("validateLogin", () => {
    it("should validate correct login data", () => {
      const result = validator.validateLogin({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.isValid).toBe(true);
    });

    it("should fail if email is missing", () => {
      const result = validator.validateLogin({
        email: "",
        password: "password123",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("obligatorios");
    });

    it("should fail if password is missing", () => {
      const result = validator.validateLogin({
        email: "test@example.com",
        password: "",
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("obligatorios");
    });

    it("should fail if email domain is not allowed on login", () => {
      vi.mocked(authLib.emailMatchesAllowedDomain).mockReturnValue(false);
      const result = validator.validateLogin({
        email: "test@notallowed.com",
        password: "password123",
      });
      expect(result.isValid).toBe(false);
      expect(result.status).toBe(403);
    });
  });
});
