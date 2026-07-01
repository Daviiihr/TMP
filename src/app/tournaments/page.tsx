"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Tournament {
  id: string;
  name: string;
  game: string;
  region: string[];
  max_players: number;
  type: "INDIVIDUAL" | "TEAM";
  elimination_mode: string;
  start_date: string | null;
  end_date: string | null;
  registration_closes_at: string | null;
  status: "DRAFT" | "REGISTRATION" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  created_at: string;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadTournaments = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/tournaments?list=true");
        const data = await res.json();
        if (active && data.ok) {
          setTournaments(data.tournaments || []);
        }
      } catch (error) {
        console.error("Error al cargar torneos:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadTournaments();

    return () => {
      active = false;
    };
  }, []);

  // Filtrado de torneos en el cliente
  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.game.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "" || t.type === selectedType;
    const matchesStatus = selectedStatus === "" || t.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: Tournament["status"]) => {
    const styles = {
      DRAFT: "bg-zinc-800 text-zinc-400 border-zinc-700",
      REGISTRATION: "bg-green-500/10 text-green-400 border-green-500/30",
      IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      COMPLETED: "bg-arena-magenta/10 text-arena-magenta border-arena-magenta/30",
      CANCELLED: "bg-red-500/10 text-red-400 border-red-500/30",
    };

    const labels = {
      DRAFT: "Borrador",
      REGISTRATION: "Inscripciones Abiertas",
      IN_PROGRESS: "En Curso",
      COMPLETED: "Finalizado",
      CANCELLED: "Cancelado",
    };

    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white px-4 py-20 md:px-8 relative overflow-hidden">
      {/* Glow effect elements */}
      <div className="glow-orb w-[500px] h-[500px] bg-arena-magenta top-[-10%] right-[-10%] opacity-15" />
      <div className="glow-orb w-[500px] h-[500px] bg-arena-cyan bottom-[-10%] left-[-10%] opacity-15" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-arena-cyan transition-colors uppercase tracking-widest mb-4 inline-block font-bold"
          >
            ← Volver al Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-r from-arena-magenta via-arena-cyan to-arena-magenta bg-clip-text text-transparent">
            Explorador de Torneos
          </h1>
          <p className="text-zinc-400 mt-2 text-sm md:text-base">
            Busca y participa en los torneos más competitivos de la comunidad.
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Buscar Torneo / Juego</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: Copa Smash, League of Legends..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-arena-magenta/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tipo de Torneo</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-arena-magenta/50"
            >
              <option value="">Todos los tipos</option>
              <option value="INDIVIDUAL">Individual (1v1)</option>
              <option value="TEAM">Por Equipos (Grupales)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Estado</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-arena-magenta/50"
            >
              <option value="">Todos los estados</option>
              <option value="REGISTRATION">Inscripciones Abiertas</option>
              <option value="IN_PROGRESS">En Curso / Activos</option>
              <option value="COMPLETED">Finalizados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Tournaments Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-8 h-8 border-4 border-arena-magenta border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-500">Cargando torneos de la comunidad...</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20">
            <p className="text-zinc-500 font-medium text-lg mb-2">No se encontraron torneos.</p>
            <p className="text-xs text-zinc-650">Intenta cambiar los filtros de búsqueda o categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((t) => (
              <div 
                key={t.id}
                className="glass-card gradient-border rounded-2.5xl p-6 flex flex-col justify-between min-h-[260px] hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(232,80,112,0.05)] transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                      {t.type === "INDIVIDUAL" ? "👤 Individual" : "👥 Equipos"}
                    </span>
                    {getStatusBadge(t.status)}
                  </div>

                  <h3 className="text-xl font-bold uppercase tracking-tight text-white line-clamp-1 mb-1">
                    {t.name}
                  </h3>
                  <p className="text-arena-cyan text-sm font-semibold mb-4">
                    🎮 {t.game}
                  </p>

                  <div className="space-y-2 mt-4 text-xs text-zinc-400">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Regiones:</span>
                      <span className="font-semibold text-zinc-200">
                        {t.region.length > 0 ? t.region.join(", ") : "Global"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Límite de Participantes:</span>
                      <span className="font-semibold text-zinc-200">
                        {t.max_players} {t.type === "INDIVIDUAL" ? "jugadores" : "equipos"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium">Formato:</span>
                      <span className="font-semibold text-zinc-200">
                        {t.elimination_mode === "SINGLE_ELIMINATION" ? "Eliminación Simple" : "Doble Eliminación"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                  <div className="text-[10px] text-zinc-500 flex flex-col">
                    <span>Creado el:</span>
                    <span className="font-semibold text-zinc-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <Link 
                    href={`/tournaments/${t.id}/bracket`}
                    className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs uppercase rounded-xl hover:border-arena-cyan/50 hover:text-arena-cyan transition-all"
                  >
                    Ver Brackets →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
