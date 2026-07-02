"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import BracketView from "@/components/BracketView";
import { Participant, BracketResult } from "@/lib/algorithms/brackets";
import "./panel.css";

export default function TournamentPanelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.id;
  const router = useRouter();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eliminationMode, setEliminationMode] = useState<
    "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION"
  >("SINGLE_ELIMINATION");
  const [tournamentName, setTournamentName] = useState<string>("");
  const [bracketData, setBracketData] = useState<BracketResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTournamentDetails = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      const data = await res.json();
      if (data.tournament) {
        if (data.tournament.eliminationMode)
          setEliminationMode(data.tournament.eliminationMode);
        if (data.tournament.name) setTournamentName(data.tournament.name);
      }
    } catch (err) {
      console.error("Error al obtener detalles del torneo:", err);
    }
  };

  const fetchBracket = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/brackets`);
      const data = await res.json();
      if (data.bracketData) {
        setBracketData(data.bracketData);
        setEliminationMode(data.eliminationMode);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Cargar participantes guardados localmente
    const saved = localStorage.getItem(
      `tournament_${tournamentId}_participants`,
    );
    if (saved) {
      try {
        setParticipants(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar participantes", e);
      }
    }

    // Fetch initial data
    fetchTournamentDetails();
    fetchBracket();
  }, [tournamentId]);

  useEffect(() => {
    // Guardar participantes en localStorage cada vez que cambian
    if (
      participants.length > 0 ||
      localStorage.getItem(`tournament_${tournamentId}_participants`)
    ) {
      localStorage.setItem(
        `tournament_${tournamentId}_participants`,
        JSON.stringify(participants),
      );
    }
  }, [participants, tournamentId]);

  useEffect(() => {
    // Sincronización automática (Short-Polling cada 5 segundos)
    if (!bracketData) return;
    const interval = setInterval(() => {
      fetchBracket();
    }, 5000);
    return () => clearInterval(interval);
  }, [tournamentId, bracketData]);

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const loadEnrolledPlayers = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/enrollments`);
      const data = await res.json();

      if (data.players && data.players.length > 0) {
        // Merge without duplicates
        const currentIds = new Set(participants.map((p) => p.id));
        const newParticipants = [...participants];
        let nextSeed = participants.length + 1;

        data.players.forEach((player: { id: string; name: string }) => {
          if (!currentIds.has(player.id)) {
            newParticipants.push({
              id: player.id,
              name: player.name,
              seed: nextSeed++,
            });
            currentIds.add(player.id);
          }
        });

        setParticipants(newParticipants);
      }
    } catch (err) {
      console.error("Error cargando inscritos:", err);
    }
  };

  const generateBracket = async () => {
    if (participants.length < 2) {
      setError("Se requieren al menos 2 jugadores para generar el bracket.");
      return;
    }
    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/brackets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants, eliminationMode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar bracket");

      setBracketData(data.bracketData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMatchUpdate = async (
    matchId: string,
    winnerId: string,
    score1?: number,
    score2?: number,
  ) => {
    const res = await fetch(
      `/api/tournaments/${tournamentId}/matches/${matchId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId, score1, score2 }),
      },
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar partido");
    }

    // Refrescar el bracket completo
    await fetchBracket();
  };

  const handleMatchUndo = async (matchId: string) => {
    const res = await fetch(
      `/api/tournaments/${tournamentId}/matches/${matchId}/undo`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al deshacer partido");
    }

    // Refrescar el bracket completo
    await fetchBracket();
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="mb-12 text-center relative z-10">
          <div className="inline-block relative">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] via-purple-500 to-[#4facfe] mb-2 animate-gradient-x drop-shadow-2xl">
              Panel de Control
            </h1>
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-500 rounded-full blur-[40px] opacity-20 pointer-events-none"></div>
          </div>

          {tournamentName && (
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 uppercase tracking-widest mt-2 mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {tournamentName}
            </h2>
          )}

          <p className="text-zinc-400 text-lg font-medium tracking-wide">
            Carga los participantes y genera tu bracket dinámico al instante.
          </p>
        </header>

        <section className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 p-6 md:p-10 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(0,242,254,0.15)] relative overflow-hidden transition-all hover:shadow-[0_0_50px_-12px_rgba(0,242,254,0.25)]">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00f2fe] rounded-full blur-[150px] opacity-[0.03] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600 rounded-full blur-[120px] opacity-[0.03] pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 relative z-10">
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-1">
                Participantes
              </h2>
              <p className="text-zinc-500 text-sm">
                Gestiona la lista antes de sortear los cruces.
              </p>
            </div>

            <div className="flex bg-zinc-950/80 p-1.5 rounded-xl border border-zinc-800 shadow-inner">
              <span className="px-4 py-2 rounded-lg bg-[#00f2fe]/10 text-xs font-black uppercase tracking-widest text-[#00f2fe] shadow-[0_0_20px_rgba(0,242,254,0.2)]">
                {eliminationMode === "SINGLE_ELIMINATION"
                  ? "Eliminación Simple"
                  : "Eliminación Doble"}
              </span>
            </div>
          </div>

          <div className="flex justify-center mb-10 relative z-10">
            <button
              onClick={loadEnrolledPlayers}
              className="relative group overflow-hidden bg-zinc-800/50 hover:bg-[#00f2fe]/10 border border-zinc-700 hover:border-[#00f2fe]/50 text-white hover:text-[#00f2fe] px-8 py-4 rounded-2xl font-bold uppercase tracking-wider transition-all duration-500 flex items-center justify-center gap-3 w-full sm:w-auto shadow-lg hover:shadow-[0_0_30px_rgba(0,242,254,0.2)] hover:-translate-y-1"
              title="Cargar jugadores inscritos al torneo"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#00f2fe]/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
              <svg
                className="w-6 h-6 transition-transform group-hover:rotate-180 duration-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span>Cargar Inscritos Automáticamente</span>
            </button>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-6 mb-10 shadow-inner relative z-10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                Listado Oficial
              </h3>
              <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse"></span>
                <span className="text-zinc-300 text-sm font-bold">
                  {participants.length}{" "}
                  <span className="text-zinc-500 font-normal">Anotados</span>
                </span>
              </div>
            </div>

            {participants.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800/50 shadow-inner">
                  <svg
                    className="w-8 h-8 text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <p className="text-zinc-400 text-sm font-medium">
                  El bracket está vacío.
                </p>
                <p className="text-zinc-600 text-xs mt-1">
                  Haz clic en cargar inscritos para sincronizar.
                </p>
              </div>
            ) : (
              <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {participants.map((p, idx) => (
                  <li
                    key={p.id}
                    className="group flex items-center justify-between bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 p-4 rounded-xl hover:border-zinc-600 hover:bg-zinc-800/80 transition-all duration-300 hover:shadow-lg transform origin-left animate-fade-in-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-950 text-[#00f2fe] text-sm font-black border border-zinc-800 shadow-inner group-hover:shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all">
                        #{p.seed}
                      </span>
                      <span className="font-bold text-zinc-200 text-lg group-hover:text-white transition-colors tracking-wide">
                        {p.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeParticipant(p.id)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all focus:opacity-100"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="mb-8 bg-red-500/10 border border-red-500/30 backdrop-blur-md text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="font-medium">{error}</p>
            </div>
          )}

          <button
            className={`relative overflow-hidden w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all duration-500 z-10 ${isGenerating || participants.length < 2 ? "bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-zinc-950 hover:shadow-[0_0_40px_rgba(0,242,254,0.4)] hover:-translate-y-1 hover:scale-[1.01]"}`}
            onClick={generateBracket}
            disabled={isGenerating || participants.length < 2}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-3">
                <svg
                  className="animate-spin h-6 w-6 text-zinc-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generando Algoritmo...
              </span>
            ) : (
              "¡Generar Bracket!"
            )}
          </button>
        </section>

        {bracketData && (
          <section className="mt-16 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-6 md:p-10 rounded-[2rem] shadow-[0_0_60px_-15px_rgba(236,72,153,0.15)] overflow-hidden relative">
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-pink-500 rounded-full blur-[150px] opacity-[0.07] pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-500 rounded-full blur-[150px] opacity-[0.07] pointer-events-none"></div>

            <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-8 flex items-center gap-4 relative z-10">
              <span className="w-2 h-10 bg-gradient-to-b from-[#00f2fe] to-purple-500 rounded-full shadow-[0_0_10px_rgba(0,242,254,0.5)]"></span>
              Árbol de Cruces Oficial
              <span className="flex items-center gap-2 text-xs text-pink-400 bg-pink-500/10 px-3 py-1.5 rounded-lg ml-2 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                LIVE
              </span>
            </h2>
            <div className="overflow-x-auto pb-6 custom-scrollbar relative z-10">
              <div className="min-w-max p-4 bg-zinc-950/30 rounded-2xl border border-zinc-800/50">
                <BracketView
                  result={bracketData}
                  onMatchUpdate={handleMatchUpdate}
                  onMatchUndo={handleMatchUndo}
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
