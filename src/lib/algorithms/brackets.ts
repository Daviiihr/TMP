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

  if (!participants || participants.length < 2) return empty;

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
    // Basic Losers Bracket structure (Simplified for this MVP)
    const loserRounds: RoundData[] = [];
    const totalLoserRounds = (totalRounds - 1) * 2;

    // We create placeholder matches for losers
    let matchCount = bracketSize / 4;
    const roundIndex = 1;
    for (let r = 1; r <= totalLoserRounds; r++) {
      const matches: Match[] = [];

      for (let i = 0; i < matchCount; i++) {
        matches.push({
          id: `l_r${r}_m${i + 1}`,
          round: r,
          roundLabel: `Losers Ronda ${r}`,
          matchNumber: i + 1,
          player1: null,
          player2: null,
          isBye: false,
        });
      }
      loserRounds.push({ roundNumber: r, label: `Losers Ronda ${r}`, matches });

      // Adjust match count dynamically based on the round type (minor/major)
      if (r % 2 === 0 && matchCount > 1) {
        matchCount /= 2;
      }
    }

    // Grand final
    rounds.push({
      roundNumber: totalRounds + 1,
      label: "Gran Final",
      matches: [
        {
          id: "grand_final",
          round: totalRounds + 1,
          roundLabel: "Gran Final",
          matchNumber: 1,
          player1: null, // Winner bracket winner
          player2: null, // Loser bracket winner
          isBye: false,
        },
      ],
    });

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
