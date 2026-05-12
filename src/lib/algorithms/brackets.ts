export interface Participant {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  round: number;
  roundLabel: string;
  matchNumber: number;
  player1: Participant | null;
  player2: Participant | null;
  isBye: boolean;       // true = player1 avanza automáticamente (contrincante vacío)
}

export interface BracketResult {
  rounds: RoundData[];         // Todas las rondas del bracket (R1, R2... Final)
  bracketSize: number;         // Potencia de 2 usada
  totalParticipants: number;
  totalRounds: number;
}

export interface RoundData {
  roundNumber: number;
  label: string;
  matches: Match[];
}

/**
 * Genera la estructura COMPLETA de un bracket de eliminación simple.
 *
 * Usa la potencia de 2 SUPERIOR al número de participantes.
 * Los slots vacíos se muestran como contrincantes "vacío" en la primera ronda,
 * y el jugador que queda solo avanza a la siguiente ronda donde su oponente
 * aparece como "Por definir".
 *
 * Ejemplo con 5 jugadores (bracket de 8):
 *   - R1: 4 matches (3 con 2 jugadores reales, 1 con jugador vs vacío)
 *   - R2: 2 matches (ganadores de R1, incluyendo el que avanzó solo)
 *   - Final: 1 match
 */
export function generateBracket(participants: Participant[]): BracketResult {
  const empty: BracketResult = {
    rounds: [],
    bracketSize: 0,
    totalParticipants: 0,
    totalRounds: 0,
  };

  if (!participants || participants.length < 2) return empty;

  const numParticipants = participants.length;

  // 1. Mezclar aleatoriamente
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  // 2. Potencia de 2 SUPERIOR (o igual si ya es potencia)
  const bracketSize = isPowerOf2(numParticipants)
    ? numParticipants
    : Math.pow(2, Math.ceil(Math.log2(numParticipants)));

  const totalRounds = Math.log2(bracketSize);

  // 3. Llenar los slots del bracket: jugadores reales + nulls para los vacíos
  const slots: (Participant | null)[] = [];
  for (let i = 0; i < bracketSize; i++) {
    slots.push(i < shuffled.length ? shuffled[i] : null);
  }

  // 4. Generar TODAS las rondas
  const rounds: RoundData[] = [];

  // --- Ronda 1: emparejar los slots ---
  const r1Matches: Match[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    const p1 = slots[i];
    const p2 = slots[i + 1];
    const isBye = p1 === null || p2 === null;

    r1Matches.push({
      id: `r1_m${i / 2 + 1}`,
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

  // --- Rondas siguientes (R2 hasta Final) ---
  for (let r = 2; r <= totalRounds; r++) {
    const prevMatches = rounds[r - 2].matches;
    const currentMatches: Match[] = [];

    for (let i = 0; i < prevMatches.length; i += 2) {
      const feederA = prevMatches[i];
      const feederB = prevMatches[i + 1];

      // Si un feeder es Bye, el ganador es el jugador real de ese match
      const winnerA = feederA.isBye
        ? (feederA.player1 || feederA.player2)
        : null; // null = "Por definir" (aún no se jugó)

      const winnerB = feederB.isBye
        ? (feederB.player1 || feederB.player2)
        : null;

      const isBye = (winnerA !== null && winnerB !== null) && (winnerA === null || winnerB === null);

      currentMatches.push({
        id: `r${r}_m${i / 2 + 1}`,
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

  return {
    rounds,
    bracketSize,
    totalParticipants: numParticipants,
    totalRounds,
  };
}

/** Verifica si un número es potencia exacta de 2 */
function isPowerOf2(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/** Devuelve un nombre legible para la ronda según el tamaño del bracket */
function getRoundLabel(bracketSize: number, round: number): string {
  const totalRounds = Math.log2(bracketSize);
  const roundsFromFinal = totalRounds - round;

  if (roundsFromFinal === 0) return "Final";
  if (roundsFromFinal === 1) return "Semifinal";
  if (roundsFromFinal === 2) return "Cuartos de Final";
  return `Ronda ${round}`;
}
