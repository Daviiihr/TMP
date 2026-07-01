"use client";

import { useState, useEffect } from "react";
import { BracketResult, RoundData, Match, Participant } from "@/lib/algorithms/brackets";
import "./bracket-view.css";

interface BracketViewProps {
  result: BracketResult;
  onMatchUpdate?: (matchId: string, winnerId: string, score1?: number, score2?: number) => Promise<void>;
  onMatchUndo?: (matchId: string) => Promise<void>;
}

function MatchCard({ 
  match, 
  onMatchClick 
}: { 
  match: Match; 
  onMatchClick?: (match: Match) => void 
}) {
  const p1 = match.player1;
  const p2 = match.player2;
  const isBye = match.isBye;
  
  // Extend type to get extra properties dynamically added
  const extendedMatch = match as any;
  const status = extendedMatch.status || 'PENDING';
  const winnerId = extendedMatch.winnerId || null;

  const p1Label = p1?.name || "Por definir";
  const p2Label = p2?.name || (isBye ? "— vacío —" : "Por definir");
  const isP1Empty = !p1;
  const isP2Empty = !p2;

  const handleClick = () => {
    if (onMatchClick && !isBye && p1 && p2) {
      onMatchClick(match);
    } else if (onMatchClick && status === 'FINISHED' && !isBye) {
      // Also allow clicking finished matches to undo
      onMatchClick(match);
    }
  };

  const interactiveClass = 
    onMatchClick && !isBye && p1 && p2 ? "cursor-pointer hover:border-white/40 transition-colors" : "";

  return (
    <div 
      className={`match-card ${isBye ? "match-card--bye" : ""} ${interactiveClass}`}
      onClick={handleClick}
      title={interactiveClass ? "Clic para reportar resultado" : undefined}
    >
      <div className={`match-player match-player--top ${isP1Empty ? "match-player--empty" : ""} ${winnerId === p1?.id ? "text-green-400 font-bold" : ""}`}>
        <span className="truncate">{p1Label}</span>
        {match.score1 !== undefined && <span className="ml-auto font-mono bg-black/40 px-2 rounded">{match.score1}</span>}
      </div>
      <div className="match-divider" />
      <div className={`match-player match-player--bottom ${isP2Empty ? "match-player--empty" : ""} ${winnerId === p2?.id ? "text-green-400 font-bold" : ""}`}>
        <span className="truncate">{p2Label}</span>
        {match.score2 !== undefined && <span className="ml-auto font-mono bg-black/40 px-2 rounded">{match.score2}</span>}
      </div>
    </div>
  );
}

function RoundColumn({ round, isRight, onMatchClick }: { round: RoundData; isRight: boolean; onMatchClick?: (match: Match) => void }) {
  return (
    <div className="bracket-round">
      <div className="round-label">{round.label}</div>
      <div className="round-matches">
        {round.matches.map((m) => (
          <div key={m.id} className="bracket-match-wrapper">
            {isRight && <div className="connector-line" />}
            <MatchCard match={m} onMatchClick={onMatchClick} />
            {!isRight && <div className="connector-line" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BracketView({ result, onMatchUpdate, onMatchUndo }: BracketViewProps) {
  const [localResult, setLocalResult] = useState<BracketResult>(result);
  const [champion, setChampion] = useState<Participant | null>(null);
  
  // Modal State
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [selectedWinnerId, setSelectedWinnerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar si cambia el prop
  useEffect(() => {
    setLocalResult(result);
    
    // Determinar al campeón si el último partido de la llave principal tiene ganador
    if (result.rounds.length > 0) {
      const finalRound = result.rounds[result.rounds.length - 1];
      const finalMatch = finalRound.matches[0];
      const winnerId = (finalMatch as any).winnerId;
      
      if (winnerId) {
        if (finalMatch.player1?.id === winnerId) {
          setChampion(finalMatch.player1);
        } else if (finalMatch.player2?.id === winnerId) {
          setChampion(finalMatch.player2);
        } else {
          setChampion(null);
        }
      } else {
        setChampion(null);
      }
    } else {
      setChampion(null);
    }
  }, [result]);

  if (!localResult || localResult.rounds.length === 0) return null;

  const handleMatchClick = (match: Match) => {
    if (!onMatchUpdate) return;
    setSelectedMatch(match);
    setScore1(match.score1?.toString() || "");
    setScore2(match.score2?.toString() || "");
    setSelectedWinnerId((match as any).winnerId || "");
  };

  useEffect(() => {
    if (score1 && score2 && selectedMatch) {
      const s1 = parseInt(score1);
      const s2 = parseInt(score2);
      if (!isNaN(s1) && !isNaN(s2)) {
        if (s1 > s2) setSelectedWinnerId(selectedMatch.player1?.id || "");
        else if (s2 > s1) setSelectedWinnerId(selectedMatch.player2?.id || "");
      }
    }
  }, [score1, score2, selectedMatch]);

  const submitMatchResult = async () => {
    if (!selectedMatch || !onMatchUpdate || !selectedWinnerId) return;
    setIsSubmitting(true);
    try {
      const s1 = score1 ? parseInt(score1) : undefined;
      const s2 = score2 ? parseInt(score2) : undefined;
      await onMatchUpdate(selectedMatch.id, selectedWinnerId, s1, s2);
      setSelectedMatch(null);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar partido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const undoMatchResult = async () => {
    if (!selectedMatch || !onMatchUndo) return;
    setIsSubmitting(true);
    try {
      await onMatchUndo(selectedMatch.id);
      setSelectedMatch(null);
    } catch (err) {
      console.error(err);
      alert("Error al deshacer partido");
    } finally {
      setIsSubmitting(false);
    }
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
            <MatchCard match={finalRound.matches[0]} onMatchClick={handleMatchClick} />
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
            <RoundColumn key={ri} round={round} isRight={false} onMatchClick={handleMatchClick} />
          ))}
        </div>

        {/* Final */}
        <div className="bracket-final relative">
          <div className="final-trophy">🏆</div>
          <MatchCard match={finalMatch} onMatchClick={handleMatchClick} />
          <p className="final-label">FINAL</p>
        </div>

        {/* Right half (mirrored) */}
        <div className="half-bracket half-bracket--right">
          {rightRounds.map((round, ri) => (
            <RoundColumn key={ri} round={round} isRight={true} onMatchClick={handleMatchClick} />
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
              <RoundColumn key={ri} round={round} isRight={false} onMatchClick={handleMatchClick} />
            ))}
          </div>
        </>
      )}

      {/* MATCH SCORE MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 shadow-2xl max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4 text-center">Reportar Resultado</h3>
            <p className="text-white/60 text-sm mb-4 text-center">Ronda {selectedMatch.round}</p>
            
            <div className="flex flex-col gap-4 mb-6">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedWinnerId === selectedMatch.player1?.id ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:bg-white/5'}`}>
                <input type="radio" name="winner" className="hidden" 
                  checked={selectedWinnerId === selectedMatch.player1?.id} 
                  onChange={() => setSelectedWinnerId(selectedMatch.player1?.id || "")} />
                <span className="flex-1 font-medium">{selectedMatch.player1?.name}</span>
                <input type="number" placeholder="Puntos" className="w-20 bg-black/40 border border-white/10 rounded p-1 text-center" 
                  value={score1} onChange={(e) => setScore1(e.target.value)} onClick={e => e.stopPropagation()} />
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedWinnerId === selectedMatch.player2?.id ? 'border-green-500 bg-green-500/10' : 'border-white/10 hover:bg-white/5'}`}>
                <input type="radio" name="winner" className="hidden" 
                  checked={selectedWinnerId === selectedMatch.player2?.id} 
                  onChange={() => setSelectedWinnerId(selectedMatch.player2?.id || "")} />
                <span className="flex-1 font-medium">{selectedMatch.player2?.name}</span>
                <input type="number" placeholder="Puntos" className="w-20 bg-black/40 border border-white/10 rounded p-1 text-center" 
                  value={score2} onChange={(e) => setScore2(e.target.value)} onClick={e => e.stopPropagation()} />
              </label>
            </div>

            <div className="flex gap-2">
              <button 
                className="flex-1 py-2 rounded bg-white/10 hover:bg-white/20 transition-colors"
                onClick={() => setSelectedMatch(null)}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              {(selectedMatch as any).status === 'FINISHED' && onMatchUndo && (
                <button 
                  className="flex-1 py-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  onClick={undoMatchResult}
                  disabled={isSubmitting}
                >
                  Deshacer
                </button>
              )}
              <button 
                className="flex-1 py-2 rounded bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50"
                onClick={submitMatchResult}
                disabled={isSubmitting || !selectedWinnerId || (selectedMatch as any).status === 'FINISHED'}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
