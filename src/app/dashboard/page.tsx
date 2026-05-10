import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPostgresPool } from "@/lib/database";
import TeamSection from "@/components/dashboard/TeamSection";

type TournamentSummary = {
  id: string;
  name: string;
  status: string;
  created_at: Date;
};

export default async function DashboardPage() {
  const session = await getSession();

  // Cualquier usuario autenticado puede ver este panel
  if (!session) {
    redirect("/");
  }

  const pool = getPostgresPool();
  
  // Buscar torneos creados por este usuario
  const myTournamentsResult = await pool.query<TournamentSummary>(
    `SELECT id, name, status, created_at 
     FROM tournaments 
     WHERE organizer_id = $1 
     ORDER BY created_at DESC`,
    [session.id]
  );
  const myTournaments = myTournamentsResult.rows;

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-bold font-[var(--font-display)] uppercase tracking-tighter text-white">
              Panel de Control
            </h1>
            <p className="text-zinc-400">
              Bienvenido de nuevo, <span className="text-arena-cyan font-bold">{session.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {session.role === "ADMIN" && (
              <Link 
                href="/admin/dashboard" 
                className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold uppercase tracking-widest text-zinc-950 bg-arena-magenta border border-arena-magenta rounded-lg transition-all duration-300 hover:bg-arena-magenta/80"
              >
                Panel Admin
              </Link>
            )}
            <Link 
              href="/admin/tournaments/type" 
              className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold uppercase tracking-widest text-zinc-950 bg-arena-magenta border border-arena-magenta rounded-lg transition-all duration-300 hover:bg-arena-magenta/80"
            >
              Crear Torneo
            </Link>
            <Link 
              href="/profile" 
              className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold uppercase tracking-widest text-white bg-zinc-800 border border-zinc-700 rounded-lg transition-all duration-300 hover:bg-zinc-700 hover:border-zinc-600"
            >
              Ver Perfil
            </Link>
            <form action="/api/auth/logout" method="POST" className="inline-flex items-center">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-arena-cyan bg-transparent hover:text-white transition-colors duration-300 hover:bg-zinc-800/20 rounded-lg border border-arena-cyan/30"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Tournaments (Main) */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">
                  Mis Torneos Creados
                </h2>
              </div>
              
              {myTournaments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                  <p className="text-zinc-500 font-medium mb-4">No has creado ningún torneo aún.</p>
                  <p className="text-xs text-zinc-600 max-w-sm text-center">
                    Puedes crear hasta 3 torneos por día, pero solo puedes tener 1 torneo activo a la vez.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTournaments.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border border-zinc-800 hover:border-arena-cyan/30 transition-colors">
                      <div>
                        <h3 className="font-bold text-white">{t.name}</h3>
                        <p className="text-xs text-zinc-500 mt-1">Creado: {new Date(t.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${t.status === 'DRAFT' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-arena-cyan/20 text-arena-cyan border-arena-cyan/30'}`}>
                          {t.status}
                        </span>
                        <button className="text-xs font-bold uppercase text-white hover:text-arena-cyan transition-colors">
                          Gestionar →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
 
            <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-6">
                Historial de Participación
              </h2>
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                <p className="text-zinc-500 font-medium italic">Falta implementar</p>
              </div>
            </section>
          </div>
 
          {/* Right Column: Ranking & Teams */}
          <div className="space-y-6">
            <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-6">
                Ranking Global
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-bold w-4">1</span>
                    <span className="text-sm font-medium">Ejemplo_01</span>
                  </div>
                  <span className="text-arena-cyan font-bold text-sm">2,500 pts</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-bold w-4">2</span>
                    <span className="text-sm font-medium">Ejemplo_02</span>
                  </div>
                  <span className="text-arena-cyan font-bold text-sm">2,100 pts</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500 font-bold w-4">3</span>
                    <span className="text-sm font-medium">Ejemplo_03</span>
                  </div>
                  <span className="text-arena-cyan font-bold text-sm">1,800 pts</span>
                </div>
                <div className="text-center mt-4">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Tú estás en la posición #10</p>
                </div>
              </div>
            </section>
 
            <TeamSection />
          </div>
        </div>
      </div>
    </main>
  );
}
