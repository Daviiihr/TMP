export interface Participant {
  id: string;
  name: string;
  seed?: number; // Added seed for smart seeding
}

export interface Match {
  id: string;
  round: number;
  roundLabel: string;
  matchNumber: number;
  player1: Participant | null;
  player2: Participant | null;
  isBye: boolean; // true = player1 avanza automáticamente (contrincante vacío)
  nextMatchId?: string; // reference to next match
  nextMatchSlot?: 1 | 2; // slot in next match
  loserNextMatchId?: string; // where the loser goes (for double elimination)
  loserNextMatchSlot?: 1 | 2;
  score1?: number; // Added for advanced scoring
  score2?: number;
}

export interface BracketResult {
  rounds: RoundData[]; // Todas las rondas del bracket de ganadores (R1, R2... Final)
  loserRounds?: RoundData[]; // Rondas del bracket de perdedores
  bracketSize: number; // Potencia de 2 usada
  totalParticipants: number;
  totalRounds: number;
}

export interface RoundData {
  roundNumber: number;
  label: string;
  matches: Match[];
}

/**
 * Ordena participantes según su seed en un formato 1 vs N, 2 vs N-1, etc.
 */
function applySeeding(
  participants: Participant[],
  bracketSize: number,
): (Participant | null)[] {
  // Sort participants by seed (if available, otherwise random/original order)
  const sorted = [...participants].sort((a, b) => {
    if (a.seed !== undefined && b.seed !== undefined) return a.seed - b.seed;
    return 0; // maintain original if no seeds
  });

  const slots: (Participant | null)[] = new Array(bracketSize).fill(null);

  // Fill the first positions using standard bracket seeding pattern
  const seedPattern = generateSeedPattern(bracketSize);
  for (let i = 0; i < bracketSize; i++) {
    const expectedSeed = seedPattern[i];
    if (expectedSeed <= sorted.length) {
      slots[i] = sorted[expectedSeed - 1]; // sorted is 0-indexed
    } else {
      slots[i] = null; // BYE
    }
  }

  return slots;
}

/**
 * Genera el patrón de seeding. Para 8: [1, 8, 4, 5, 2, 7, 3, 6]
 */
function generateSeedPattern(size: number): number[] {
  let pattern = [1, 2];
  while (pattern.length < size) {
    const nextPattern = [];
    const sum = pattern.length * 2 + 1;
    for (let i = 0; i < pattern.length; i++) {
      nextPattern.push(pattern[i]);
      nextPattern.push(sum - pattern[i]);
    }
    pattern = nextPattern;
  }
  return pattern;
}

/**
 * Genera la estructura de un bracket.
 */
export function generateBracket(
  participants: Participant[],
  type: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" = "SINGLE_ELIMINATION",
): BracketResult {
  const empty: BracketResult = {
    rounds: [],
    bracketSize: 0,
    totalParticipants: 0,
    totalRounds: 0,
  };

  if (!participants || participants.length < 4) return empty;

  const numParticipants = participants.length;
  const bracketSize = isPowerOf2(numParticipants)
    ? numParticipants
    : Math.pow(2, Math.ceil(Math.log2(numParticipants)));

  const totalRounds = Math.log2(bracketSize);
  const slots = applySeeding(participants, bracketSize);

  // --- Bracket de Ganadores (Winners) ---
  const rounds: RoundData[] = [];
  const r1Matches: Match[] = [];

  // Ronda 1
  for (let i = 0; i < slots.length; i += 2) {
    const p1 = slots[i];
    const p2 = slots[i + 1];
    const isBye = p1 === null || p2 === null;

    r1Matches.push({
      id: `w_r1_m${i / 2 + 1}`,
      round: 1,
      roundLabel: getRoundLabel(bracketSize, 1),
      matchNumber: i / 2 + 1,
      player1: p1,
      player2: p2,
      isBye,
    });
  }
  rounds.push({
    roundNumber: 1,
    label: getRoundLabel(bracketSize, 1),
    matches: r1Matches,
  });

  // Rondas siguientes (Winners)
  for (let r = 2; r <= totalRounds; r++) {
    const prevMatches = rounds[r - 2].matches;
    const currentMatches: Match[] = [];

    for (let i = 0; i < prevMatches.length; i += 2) {
      const feederA = prevMatches[i];
      const feederB = prevMatches[i + 1];

      const winnerA = feederA.isBye ? feederA.player1 || feederA.player2 : null;
      const winnerB = feederB.isBye ? feederB.player1 || feederB.player2 : null;

      const newMatchId = `w_r${r}_m${i / 2 + 1}`;

      // Update feeders
      feederA.nextMatchId = newMatchId;
      feederA.nextMatchSlot = 1;
      feederB.nextMatchId = newMatchId;
      feederB.nextMatchSlot = 2;

      currentMatches.push({
        id: newMatchId,
        round: r,
        roundLabel: getRoundLabel(bracketSize, r),
        matchNumber: i / 2 + 1,
        player1: winnerA,
        player2: winnerB,
        isBye: false,
      });
    }

    rounds.push({
      roundNumber: r,
      label: getRoundLabel(bracketSize, r),
      matches: currentMatches,
    });
  }

  const result: BracketResult = {
    rounds,
    bracketSize,
    totalParticipants: numParticipants,
    totalRounds,
  };

  if (type === "DOUBLE_ELIMINATION") {
    const loserRounds: RoundData[] = [];
    const totalLoserRounds = (totalRounds - 1) * 2;
    let matchCount = bracketSize / 4;

    // First pass: Create all empty loser matches
    for (let r = 1; r <= totalLoserRounds; r++) {
      const matches: Match[] = [];
      for (let i = 0; i < matchCount; i++) {
        matches.push({
          id: `l_r${r}_m${i + 1}`,
          round: r,
          roundLabel: getLoserRoundLabel(totalLoserRounds, r),
          matchNumber: i + 1,
          player1: null,
          player2: null,
          isBye: false,
        });
      }
      loserRounds.push({
        roundNumber: r,
        label: getLoserRoundLabel(totalLoserRounds, r),
        matches,
      });

      if (r % 2 === 0 && matchCount > 1) {
        matchCount /= 2;
      }
    }

    // Second pass: Link Loser -> Loser
    for (let r = 1; r < totalLoserRounds; r++) {
      const currentMatches = loserRounds[r - 1].matches;
      if (r % 2 !== 0) {
        // Odd round (L1 -> L2): 1 to 1 mapping
        for (let i = 0; i < currentMatches.length; i++) {
          currentMatches[i].nextMatchId = loserRounds[r].matches[i].id;
          currentMatches[i].nextMatchSlot = 1;
        }
      } else {
        // Even round (L2 -> L3): 2 to 1 mapping
        for (let i = 0; i < currentMatches.length; i += 2) {
          const targetIndex = Math.floor(i / 2);
          currentMatches[i].nextMatchId =
            loserRounds[r].matches[targetIndex].id;
          currentMatches[i].nextMatchSlot = 1;
          currentMatches[i + 1].nextMatchId =
            loserRounds[r].matches[targetIndex].id;
          currentMatches[i + 1].nextMatchSlot = 2;
        }
      }
    }

    // Third pass: Link Winner Losers -> Loser Bracket
    // W1 losers -> L1
    const w1Matches = rounds[0].matches;
    for (let i = 0; i < w1Matches.length; i += 2) {
      const targetIndex = Math.floor(i / 2);
      w1Matches[i].loserNextMatchId = loserRounds[0].matches[targetIndex].id;
      w1Matches[i].loserNextMatchSlot = 1;
      w1Matches[i + 1].loserNextMatchId =
        loserRounds[0].matches[targetIndex].id;
      w1Matches[i + 1].loserNextMatchSlot = 2;
    }

    // For W2 and above, losers drop into even L rounds: L2, L4, L6...
    for (let w = 2; w <= totalRounds; w++) {
      const wMatches = rounds[w - 1].matches;
      const targetLoserRoundIdx = 2 * w - 2 - 1; // 0-indexed
      const lMatches = loserRounds[targetLoserRoundIdx].matches;

      for (let i = 0; i < wMatches.length; i++) {
        // Crossover dropping to avoid rematches
        const targetIndex = lMatches.length - 1 - i;
        wMatches[i].loserNextMatchId = lMatches[targetIndex].id;
        wMatches[i].loserNextMatchSlot = 2;
      }
    }

    // Grand final
    const grandFinal: Match = {
      id: "grand_final",
      round: totalRounds + 1,
      roundLabel: "Gran Final",
      matchNumber: 1,
      player1: null,
      player2: null,
      isBye: false,
    };
    rounds.push({
      roundNumber: totalRounds + 1,
      label: "Gran Final",
      matches: [grandFinal],
    });

    // Link Winner Final winner -> Grand Final
    const winnerFinalMatch = rounds[totalRounds - 1].matches[0];
    winnerFinalMatch.nextMatchId = grandFinal.id;
    winnerFinalMatch.nextMatchSlot = 1;

    // Link Loser Final winner -> Grand Final
    if (totalLoserRounds > 0) {
      const loserFinalMatch = loserRounds[totalLoserRounds - 1].matches[0];
      loserFinalMatch.nextMatchId = grandFinal.id;
      loserFinalMatch.nextMatchSlot = 2;
    }

    result.loserRounds = loserRounds;
  }

  return result;
}

function isPowerOf2(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function getRoundLabel(bracketSize: number, round: number): string {
  const totalRounds = Math.log2(bracketSize);
  const roundsFromFinal = totalRounds - round;

  if (roundsFromFinal === 0) return "Final";
  if (roundsFromFinal === 1) return "Semifinal";
  if (roundsFromFinal === 2) return "Cuartos de Final";
  return `Ronda ${round}`;
}

function getLoserRoundLabel(totalLoserRounds: number, round: number): string {
  const roundsFromFinal = totalLoserRounds - round;
  if (roundsFromFinal === 0) return "Final Perdedores";
  if (roundsFromFinal === 1) return "Semifinal Perdedores";
  if (roundsFromFinal === 2) return "Cuartos Perdedores";
  return `Losers Ronda ${round}`;
}
