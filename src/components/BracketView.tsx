"use client";

import { BracketResult, RoundData } from "@/lib/algorithms/brackets";
import "./bracket-view.css";

interface BracketViewProps {
  result: BracketResult;
}

function MatchCard({ player1, player2, isBye }: { player1: string | null; player2: string | null; isBye: boolean }) {
  const p1Label = player1 || "Por definir";
  const p2Label = player2 || (isBye ? "— vacío —" : "Por definir");
  const isP1Empty = !player1;
  const isP2Empty = !player2;

  return (
    <div className={`match-card ${isBye ? "match-card--bye" : ""}`}>
      <div className={`match-player match-player--top ${isP1Empty ? "match-player--empty" : ""}`}>
        {p1Label}
      </div>
      <div className="match-divider" />
      <div className={`match-player match-player--bottom ${isP2Empty ? "match-player--empty" : ""}`}>
        {p2Label}
      </div>
    </div>
  );
}

function RoundColumn({ round, isRight }: { round: RoundData; isRight: boolean }) {
  return (
    <div className="bracket-round">
      <div className="round-label">{round.label}</div>
      <div className="round-matches">
        {round.matches.map((m) => (
          <div key={m.id} className="bracket-match-wrapper">
            {isRight && <div className="connector-line" />}
            <MatchCard
              player1={m.player1?.name || null}
              player2={m.player2?.name || null}
              isBye={m.isBye}
            />
            {!isRight && <div className="connector-line" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BracketView({ result }: BracketViewProps) {
  if (!result || result.rounds.length === 0) return null;

  const { rounds, totalRounds } = result;

  // Split rounds: left half, final, right half
  // If only 1 round (Final), show it centered
  if (totalRounds === 1) {
    const finalRound = rounds[0];
    return (
      <div className="bracket-wrapper">
        <div className="bracket-container bracket-container--single">
          <div className="bracket-final">
            <div className="final-trophy">🏆</div>
            <MatchCard
              player1={finalRound.matches[0]?.player1?.name || null}
              player2={finalRound.matches[0]?.player2?.name || null}
              isBye={finalRound.matches[0]?.isBye || false}
            />
            <p className="final-label">FINAL</p>
          </div>
        </div>
      </div>
    );
  }

  // For multi-round brackets, split each round's matches in half
  // Left side gets the top half, right side gets the bottom half
  const leftRounds: RoundData[] = [];
  const rightRounds: RoundData[] = [];

  // All rounds except the final get split
  for (let i = 0; i < rounds.length - 1; i++) {
    const round = rounds[i];
    const half = Math.ceil(round.matches.length / 2);
    leftRounds.push({
      ...round,
      matches: round.matches.slice(0, half),
    });
    rightRounds.push({
      ...round,
      matches: round.matches.slice(half),
    });
  }

  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound.matches[0];

  return (
    <div className="bracket-wrapper">
      <div className="bracket-container">
        {/* Left half */}
        <div className="half-bracket half-bracket--left">
          {leftRounds.map((round, ri) => (
            <RoundColumn key={ri} round={round} isRight={false} />
          ))}
        </div>

        {/* Final */}
        <div className="bracket-final">
          <div className="final-trophy">🏆</div>
          <MatchCard
            player1={finalMatch?.player1?.name || null}
            player2={finalMatch?.player2?.name || null}
            isBye={finalMatch?.isBye || false}
          />
          <p className="final-label">FINAL</p>
        </div>

        {/* Right half (mirrored) */}
        <div className="half-bracket half-bracket--right">
          {rightRounds.map((round, ri) => (
            <RoundColumn key={ri} round={round} isRight={true} />
          ))}
        </div>
      </div>
    </div>
  );
}
