import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RankingObserver } from "@/observers/ranking.observer";
import { RankingService } from "@/services/ranking.service";
import { Pool } from "pg";

vi.mock("@/services/ranking.service");

describe("RankingObserver", () => {
  let mockRankingService: vi.Mocked<RankingService>;
  let mockPool: any;
  let observer: RankingObserver;

  beforeEach(() => {
    mockRankingService = new RankingService() as vi.Mocked<RankingService>;
    mockRankingService.recalculateUserStats.mockResolvedValue();

    mockPool = {
      query: vi.fn(),
    };

    observer = new RankingObserver(
      mockRankingService,
      mockPool as unknown as Pool,
    );
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should do nothing if match is not found", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await observer.update("match:resultApproved", { matchId: "invalid-id" });

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(mockRankingService.recalculateUserStats).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("no encontrado"),
    );
  });

  it("should recalculate stats for individual match participants", async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          participant1_id: "user-1",
          participant2_id: "user-2",
          type: "INDIVIDUAL",
        },
      ],
    });

    await observer.update("match:resultApproved", { matchId: "match-1" });

    expect(mockRankingService.recalculateUserStats).toHaveBeenCalledTimes(2);
    expect(mockRankingService.recalculateUserStats).toHaveBeenCalledWith(
      "user-1",
    );
    expect(mockRankingService.recalculateUserStats).toHaveBeenCalledWith(
      "user-2",
    );
  });

  it("should recalculate stats for team match participants", async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [
          {
            participant1_id: "team-1",
            participant2_id: "team-2",
            type: "TEAM",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { user_id: "user-1" },
          { user_id: "user-2" },
          { user_id: "user-3" },
        ],
      });

    await observer.update("match:resultApproved", { matchId: "match-2" });

    expect(mockPool.query).toHaveBeenCalledTimes(2);
    expect(mockRankingService.recalculateUserStats).toHaveBeenCalledTimes(3);
    expect(mockRankingService.recalculateUserStats).toHaveBeenCalledWith(
      "user-1",
    );
    expect(mockRankingService.recalculateUserStats).toHaveBeenCalledWith(
      "user-2",
    );
    expect(mockRankingService.recalculateUserStats).toHaveBeenCalledWith(
      "user-3",
    );
  });

  it("should handle errors gracefully", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("DB Connection Failed"));

    await observer.update("match:resultApproved", { matchId: "match-err" });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Error al procesar"),
      expect.any(Error),
    );
  });
});
