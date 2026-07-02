"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import BracketView from "@/components/BracketView";
import { Participant, BracketResult } from "@/lib/algorithms/brackets";
import "./panel.css";

export default function TournamentPanelPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.id;
  const router = useRouter();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [eliminationMode, setEliminationMode] = useState<"SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION">("SINGLE_ELIMINATION");
  const [bracketData, setBracketData] = useState<BracketResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const saved = localStorage.getItem(`tournament_${tournamentId}_participants`);
    if (saved) {
      try {
        setParticipants(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar participantes", e);
      }
    }
    
    // Fetch active bracket initial load
    fetchBracket();
  }, [tournamentId]);

  useEffect(() => {
    // Guardar participantes en localStorage cada vez que cambian
    if (participants.length > 0 || localStorage.getItem(`tournament_${tournamentId}_participants`)) {
      localStorage.setItem(`tournament_${tournamentId}_participants`, JSON.stringify(participants));
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

  useEffect(() => {
    const delayFn = setTimeout(() => {
      fetch(`/api/players/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (data.users) setSearchResults(data.users);
        })
        .catch(console.error);
    }, 300);
    return () => clearTimeout(delayFn);
  }, [searchQuery]);

  const addParticipant = (user: { id: string; name: string }) => {
    if (!participants.find(p => p.id === user.id)) {
      setParticipants([...participants, { id: user.id, name: user.name, seed: participants.length + 1 }]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const loadEnrolledPlayers = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/enrollments`);
      const data = await res.json();
      
      if (data.players && data.players.length > 0) {
        // Merge without duplicates
        const currentIds = new Set(participants.map(p => p.id));
        const newParticipants = [...participants];
        let nextSeed = participants.length + 1;
        
        data.players.forEach((player: { id: string; name: string }) => {
          if (!currentIds.has(player.id)) {
            newParticipants.push({
              id: player.id,
              name: player.name,
              seed: nextSeed++
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
        body: JSON.stringify({ participants, eliminationMode })
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

  const handleMatchUpdate = async (matchId: string, winnerId: string, score1?: number, score2?: number) => {
    const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
      method: 'PUT',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId, score1, score2 })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar partido");
    }

    // Refrescar el bracket completo
    await fetchBracket();
  };

  const handleMatchUndo = async (matchId: string) => {
    const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}/undo`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" }
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al deshacer partido");
    }

    // Refrescar el bracket completo
    await fetchBracket();
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe] mb-3">
            Panel de Control del Torneo
          </h1>
          <p className="text-zinc-400 text-lg">
            Configura las reglas, añade jugadores usando el buscador en vivo y genera tu bracket dinámico.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Instrucciones */}
          <div className="lg:col-span-1 space-y-6">
            <section className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md p-6 rounded-2xl shadow-xl">
              <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00f2fe]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Instrucciones
              </h2>
              <ul className="space-y-4 text-sm text-zinc-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-[#00f2fe] flex items-center justify-center font-bold text-xs border border-zinc-700">1</span>
                  <p>Selecciona el <strong>modo de eliminación</strong> (Simple o Doble).</p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-[#00f2fe] flex items-center justify-center font-bold text-xs border border-zinc-700">2</span>
                  <p>Busca jugadores por nombre y añádelos a la lista de participantes. (Mínimo 2)</p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-[#00f2fe] flex items-center justify-center font-bold text-xs border border-zinc-700">3</span>
                  <p>Presiona <strong>Generar Bracket</strong> para visualizar el árbol del torneo y guardarlo.</p>
                </li>
              </ul>
            </section>
          </div>

          {/* Columna Derecha: Configuración y Añadir Jugadores */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-zinc-900/60 border border-zinc-800 p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
              {/* Decorative gradient orb */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00f2fe] rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-white">Añadir Jugadores</h2>
                
                <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 w-full sm:w-auto">
                  <label className={`flex-1 sm:flex-none text-center px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 ${eliminationMode === "SINGLE_ELIMINATION" ? "bg-[#00f2fe]/10 text-[#00f2fe] shadow-[inset_0_0_0_1px_rgba(0,242,254,0.3)]" : "text-zinc-500 hover:text-zinc-300"}`}>
                    <input 
                      type="radio" 
                      value="SINGLE_ELIMINATION" 
                      className="hidden"
                      checked={eliminationMode === "SINGLE_ELIMINATION"}
                      onChange={() => setEliminationMode("SINGLE_ELIMINATION")}
                    />
                    Eliminación Simple
                  </label>
                  <label className={`flex-1 sm:flex-none text-center px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 ${eliminationMode === "DOUBLE_ELIMINATION" ? "bg-[#00f2fe]/10 text-[#00f2fe] shadow-[inset_0_0_0_1px_rgba(0,242,254,0.3)]" : "text-zinc-500 hover:text-zinc-300"}`}>
                    <input 
                      type="radio" 
                      value="DOUBLE_ELIMINATION" 
                      className="hidden"
                      checked={eliminationMode === "DOUBLE_ELIMINATION"}
                      onChange={() => setEliminationMode("DOUBLE_ELIMINATION")}
                    />
                    Eliminación Doble
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6 relative z-10">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Escribe para buscar jugador..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
                  />
                  {isFocused && searchResults.length > 0 && (
                    <ul className="absolute z-20 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden backdrop-blur-xl">
                      {searchResults.map(user => (
                        <li 
                          key={user.id} 
                          onClick={() => addParticipant(user)}
                          className="px-4 py-3 hover:bg-[#00f2fe]/10 hover:text-[#00f2fe] cursor-pointer transition-colors border-b border-zinc-800/50 last:border-0"
                        >
                          {user.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <button 
                  onClick={loadEnrolledPlayers}
                  className="flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-5 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group"
                  title="Cargar jugadores inscritos al torneo"
                >
                  <svg className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span>Cargar Inscritos</span>
                </button>
              </div>

              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Participantes Seleccionados</h3>
                  <span className="bg-zinc-800 text-zinc-300 text-xs font-bold px-2 py-1 rounded-md">{participants.length}</span>
                </div>
                
                {participants.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed border-zinc-800 rounded-lg">
                    <p className="text-zinc-500 text-sm">No hay jugadores añadidos aún.</p>
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {participants.map(p => (
                      <li key={p.id} className="group flex items-center justify-between bg-zinc-900 border border-zinc-800/80 p-3 rounded-lg hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-zinc-950 text-[#00f2fe] text-xs font-black border border-zinc-800">
                            #{p.seed}
                          </span>
                          <span className="font-medium text-zinc-200">{p.name}</span>
                        </div>
                        <button 
                          onClick={() => removeParticipant(p.id)} 
                          className="opacity-0 group-hover:opacity-100 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1.5 rounded transition-all focus:opacity-100"
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p>{error}</p>
                </div>
              )}

              <button 
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 shadow-lg ${isGenerating || participants.length < 2 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-zinc-950 hover:shadow-[#00f2fe]/25 hover:scale-[1.01]'}`}
                onClick={generateBracket}
                disabled={isGenerating || participants.length < 2}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Generando...
                  </span>
                ) : (
                  "Generar Bracket"
                )}
              </button>
            </section>
          </div>
        </div>

        {bracketData && (
          <section className="mt-12 bg-zinc-900/60 border border-zinc-800 p-6 md:p-8 rounded-2xl shadow-2xl overflow-hidden relative">
             <div className="absolute -top-24 -left-24 w-64 h-64 bg-magenta-500 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-[#00f2fe] rounded-full"></span>
              Vista Previa del Bracket <span className="text-xs text-[#00f2fe] bg-[#00f2fe]/10 px-2 py-1 rounded-md ml-2 border border-[#00f2fe]/20">EN VIVO</span>
            </h2>
            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <div className="min-w-max">
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
