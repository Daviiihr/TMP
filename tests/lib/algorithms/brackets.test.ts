import { describe, it, expect } from "vitest";
import { generateBracket, Participant } from "@/lib/algorithms/brackets";

describe("Brackets Algorithm", () => {
  it("should return empty bracket if less than 2 participants", () => {
    const p: Participant[] = [{ id: "1", name: "A" }];
    const result = generateBracket(p);

    expect(result.rounds).toHaveLength(0);
    expect(result.bracketSize).toBe(0);
  });

  it("should generate a 2-player single elimination bracket (Power of 2)", () => {
    const p: Participant[] = [
      { id: "1", name: "Player 1" },
      { id: "2", name: "Player 2" },
    ];

    const result = generateBracket(p);

    expect(result.bracketSize).toBe(2);
    expect(result.totalRounds).toBe(1);
    expect(result.rounds).toHaveLength(1);

    const finalRound = result.rounds[0];
    expect(finalRound.label).toBe("Final");
    expect(finalRound.matches).toHaveLength(1);
    expect(finalRound.matches[0].player1?.id).toBe("1");
    expect(finalRound.matches[0].player2?.id).toBe("2");
    expect(finalRound.matches[0].isBye).toBe(false);
  });

  it("should generate a 3-player single elimination bracket with a Bye", () => {
    const p: Participant[] = [
      { id: "1", name: "Player 1", seed: 1 },
      { id: "2", name: "Player 2", seed: 2 },
      { id: "3", name: "Player 3", seed: 3 },
    ];

    const result = generateBracket(p);

    // Nearest power of 2 >= 3 is 4
    expect(result.bracketSize).toBe(4);
    expect(result.totalRounds).toBe(2);
    expect(result.rounds).toHaveLength(2); // Semifinals + Final

    const round1 = result.rounds[0];
    expect(round1.matches).toHaveLength(2);

    // Seed 1 vs Seed 4 (Bye)
    expect(round1.matches[0].player1?.seed).toBe(1);
    expect(round1.matches[0].player2).toBeNull(); // BYE
    expect(round1.matches[0].isBye).toBe(true);

    // Seed 2 vs Seed 3
    expect(round1.matches[1].player1?.seed).toBe(2);
    expect(round1.matches[1].player2?.seed).toBe(3);
    expect(round1.matches[1].isBye).toBe(false);

    const round2 = result.rounds[1];
    expect(round2.label).toBe("Final");
    expect(round2.matches).toHaveLength(1);
    // Player 1 advances automatically due to Bye
    expect(round2.matches[0].player1?.seed).toBe(1);
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
