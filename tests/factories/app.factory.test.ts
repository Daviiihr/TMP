import { describe, it, expect, vi } from "vitest";
import { appFactory, AppFactory } from "@/factories/app.factory";

// Mock dependencies
vi.mock("@/lib/database", () => ({
  getPostgresPool: vi.fn(() => ({})),
}));

describe("AppFactory", () => {
  it("should initialize and register observers", () => {
    const factory = new AppFactory();
    expect(factory.getEventEmitter()).toBeDefined();
  });

  it("should create repositories", () => {
    expect(appFactory.createUserRepository()).toBeDefined();
    expect(appFactory.createTeamRepository()).toBeDefined();
    expect(appFactory.createTournamentRepository()).toBeDefined();
    expect(appFactory.createRankingRepository()).toBeDefined();
  });

  it("should create services", () => {
    expect(appFactory.createAuthService()).toBeDefined();
    expect(appFactory.createAuthValidator()).toBeDefined();
    expect(appFactory.createTeamService()).toBeDefined();
    expect(appFactory.createTournamentService()).toBeDefined();
    expect(appFactory.createEnrollmentService()).toBeDefined();
    expect(appFactory.createRankingService()).toBeDefined();
  });

  it("should return postgres pool", () => {
    expect(appFactory.createPostgresPool()).toBeDefined();
  });
});
