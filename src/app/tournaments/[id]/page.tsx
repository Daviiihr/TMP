"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Tournament {
  id: string;
  name: string;
  game: string;
  region: string[];
  max_players: number;
  type: "INDIVIDUAL" | "TEAM";
  elimination_mode: string;
  min_players_per_team?: number;
  status: "DRAFT" | "REGISTRATION" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

interface Team {
  id: string;
  name: string;
  size: number;
  member_count: number;
  tournament_id: string | null;
}

export default function TournamentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.id;
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  // For TEAM tournaments
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/tournaments/${tournamentId}`);
        const data = await res.json();
        
        if (data.ok && data.tournament) {
          setTournament(data.tournament);
          
          if (data.tournament.type === "TEAM") {
            const teamsRes = await fetch('/api/teams');
            const teamsData = await teamsRes.json();
            if (teamsData.ok && teamsData.teams) {
              const validTeams = teamsData.teams.filter((t: Team) => 
                t.size === data.tournament.min_players_per_team && 
                t.member_count === data.tournament.min_players_per_team &&
                !t.tournament_id
              );
              setMyTeams(validTeams);
              if (validTeams.length > 0) setSelectedTeamId(validTeams[0].id);
            }
          }
        } else {
          setMessage({ text: data.message || "Error al cargar torneo", type: "error" });
        }
      } catch (err) {
        setMessage({ text: "Error de conexión", type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [tournamentId]);

  const handleEnrollIndividual = async () => {
    setIsEnrolling(true);
    setMessage(null);
    try {
      const res = await fetch("/api/enrollments/individual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId })
      });
      const data = await res.json();
      
      if (data.ok) {
        setMessage({ text: "¡Inscripción exitosa! Ya estás en el torneo.", type: "success" });
      } else {
        setMessage({ text: data.message || "Error al inscribirse", type: "error" });
        if (data.status === 401) router.push("/login");
      }
    } catch (err) {
      setMessage({ text: "Error de conexión", type: "error" });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleEnrollTeam = async () => {
    if (!selectedTeamId) {
      setMessage({ text: "Debes seleccionar un equipo válido.", type: "error" });
      return;
    }
    
    setIsEnrolling(true);
    setMessage(null);
    try {
      const res = await fetch("/api/enrollments/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId, teamId: selectedTeamId })
      });
      const data = await res.json();
      
      if (data.ok) {
        setMessage({ text: "¡Equipo inscrito exitosamente!", type: "success" });
        // Remover el equipo de la lista de elegibles
        setMyTeams(prev => prev.filter(t => t.id !== selectedTeamId));
        setSelectedTeamId("");
      } else {
        setMessage({ text: data.message || "Error al inscribir el equipo", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Error de conexión", type: "error" });
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white px-4 py-32 flex justify-center">
        <div className="w-8 h-8 border-4 border-arena-magenta border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white px-4 py-20 flex flex-col items-center">
        <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20 max-w-2xl w-full p-10">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Torneo no encontrado</h1>
          <p className="text-zinc-500 mb-6">{message?.text}</p>
          <Link href="/tournaments" className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold uppercase hover:bg-zinc-800">
            Volver
          </Link>
        </div>
      </main>
    );
  }

  const isRegistrationOpen = tournament.status === "REGISTRATION" || tournament.status === "DRAFT";

  return (
    <main className="min-h-screen bg-[#09090b] text-white px-4 py-20 md:px-8 relative overflow-hidden">
      <div className="glow-orb w-[500px] h-[500px] bg-arena-magenta top-[-10%] right-[-10%] opacity-15 absolute rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <Link href="/tournaments" className="text-xs text-zinc-500 hover:text-arena-cyan transition-colors uppercase tracking-widest mb-6 inline-block font-bold">
          ← Volver a Explorar
        </Link>
        
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 backdrop-blur overflow-hidden">
          {/* Cover Header */}
          <div className="h-32 bg-gradient-to-r from-zinc-900 via-arena-magenta/20 to-zinc-900 border-b border-zinc-800 flex items-end p-6">
            <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${isRegistrationOpen ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-800 text-zinc-400'}`}>
              {isRegistrationOpen ? 'Inscripciones Abiertas' : tournament.status}
            </span>
          </div>

          <div className="p-8 md:p-10">
            <h1 className="text-4xl font-black uppercase tracking-tight text-white mb-2">{tournament.name}</h1>
            <p className="text-arena-cyan text-lg font-bold mb-8">🎮 {tournament.game}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Modalidad</p>
                <p className="font-semibold">{tournament.type === "INDIVIDUAL" ? "Individual" : "Equipos"}</p>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Formato</p>
                <p className="font-semibold text-sm">{tournament.elimination_mode === "SINGLE_ELIMINATION" ? "Eliminación Simple" : "Doble Eliminación"}</p>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Regiones</p>
                <p className="font-semibold text-sm">{tournament.region?.length ? tournament.region.join(", ") : "Global"}</p>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Límite</p>
                <p className="font-semibold">{tournament.max_players} {tournament.type === "INDIVIDUAL" ? "jugadores" : "equipos"}</p>
              </div>
            </div>

            {/* Inscripción Box */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold uppercase mb-2">Inscripción al Torneo</h2>
              <p className="text-sm text-zinc-400 mb-6">
                {tournament.type === "INDIVIDUAL" 
                  ? "Este torneo es individual. Al inscribirte, asegurarás tu lugar en el bracket." 
                  : `Este torneo es por equipos. Requieres ser Capitán de un equipo de exactamente ${tournament.min_players_per_team} jugadores.`}
              </p>

              {message && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium border ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                  {message.text}
                </div>
              )}

              {!isRegistrationOpen ? (
                <button disabled className="w-full py-4 rounded-xl bg-zinc-800 text-zinc-500 font-bold uppercase cursor-not-allowed">
                  Inscripciones Cerradas
                </button>
              ) : tournament.type === "INDIVIDUAL" ? (
                <button 
                  onClick={handleEnrollIndividual}
                  disabled={isEnrolling}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-arena-magenta to-arena-cyan text-white font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(232,80,112,0.3)] transition-all disabled:opacity-50"
                >
                  {isEnrolling ? "Procesando..." : "Inscribirme Ahora"}
                </button>
              ) : (
                <div className="space-y-4">
                  {myTeams.length === 0 ? (
                    <div className="text-center p-6 border border-zinc-800 rounded-xl bg-zinc-950/50">
                      <p className="text-zinc-400 text-sm mb-4">No tienes equipos elegibles para este torneo. Debes ser Capitán de un equipo, tener exactamente {tournament.min_players_per_team} miembros unidos a tu equipo, y no estar inscrito en otro torneo.</p>
                      <Link href="/teams" className="text-arena-cyan hover:text-white font-bold text-sm uppercase transition-colors">
                        Ir a gestionar mis equipos →
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs uppercase text-zinc-500 font-bold">Selecciona tu equipo</label>
                        <select 
                          value={selectedTeamId}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-arena-magenta/50"
                        >
                          {myTeams.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.size} jugadores)</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        onClick={handleEnrollTeam}
                        disabled={isEnrolling || !selectedTeamId}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-arena-magenta to-arena-cyan text-white font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(232,80,112,0.3)] transition-all disabled:opacity-50"
                      >
                        {isEnrolling ? "Procesando..." : "Inscribir Equipo Seleccionado"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
