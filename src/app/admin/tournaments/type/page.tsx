import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TournamentTypePage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold font-[var(--font-display)] uppercase tracking-tighter text-white">
              Tipo de Torneo
            </h1>
            <p className="text-zinc-400">Selecciona el formato de competencia para comenzar la configuración</p>
          </div>
          <Link 
            href="/dashboard" 
            className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            ← Volver al Panel
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Individual Option */}
          <Link 
            href="/admin/tournaments/create?type=INDIVIDUAL"
            className="group relative p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-arena-cyan transition-all duration-300 hover:-translate-y-2"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
              <span className="text-6xl font-bold italic">1</span>
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-4">Individual</h2>
            <p className="text-zinc-400 mb-6">
              Competencia clásica de uno contra uno. Ideal para juegos de lucha o shooters individuales.
            </p>
            <div className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-arena-cyan group-hover:gap-2 transition-all">
              Configurar Torneo <span className="ml-1">→</span>
            </div>
          </Link>

          {/* Team Option */}
          <Link 
            href="/admin/tournaments/create?type=TEAM"
            className="group relative p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-arena-magenta transition-all duration-300 hover:-translate-y-2"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
              <span className="text-6xl font-bold italic">👥</span>
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-4">Por Equipos</h2>
            <p className="text-zinc-400 mb-6">
              Competencia coordinada. Configura el tamaño de los equipos y el límite de escuadras.
            </p>
            <div className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-arena-magenta group-hover:gap-2 transition-all">
              Configurar Torneo <span className="ml-1">→</span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
