"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { TeamWithMemberCount } from "@/repositories/team.repository";

type TeamsApiResponse = {
  teams?: TeamWithMemberCount[];
  message?: string;
};

export default function SearchTeamsPage() {
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<TeamWithMemberCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/teams/search?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as TeamsApiResponse;
      if (res.ok) {
        setTeams(data.teams ?? []);
      } else {
        setMessage({ type: 'error', text: data.message ?? "Error al buscar equipos" });
      }
    } catch {
      setMessage({ type: 'error', text: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (teamId: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId })
      });
      const data = (await res.json()) as TeamsApiResponse;
      if (res.ok) {
        setMessage({ type: 'success', text: data.message ?? "Te has unido al equipo exitosamente." });
        // Refresh list to update member count
        const searchRes = await fetch(`/api/teams/search?q=${encodeURIComponent(query)}`);
        const searchData = (await searchRes.json()) as TeamsApiResponse;
        setTeams(searchData.teams ?? []);
      } else {
        setMessage({ type: 'error', text: data.message ?? "Error al intentar unirse" });
      }
    } catch {
      setMessage({ type: 'error', text: "Error al intentar unirse" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold font-[var(--font-display)] uppercase tracking-tighter text-white">
              Buscar Equipos
            </h1>
            <p className="text-zinc-400">Encuentra la escuadra perfecta para competir</p>
          </div>
          <Link 
            href="/dashboard" 
            className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            ← Volver
          </Link>
        </header>

        <form onSubmit={handleSearch} className="flex gap-4 mb-12">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-arena-cyan transition-colors" 
            placeholder="Escribe el nombre del equipo..."
          />
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-sm font-bold uppercase tracking-widest bg-arena-cyan text-zinc-950 rounded-lg hover:bg-arena-cyan-dim transition-colors disabled:opacity-50"
          >
            Buscar
          </button>
        </form>

        {message && (
          <div className={`mb-8 p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.length > 0 ? (
            teams.map((team) => (
              <div key={team.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between group hover:border-arena-cyan transition-all">
                <div>
                  <h3 className="text-xl font-bold text-white">{team.name}</h3>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
                    Miembros: <span className="text-arena-cyan">{team.member_count} / {team.size}</span>
                  </p>
                </div>
                <button 
                  onClick={() => handleJoin(team.id)}
                  disabled={loading || team.member_count >= team.size}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-zinc-800 text-white rounded-lg hover:bg-arena-cyan hover:text-zinc-950 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {team.member_count >= team.size ? "Lleno" : "Unirse"}
                </button>
              </div>
            ))
          ) : (
            !loading && query && (
              <div className="col-span-full text-center py-12">
                <p className="text-zinc-500">No se encontraron equipos con ese nombre.</p>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
