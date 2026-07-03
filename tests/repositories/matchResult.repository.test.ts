import { describe, it, expect, vi, beforeEach } from "vitest";
import { MatchResultRepository } from "@/repositories/matchResult.repository";
import { Pool } from "pg";

describe("MatchResultRepository", () => {
  let mockPool: any;
  let repository: MatchResultRepository;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    repository = new MatchResultRepository(mockPool as unknown as Pool);
  });

  describe("reportResult", () => {
    it("should insert or update match result and update match status", async () => {
      const mockResultRow = {
        id: "result-1",
        match_id: "match-1",
        score_participant1: 2,
        score_participant2: 1,
        status: "PENDING",
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockResultRow] }) // INSERT/UPDATE match_results
        .mockResolvedValueOnce({ rows: [] }); // UPDATE matches

      const result = await repository.reportResult("match-1", 2, 1);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("INSERT INTO match_results"),
        ["match-1", 2, 1],
      );
      expect(mockPool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE matches SET status = 'PENDING_REVIEW'"),
        ["match-1"],
      );
      expect(result).toEqual(mockResultRow);
    });
  });

  describe("getPendingResults", () => {
    it("should fetch pending validation rows joined with matches and tournaments", async () => {
      const mockRows = [
        {
          validation_id: "val-1",
          match_id: "match-1",
          score_participant1: 2,
          score_participant2: 0,
          participant1_name: "A",
          participant2_name: "B",
          tournament_name: "T1",
        },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: mockRows });

      const results = await repository.getPendingResults();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("mr.status = 'PENDING'"),
      );
      expect(results).toEqual(mockRows);
    });
  });

  describe("updateStatus", () => {
    it("should update status to APPROVED and return the row", async () => {
      const mockResultRow = {
        id: "val-1",
        match_id: "match-1",
        status: "APPROVED",
      };
      mockPool.query.mockResolvedValueOnce({ rows: [mockResultRow] });

      const result = await repository.updateStatus("val-1", "APPROVED");

      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE match_results"),
        ["APPROVED", null, "val-1"],
      );
      expect(result).toEqual(mockResultRow);
    });

    it("should update status to REJECTED with reason and update matches status", async () => {
      const mockResultRow = {
        id: "val-1",
        match_id: "match-1",
        status: "REJECTED",
        rejection_reason: "Bad proof",
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockResultRow] }) // UPDATE match_results
        .mockResolvedValueOnce({ rows: [] }); // UPDATE matches

      const result = await repository.updateStatus(
        "val-1",
        "REJECTED",
        "Bad proof",
      );

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("UPDATE match_results"),
        ["REJECTED", "Bad proof", "val-1"],
      );
      expect(mockPool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE matches SET status = 'IN_PROGRESS'"),
        ["match-1"],
      );
      expect(result).toEqual(mockResultRow);
    });

    it("should return null if validation id does not exist", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await repository.updateStatus("non-existent", "APPROVED");

      expect(result).toBeNull();
      expect(mockPool.query).toHaveBeenCalledTimes(1); // Should not try to update matches
    });
  });
});
