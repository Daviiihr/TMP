export interface Participant {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  player1: Participant | null;
  player2: Participant | null;
  isBye: boolean;
}

/**
 * Genera la estructura inicial de un bracket de torneo (eliminación simple),
 * calculando automáticamente la cantidad de "Byes" necesarios si el número
 * de participantes no es una potencia exacta de 2 (ej. 2, 4, 8, 16, 32...).
 *
 * @param participants Lista de objetos Participant (usuarios o equipos).
 * @returns La estructura del bracket con los emparejamientos iniciales de Ronda 1.
 */
export function generateBracket(participants: Participant[]): Match[] {
  // Si no hay suficientes participantes, retornar vacío
  if (!participants || participants.length === 0) return [];

  // 1. Calcular la siguiente potencia de 2
  const numParticipants = participants.length;
  // Si hay 1 participante, la potencia de 2 es 1. Para torneos requerimos mínimo 2, pero la matemática funciona.
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numParticipants || 1)));

  // 2. Calcular Byes faltantes
  const numByes = nextPowerOf2 - numParticipants;

  // 3. Mezclar aleatoriamente (Shuffle) para que los enfrentamientos no sean predecibles
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  // 4. Separar quiénes obtienen Bye y quiénes juegan la primera ronda real
  const byesList = shuffled.slice(0, numByes);
  const playList = shuffled.slice(numByes);

  const matches: Match[] = [];
  let matchCounter = 1;

  // 5. Generar los partidos que son "Bye" (Pase directo)
  for (let i = 0; i < byesList.length; i++) {
    matches.push({
      id: `match_r1_${matchCounter}`,
      round: 1,
      matchNumber: matchCounter++,
      player1: byesList[i],
      player2: null, // No hay oponente, pase directo
      isBye: true,
    });
  }

  // 6. Generar los enfrentamientos reales (1 vs 1)
  for (let i = 0; i < playList.length; i += 2) {
    if (i + 1 < playList.length) {
      matches.push({
        id: `match_r1_${matchCounter}`,
        round: 1,
        matchNumber: matchCounter++,
        player1: playList[i],
        player2: playList[i + 1],
        isBye: false,
      });
    }
  }

  return matches;
}
