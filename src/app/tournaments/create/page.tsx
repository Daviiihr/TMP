import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

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

export default async function CreateTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getSession();
  const { type = "INDIVIDUAL" } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const isTeamTournament = type === "TEAM";

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold font-[var(--font-display)] uppercase tracking-tighter text-white">
              Crear Torneo {isTeamTournament ? "por Equipos" : "Individual"}
            </h1>
            <p className="text-zinc-400">Configura los parámetros de la competencia</p>
          </div>
          <Link 
            href="/tournaments/type" 
            className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            ← Cambiar Tipo
          </Link>
        </header>

        <form action="/api/tournaments" method="POST" className="space-y-8">
          {/* Hidden field for tournament type */}
          <input type="hidden" name="type" value={type} />

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
                <input 
                  name="start_date" 
                  type="datetime-local" 
                  required 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Cierre Inscripciones</label>
                <input 
                  name="registration_closes_at" 
                  type="datetime-local" 
                  required 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Fecha Fin</label>
                <input 
                  name="end_date" 
                  type="datetime-local" 
                  required 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              className="px-8 py-3 text-sm font-bold uppercase tracking-widest text-zinc-950 bg-arena-magenta rounded-lg hover:bg-arena-magenta/80 transition-all duration-300 shadow-lg shadow-arena-magenta/20"
            >
              Publicar Torneo
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
