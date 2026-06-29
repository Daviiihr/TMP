"use client";

import { useState, useEffect } from "react";
import { BracketResult, RoundData, Match, Participant } from "@/lib/algorithms/brackets";
import "./bracket-view.css";

interface BracketViewProps {
  result: BracketResult;
}

function MatchCard({ 
  match, 
  onAdvance 
}: { 
  match: Match; 
  onAdvance?: (match: Match, winner: Participant) => void 
}) {
  const p1 = match.player1;
  const p2 = match.player2;
  const isBye = match.isBye;

  const p1Label = p1?.name || "Por definir";
  const p2Label = p2?.name || (isBye ? "— vacío —" : "Por definir");
  const isP1Empty = !p1;
  const isP2Empty = !p2;

  const handleDoubleClickP1 = () => {
    if (p1 && onAdvance && !isBye) onAdvance(match, p1);
  };
  
  const handleDoubleClickP2 = () => {
    if (p2 && onAdvance && !isBye) onAdvance(match, p2);
  };

  const interactiveClass = (hasPlayer: boolean) => 
    hasPlayer && !isBye && onAdvance ? "cursor-pointer hover:bg-white/10 transition-colors" : "";

  return (
    <div className={`match-card ${isBye ? "match-card--bye" : ""}`}>
      <div 
        className={`match-player match-player--top ${isP1Empty ? "match-player--empty" : ""} ${interactiveClass(!!p1)}`}
        onDoubleClick={handleDoubleClickP1}
        title={p1 && !isBye && onAdvance ? "Doble clic para avanzar" : undefined}
      >
        {p1Label}
      </div>
      <div className="match-divider" />
      <div 
        className={`match-player match-player--bottom ${isP2Empty ? "match-player--empty" : ""} ${interactiveClass(!!p2)}`}
        onDoubleClick={handleDoubleClickP2}
        title={p2 && !isBye && onAdvance ? "Doble clic para avanzar" : undefined}
      >
        {p2Label}
      </div>
    </div>
  );
}

function RoundColumn({ round, isRight, onAdvance }: { round: RoundData; isRight: boolean; onAdvance?: (match: Match, winner: Participant) => void }) {
  return (
    <div className="bracket-round">
      <div className="round-label">{round.label}</div>
      <div className="round-matches">
        {round.matches.map((m) => (
          <div key={m.id} className="bracket-match-wrapper">
            {isRight && <div className="connector-line" />}
            <MatchCard match={m} onAdvance={onAdvance} />
            {!isRight && <div className="connector-line" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BracketView({ result }: BracketViewProps) {
  const [localResult, setLocalResult] = useState<BracketResult>(result);
  const [champion, setChampion] = useState<Participant | null>(null);

  // Sincronizar si cambia el prop
  useEffect(() => {
    setLocalResult(result);
    setChampion(null);
  }, [result]);

  if (!localResult || localResult.rounds.length === 0) return null;

  const handleAdvance = (match: Match, winner: Participant) => {
    if (!match.nextMatchId) {
      // Es la final, seteamos al campeón
      setChampion(winner);
      return; 
    }
    
    setLocalResult(prev => {
      // Deep clone para poder modificar sin mutar el original
      const next = JSON.parse(JSON.stringify(prev)) as BracketResult;
      
      let nextMatch: Match | undefined;
      
      // Buscar el siguiente match en ganadores
      for (const r of next.rounds) {
        nextMatch = r.matches.find(m => m.id === match.nextMatchId);
        if (nextMatch) break;
      }
      
      // Si no está en ganadores, buscar en perdedores
      if (!nextMatch && next.loserRounds) {
        for (const r of next.loserRounds) {
          nextMatch = r.matches.find(m => m.id === match.nextMatchId);
          if (nextMatch) break;
        }
      }
      
      // Asignar al slot correspondiente
      if (nextMatch) {
        if (match.nextMatchSlot === 1) nextMatch.player1 = winner;
        else nextMatch.player2 = winner;
      }
      
      return next;
    });
  };

  const { rounds, totalRounds } = localResult;

  // Render para brackets de solo 1 ronda (ej. 2 jugadores)
  if (totalRounds === 1) {
    const finalRound = rounds[0];
    return (
      <div className="bracket-wrapper">
        <div className="bracket-container bracket-container--single">
          <div className="bracket-final">
            <div className="final-trophy">🏆</div>
            <MatchCard match={finalRound.matches[0]} onAdvance={handleAdvance} />
            <p className="final-label">FINAL</p>
          </div>
        </div>
        {champion && (
          <div className="champion-banner">
            <h2 className="champion-title">¡CAMPEÓN!</h2>
            <div className="champion-name">👑 {champion.name} 👑</div>
          </div>
        )}
      </div>
    );
  }

  const leftRounds: RoundData[] = [];
  const rightRounds: RoundData[] = [];

  for (let i = 0; i < rounds.length - 1; i++) {
    const round = rounds[i];
    const half = Math.ceil(round.matches.length / 2);
    leftRounds.push({ ...round, matches: round.matches.slice(0, half) });
    rightRounds.push({ ...round, matches: round.matches.slice(half) });
  }

  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound.matches[0];

  return (
    <div className="bracket-wrapper">
      <div className="bracket-section-title">Llave de Ganadores</div>
      <div className="bracket-container">
        {/* Left half */}
        <div className="half-bracket half-bracket--left">
          {leftRounds.map((round, ri) => (
            <RoundColumn key={ri} round={round} isRight={false} onAdvance={handleAdvance} />
          ))}
        </div>

        {/* Final */}
        <div className="bracket-final relative">
          <div className="final-trophy">🏆</div>
          <MatchCard match={finalMatch} onAdvance={handleAdvance} />
          <p className="final-label">FINAL</p>
        </div>

        {/* Right half (mirrored) */}
        <div className="half-bracket half-bracket--right">
          {rightRounds.map((round, ri) => (
            <RoundColumn key={ri} round={round} isRight={true} onAdvance={handleAdvance} />
          ))}
        </div>
      </div>

      {champion && (
        <div className="champion-banner mt-10">
          <h2 className="champion-title">¡CAMPEÓN DEL TORNEO!</h2>
          <div className="champion-name">👑 {champion.name} 👑</div>
        </div>
      )}

      {localResult.loserRounds && localResult.loserRounds.length > 0 && (
        <>
          <div className="bracket-divider"></div>
          <div className="bracket-section-title loser-title">Llave de Perdedores</div>
          <div className="bracket-container loser-container">
            {localResult.loserRounds.map((round, ri) => (
              <RoundColumn key={ri} round={round} isRight={false} onAdvance={handleAdvance} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
