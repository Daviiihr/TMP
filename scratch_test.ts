import { generateBracket, Participant } from './src/lib/algorithms/brackets';

const testParticipants: Participant[] = [
  { id: '1', name: 'Jugador 1' },
  { id: '2', name: 'Jugador 2' },
  { id: '3', name: 'Jugador 3' },
  { id: '4', name: 'Jugador 4' },
  { id: '5', name: 'Jugador 5' },
];

console.log('--- TEST: 5 Participantes ---');
const matches = generateBracket(testParticipants);

matches.forEach(m => {
  if (m.isBye) {
    console.log(`[Ronda ${m.round} - Match ${m.matchNumber}] ${m.player1?.name} obtiene BYE (Pase libre a Ronda 2)`);
  } else {
    console.log(`[Ronda ${m.round} - Match ${m.matchNumber}] ${m.player1?.name} vs ${m.player2?.name}`);
  }
});

console.log(`\nTotal de enfrentamientos en Ronda 1: ${matches.length}`);
