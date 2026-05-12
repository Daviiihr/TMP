import { generateBracket, Participant } from './src/lib/algorithms/brackets';

const testCases = [
  { name: "3 jugadores", count: 3 },
  { name: "5 jugadores", count: 5 },
  { name: "7 jugadores", count: 7 },
  { name: "8 jugadores (potencia exacta)", count: 8 },
  { name: "10 jugadores", count: 10 },
];

for (const tc of testCases) {
  const players: Participant[] = Array.from({ length: tc.count }, (_, i) => ({
    id: String(i + 1),
    name: `Jugador ${i + 1}`,
  }));

  console.log(`\n========== TEST: ${tc.name} ==========`);
  const result = generateBracket(players);
  console.log(`Bracket size: ${result.bracketSize} | Rondas: ${result.totalRounds}`);

  for (const round of result.rounds) {
    console.log(`\n  🏆 ${round.label} (${round.matches.length} partidos):`);
    round.matches.forEach(m => {
      const p1 = m.player1?.name || '(vacío)';
      const p2 = m.player2?.name || (m.isBye ? '— vacío —' : '(Por definir)');
      const bye = m.isBye ? ' [BYE]' : '';
      console.log(`    Match ${m.matchNumber}: ${p1} vs ${p2}${bye}`);
    });
  }
}
