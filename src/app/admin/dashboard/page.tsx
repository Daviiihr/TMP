import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { appFactory } from "@/factories/app.factory";
import {
  DashboardGroup,
  DashboardLeaf,
  renderDashboardComponent,
} from "@/components/dashboard/DashboardComposite";

export default async function AdminDashboardPage() {
  const session = await getSession();

  // Protección estricta: Solo roles ADMIN inyectados en la BD
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const pool = appFactory.createPostgresPool();
  
  // Obtener estadísticas globales para el admin
  const userCountResult = await pool.query("SELECT COUNT(*) FROM users");
  const userCount = userCountResult.rows[0].count;

  const tournamentCountResult = await pool.query("SELECT COUNT(*) FROM tournaments");
  const tournamentCount = tournamentCountResult.rows[0].count;
  const adminDashboardTree = new DashboardGroup(
    "admin-dashboard-grid",
    "grid grid-cols-1 lg:grid-cols-3 gap-6",
    [
      new DashboardGroup(
        "admin-stats-column",
        "space-y-6",
        [
          new DashboardLeaf(
            "admin-user-count",
            <section className="bg-zinc-900/50 border border-arena-magenta/20 rounded-2xl p-6 shadow-[0_0_15px_rgba(232,80,112,0.1)]">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Usuarios Registrados
              </h2>
              <p className="text-4xl font-black text-white">{userCount}</p>
            </section>,
          ),
          new DashboardLeaf(
            "admin-tournament-count",
            <section className="bg-zinc-900/50 border border-arena-cyan/20 rounded-2xl p-6 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Torneos Creados
              </h2>
              <p className="text-4xl font-black text-white">{tournamentCount}</p>
            </section>,
          ),
        ],
      ),
      new DashboardGroup(
        "admin-main-column",
        "lg:col-span-2 space-y-6",
        [
          new DashboardLeaf(
            "admin-global-management",
            <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-6">
                Gestión Global
              </h2>
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                <p className="text-zinc-500 font-medium italic">Sección en construcción. Aquí podrás banear usuarios, eliminar torneos y gestionar el sistema.</p>
              </div>
            </section>,
          ),
        ],
      ),
    ],
  );

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-bold font-[var(--font-display)] uppercase tracking-tighter text-white">
              Panel <span className="text-arena-magenta">Admin</span>
            </h1>
            <p className="text-zinc-400">
              Control global del sistema. Usuario: <span className="text-white font-bold">{session.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold uppercase tracking-widest text-white bg-zinc-800 border border-zinc-700 rounded-lg transition-all duration-300 hover:bg-zinc-700 hover:border-zinc-600"
            >
              Ver Dashboard Normal
            </Link>
            <form action="/api/auth/logout" method="POST" className="inline-flex items-center">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-arena-magenta bg-transparent hover:text-white transition-colors duration-300 hover:bg-zinc-800/20 rounded-lg border border-arena-magenta/30"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </header>

        {renderDashboardComponent(adminDashboardTree)}
      </div>
    </main>
  );
}
