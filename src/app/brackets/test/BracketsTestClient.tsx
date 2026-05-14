"use client";

import Link from "next/link";
import { useState } from "react";
import { generateBracket, Participant, BracketResult } from "@/lib/algorithms/brackets";
import BracketView from "@/components/BracketView";

export default function BracketsTestClient() {
  const [playerName, setPlayerName] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [result, setResult] = useState<BracketResult | null>(null);

  const addPlayer = () => {
    if (!playerName.trim()) return;
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name: playerName.trim(),
    };
    setParticipants((prev) => [...prev, newParticipant]);
    setPlayerName("");
  };

  const removePlayer = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setResult(null);
  };

  const handleGenerate = () => {
    if (participants.length < 2) return;
    const res = generateBracket(participants);
    setResult(res);
  };

  const reset = () => {
    setParticipants([]);
    setResult(null);
    setPlayerName("");
  };

  const numParticipants = participants.length;
  const bracketSize = numParticipants > 1
    ? (numParticipants & (numParticipants - 1)) === 0
      ? numParticipants
      : Math.pow(2, Math.ceil(Math.log2(numParticipants)))
    : 0;
  const totalRounds = bracketSize > 0 ? Math.log2(bracketSize) : 0;

  return (
    <main className="min-h-screen bg-[#09090b] text-white px-4 py-20 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-arena-cyan transition-colors uppercase tracking-widest mb-4 inline-block"
          >
            ← Volver al Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-black uppercase bg-gradient-to-r from-arena-cyan via-arena-magenta to-arena-gold bg-clip-text text-transparent">
            Generador de Brackets
          </h1>
          <p className="text-zinc-400 mt-2 text-sm md:text-base">
            Agrega jugadores y genera automáticamente las llaves del torneo con
            ronda preliminar para los sobrantes.
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Input + List */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">
                Participantes
              </h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                  placeholder="Nombre del jugador..."
                  className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-arena-cyan/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                />
                <button
                  onClick={addPlayer}
                  disabled={!playerName.trim()}
                  className="px-5 py-2.5 bg-arena-cyan text-zinc-950 font-bold text-sm uppercase rounded-xl hover:shadow-[0_0_25px_rgba(0,240,255,0.3)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                {participants.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-lg group hover:border-zinc-700 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-arena-cyan">{i + 1}</span>
                    <span className="text-xs font-medium">{p.name}</span>
                    <button
                      onClick={() => removePlayer(p.id)}
                      className="text-zinc-600 hover:text-red-400 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats + Buttons */}
            <div className="flex flex-col justify-between gap-4 min-w-[200px]">
              {participants.length >= 2 && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-black text-white">{numParticipants}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Jugadores</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-arena-cyan">{bracketSize}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Bracket</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-arena-magenta">{totalRounds}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Rondas</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={participants.length < 2}
                  className="flex-1 py-3 bg-gradient-to-r from-arena-cyan to-arena-cyan-dim text-zinc-950 font-bold text-sm uppercase tracking-widest rounded-xl hover:shadow-[0_0_40px_rgba(0,240,255,0.25)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Generar Bracket
                </button>
                <button
                  onClick={reset}
                  className="px-5 py-3 border border-zinc-700 text-zinc-400 font-semibold text-sm uppercase rounded-xl hover:border-red-500/50 hover:text-red-400 transition-all"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bracket Visualization */}
        {result && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur p-6">
            <BracketView result={result} />
          </div>
        )}
      </div>
    </main>
  );
}
