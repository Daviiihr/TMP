import { describe, it, expect } from "vitest";
import { generateBracket, Participant } from "@/lib/algorithms/brackets";

describe("Brackets Algorithm", () => {
  it("should return empty bracket if less than 4 participants", () => {
    const p: Participant[] = [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
      { id: "3", name: "C" },
    ];
    const result = generateBracket(p);

    expect(result.rounds).toHaveLength(0);
    expect(result.bracketSize).toBe(0);
  });

  it("should generate an 8-player bracket properly seeded", () => {
    const p: Participant[] = Array.from({ length: 8 }, (_, i) => ({
      id: `${i + 1}`,
      name: `P${i + 1}`,
      seed: i + 1,
    }));

    const result = generateBracket(p);

    expect(result.bracketSize).toBe(8);
    expect(result.totalRounds).toBe(3);
    expect(result.rounds).toHaveLength(3); // QF, SF, Final

    const qf = result.rounds[0];
    expect(qf.label).toBe("Cuartos de Final");
    expect(qf.matches).toHaveLength(4);

    // Seeding pattern for 8: 1v8, 4v5, 2v7, 3v6
    expect(qf.matches[0].player1?.seed).toBe(1);
    expect(qf.matches[0].player2?.seed).toBe(8);
    expect(qf.matches[1].player1?.seed).toBe(4);
    expect(qf.matches[1].player2?.seed).toBe(5);
    expect(qf.matches[2].player1?.seed).toBe(2);
    expect(qf.matches[2].player2?.seed).toBe(7);
    expect(qf.matches[3].player1?.seed).toBe(3);
    expect(qf.matches[3].player2?.seed).toBe(6);
  });

  it("should generate double elimination structure when requested", () => {
    const p: Participant[] = Array.from({ length: 4 }, (_, i) => ({
      id: `${i + 1}`,
      name: `P${i + 1}`,
    }));

    const result = generateBracket(p, "DOUBLE_ELIMINATION");

    expect(result.loserRounds).toBeDefined();
    // Rounds: R1, R2, and Grand Final
    expect(result.rounds).toHaveLength(3);
    expect(result.rounds[result.rounds.length - 1].label).toBe("Gran Final");
  });

  it("should handle participants without seeds gracefully", () => {
    const p: Participant[] = [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
      { id: "3", name: "C" },
      { id: "4", name: "D" },
    ];

    const result = generateBracket(p);
    expect(result.bracketSize).toBe(4);
    // Since no seeds, it preserves original order: 1v4, 2v3 (Wait, if no seed, sorting keeps original order, but seed pattern maps to positions).
    // Original positions: 1 at 0, 2 at 1, 3 at 2, 4 at 3
    // Seed pattern for 4: [1, 4, 2, 3]
    // 1st gets 1st (A), 2nd gets 4th (D), 3rd gets 2nd (B), 4th gets 3rd (C)
    // Actually our applySeeding does `slots[i] = sorted[expectedSeed - 1]`
    expect(result.rounds[0].matches).toHaveLength(2);
  });
});
