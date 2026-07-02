import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { appFactory } from "@/factories/app.factory";
import {
  DashboardComponent,
  DashboardGroup,
  DashboardLeaf,
  renderDashboardComponent,
} from "@/components/dashboard/DashboardComposite";
import TeamSection from "@/components/dashboard/TeamSection";
import TournamentCard from "@/components/dashboard/TournamentCard";

const tournamentRepo = appFactory.createTournamentRepository();
const teamRepo = appFactory.createTeamRepository();

export default async function DashboardPage() {
  const session = await getSession();

  // Cualquier usuario autenticado puede ver este panel
  if (!session) {
    redirect("/");
  }

  const isAdmin = session.role === "ADMIN";
  const myTournaments = isAdmin
    ? await tournamentRepo.findByOrganizer(session.id)
    : [];
  const myTeams = await teamRepo.findByMember(session.id);
  const hasActiveTournament = myTournaments.some(
    (t) => t.status === "REGISTRATION",
  );

  const rankingRepo = appFactory.createRankingRepository();
  const topRankings = await rankingRepo.getRankingsByCountry();
  const myRanking = await rankingRepo.getUserRanking(session.id);

  const participationHistory = await tournamentRepo.getUserParticipationHistory(
    session.id,
  );

  const mainColumnChildren: DashboardComponent[] = [
    ...(isAdmin
      ? [
          new DashboardLeaf(
            "created-tournaments",
            <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tight text-white">
                    Mis Torneos Creados
                  </h2>
                  {hasActiveTournament && (
                    <p className="text-[10px] text-green-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      1 torneo activo
                    </p>
                  )}
                </div>
              </div>

              {myTournaments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                  <p className="text-zinc-500 font-medium mb-4">
                    No has creado ningún torneo aún.
                  </p>
                  <p className="text-xs text-zinc-600 max-w-sm text-center">
                    Puedes crear hasta 3 torneos por día, pero solo puedes tener
                    1 torneo activo a la vez.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTournaments.map((t) => (
                    <TournamentCard
                      key={t.id}
                      id={t.id}
                      name={t.name}
                      status={t.status}
                      createdAt={new Date(t.created_at).toLocaleDateString()}
                      hasActiveTournament={hasActiveTournament}
                    />
                  ))}
                </div>
              )}
            </section>,
          ),
        ]
      : []),
    new DashboardLeaf(
      "participation-history",
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-6">
          Historial de Participación
        </h2>
        {participationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
            <p className="text-zinc-500 font-medium italic">
              Aún no has participado en ningún torneo.
            </p>
            <Link
              href="/tournaments"
              className="mt-4 text-xs font-bold text-arena-cyan uppercase tracking-widest hover:text-arena-cyan/80"
            >
              Explorar Torneos →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {participationHistory.map((t) => (
              <div
                key={t.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl hover:border-arena-cyan/30 transition-colors gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-arena-cyan bg-arena-cyan/10 px-2 py-0.5 rounded">
                      {t.game}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${t.status === "COMPLETED" ? "bg-zinc-800 text-zinc-400" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg">{t.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                    <span className="font-medium">
                      Modalidad:{" "}
                      {t.type === "INDIVIDUAL" ? "Individual" : "Equipos"}
                    </span>
                    {t.type === "TEAM" && (
                      <span className="text-arena-magenta font-bold px-1.5 py-0.5 bg-arena-magenta/10 rounded">
                        Tu Equipo: {t.team_name}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col md:items-end gap-2">
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                  <Link
                    href={`/tournaments/${t.id}/bracket`}
                    className="text-xs font-bold text-white bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded hover:bg-zinc-800 transition-colors"
                  >
                    Ver Torneo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>,
    ),
  ];

  const dashboardTree = new DashboardGroup(
    "dashboard-grid",
    "grid grid-cols-1 lg:grid-cols-3 gap-6",
    [
      new DashboardGroup(
        "dashboard-main-column",
        "lg:col-span-2 space-y-6",
        mainColumnChildren,
      ),
      new DashboardGroup("dashboard-side-column", "space-y-6", [
        new DashboardLeaf(
          "global-ranking",
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-6">
              Ranking Global
            </h2>
            <div className="space-y-4">
              {topRankings.length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-4">
                  No hay clasificaciones aún.
                </p>
              ) : (
                topRankings.slice(0, 3).map((r) => (
                  <div
                    key={r.username}
                    className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 font-bold w-4">
                        {r.position}
                      </span>
                      <span className="text-sm font-medium">{r.username}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-semibold uppercase">
                        {r.country}
                      </span>
                    </div>
                    <span className="text-arena-cyan font-bold text-sm">
                      {r.points.toLocaleString()} pts
                    </span>
                  </div>
                ))
              )}

              <div className="text-center mt-4 pt-2 border-t border-zinc-800/50 flex flex-col gap-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  {myRanking
                    ? `Tú estás en la posición #${myRanking.position} de ${myRanking.country} (${myRanking.points} pts)`
                    : "No estás calificado en el ranking aún"}
                </p>
                <Link
                  href="/ranking"
                  className="text-xs font-bold text-arena-cyan hover:text-arena-cyan/80 transition-colors uppercase tracking-wider mt-1 block"
                >
                  Ver Ranking Completo →
                </Link>
              </div>
            </div>
          </section>,
        ),
        new DashboardLeaf(
          "teams",
          <TeamSection teams={myTeams} userId={session.id} />,
        ),
      ]),
    ],
  );

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
              Bienvenido de nuevo,{" "}
              <span className="text-arena-cyan font-bold">
                {session.username}
              </span>
            </p>
            <Link
              href="/"
              className="font-bold uppercase hover:text-arena-cyan transition-colors duration-300"
            >
              Volver al inicio
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold uppercase tracking-widest text-zinc-950 bg-arena-magenta border border-arena-magenta rounded-lg transition-all duration-300 hover:bg-arena-magenta/80"
              >
                Panel Admin
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/tournaments/type"
                className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold uppercase tracking-widest text-zinc-950 bg-arena-magenta border border-arena-magenta rounded-lg transition-all duration-300 hover:bg-arena-magenta/80"
              >
                Crear Torneo
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/brackets/test"
                className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold uppercase tracking-widest text-zinc-950 bg-arena-cyan border border-arena-cyan rounded-lg transition-all duration-300 hover:bg-arena-cyan-dim"
              >
                Crear Brackets
              </Link>
            )}
            <Link
              href="/profile"
              className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold uppercase tracking-widest text-white bg-zinc-800 border border-zinc-700 rounded-lg transition-all duration-300 hover:bg-zinc-700 hover:border-zinc-600"
            >
              Ver Perfil
            </Link>
            <form
              action="/api/auth/logout"
              method="POST"
              className="inline-flex items-center"
            >
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-arena-cyan bg-transparent hover:text-white transition-colors duration-300 hover:bg-zinc-800/20 rounded-lg border border-arena-cyan/30"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </header>

        {renderDashboardComponent(dashboardTree)}
      </div>
    </main>
  );
}
