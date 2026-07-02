import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateTournamentForm } from "@/app/tournaments/create/components/CreateTournamentForm";

export default async function CreateTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getSession();
  const { type = "INDIVIDUAL" } = await searchParams;

  if (!session || session.role !== "ADMIN") {
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
            <p className="text-zinc-400">
              Configura los parámetros de la competencia
            </p>
          </div>
          <Link
            href="/admin/tournaments/type"
            className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            ← Cambiar Tipo
          </Link>
        </header>

        <CreateTournamentForm type={type} />
      </div>
    </main>
  );
}
