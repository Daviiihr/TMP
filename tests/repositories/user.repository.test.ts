import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRepository } from "@/repositories/user.repository";
import { Pool } from "pg";

vi.mock("pg", () => {
  const Pool = vi.fn();
  Pool.prototype.query = vi.fn();
  return { Pool };
});

describe("UserRepository", () => {
  let userRepo: UserRepository;
  let mockPool: vi.Mocked<Pool>;

  beforeEach(() => {
    mockPool = new Pool() as vi.Mocked<Pool>;
    userRepo = new UserRepository(mockPool);
  });

  describe("findByEmail", () => {
    it("should return user when found", async () => {
      const mockUser = { id: "1", email: "test@test.com" };
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const result = await userRepo.findByEmail("test@test.com");

      expect(result).toEqual(mockUser);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT id, username"),
        ["test@test.com"],
      );
    });

    it("should return null when not found", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await userRepo.findByEmail("notfound@test.com");

      expect(result).toBeNull();
    });
  });

  describe("findByUsername", () => {
    it("should return user when found", async () => {
      const mockUser = { id: "1", username: "testuser" };
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const result = await userRepo.findByUsername("testuser");

      expect(result).toEqual(mockUser);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE username = $1"),
        ["testuser"],
      );
    });
  });

  describe("searchUsers", () => {
    it("should return list of users matching query", async () => {
      const mockUsers = [{ id: "1", username: "testuser" }];
      mockPool.query.mockResolvedValueOnce({ rows: mockUsers } as any);

      const result = await userRepo.searchUsers("test");

      expect(result).toEqual(mockUsers);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("ILIKE $1"),
        ["%test%"],
      );
    });
  });

  describe("findById", () => {
    it("should return user by id", async () => {
      const mockUser = { id: "1" };
      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] } as any);

      const result = await userRepo.findById("1");

      expect(result).toEqual(mockUser);
    });
  });

  describe("create", () => {
    it("should insert user and return created row", async () => {
      const userData = {
        username: "test",
        email: "test@test.com",
        passwordHash: "hash",
        region: "NA",
        country: "USA",
      };

      const createdRow = {
        id: "1",
        username: "test",
        email: "test@test.com",
        role: "PLAYER",
      };
      mockPool.query.mockResolvedValueOnce({ rows: [createdRow] } as any);

      const result = await userRepo.create(userData);

      expect(result).toEqual(createdRow);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users"),
        ["test", "test@test.com", "hash", "NA", "USA"],
      );
    });
  });

  describe("updateLoginAttempts", () => {
    it("should update failed attempts and lock time", async () => {
      const lockedUntil = new Date();
      await userRepo.updateLoginAttempts("1", 5, lockedUntil);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET failed_login_attempts"),
        ["1", 5, lockedUntil],
      );
    });
  });

  describe("resetLoginAttempts", () => {
    it("should reset failed attempts to 0", async () => {
      await userRepo.resetLoginAttempts("1");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE users SET failed_login_attempts = 0, locked_until = NULL",
        ),
        ["1"],
      );
    });
  });

  describe("updateRole", () => {
    it("should update role", async () => {
      await userRepo.updateRole("1", "ADMIN");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET role = $2"),
        ["1", "ADMIN"],
      );
    });
  });

  describe("updateProfile", () => {
    it("should update profile with provided fields", async () => {
      const profileData = {
        avatar_url: "http://avatar",
        bio: "Hello",
      };

      await userRepo.updateProfile("1", profileData);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users SET"),
        ["1", "http://avatar", null, null, "Hello", null, null],
      );
    });
  });
});
