"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AVAILABLE_GAMES = [
  "League of Legends",
  "Valorant",
  "Counter-Strike 2",
  "Dota 2",
  "Apex Legends",
  "Rocket League",
  "Overwatch 2",
  "Fortnite",
  "Street Fighter 6",
  "Tekken 8",
];

interface CreateTournamentFormProps {
  type: string;
}

export function CreateTournamentForm({ type }: CreateTournamentFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isTeamTournament = type === "TEAM";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("type", type);

    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        body: formData,
      });

      if (response.redirected) {
        // Successful creation may redirect directly from the API depending on its behavior
        router.push(response.url);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (data && data.message) {
          setError(data.message);
        } else {
          setError("Ocurrió un error inesperado al crear el torneo.");
        }
        setIsLoading(false);
        return;
      }

      // If the API doesn't redirect but returns success
      router.push("/dashboard");
    } catch (_err) {
      setError("Error de red. Por favor intenta nuevamente.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Info */}
        <div className="space-y-6 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold uppercase tracking-tight text-arena-cyan">Información General</h2>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-500">Nombre del Torneo</label>
            <input 
              name="name" 
              required 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors" 
              placeholder="Ej. Global Masters 2026"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-500">Videojuego</label>
            <select 
              name="game" 
              required 
              defaultValue=""
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors appearance-none"
            >
              <option value="" disabled>Selecciona un juego</option>
              {AVAILABLE_GAMES.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-500">Regiones Permitidas (separadas por coma)</label>
            <input 
              name="regions" 
              required 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors" 
              placeholder="NA, EU, LATAM"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-500">Modalidad de Eliminación</label>
            <select
              name="elimination_mode"
              required
              defaultValue=""
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors appearance-none"
            >
              <option value="" disabled>Selecciona una modalidad</option>
              <option value="SINGLE_ELIMINATION">Eliminación simple</option>
              <option value="DOUBLE_ELIMINATION">Eliminación doble</option>
            </select>
          </div>
        </div>

        {/* Constraints */}
        <div className="space-y-6 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <h2 className="text-lg font-bold uppercase tracking-tight text-arena-cyan">Restricciones</h2>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-500">
              {isTeamTournament ? "Máximo de Equipos" : "Máximo de Jugadores"}
            </label>
            <input 
              name="max_players" 
              type="number" 
              required 
              min="4"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors" 
            />
          </div>

          {isTeamTournament && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Jugadores por Equipo</label>
                <input 
                  name="players_per_team" 
                  type="number" 
                  required 
                  min="1"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors" 
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-6">
        <h2 className="text-lg font-bold uppercase tracking-tight text-arena-cyan">Cronograma</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-500">Fecha Inicio</label>
            <div className="flex gap-2">
              <input 
                name="start_date_date" 
                type="date" 
                required 
                className="w-2/3 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
              <input 
                name="start_date_time" 
                type="time" 
                required 
                className="w-1/3 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-500">Cierre Inscripciones</label>
            <div className="flex gap-2">
              <input 
                name="registration_closes_at_date" 
                type="date" 
                required 
                className="w-2/3 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
              <input 
                name="registration_closes_at_time" 
                type="time" 
                required 
                className="w-1/3 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-500">Fecha Fin</label>
            <div className="flex gap-2">
              <input 
                name="end_date_date" 
                type="date" 
                required 
                className="w-2/3 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
              <input 
                name="end_date_time" 
                type="time" 
                required 
                className="w-1/3 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-8 py-3 text-sm font-bold uppercase tracking-widest text-zinc-950 bg-arena-magenta rounded-lg hover:bg-arena-magenta/80 transition-all duration-300 shadow-lg shadow-arena-magenta/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creando..." : "Publicar Torneo"}
        </button>
      </div>
    </form>
  );
}
