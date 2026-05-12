import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateTeamForm from "@/components/teams/CreateTeamForm";

export default async function CreateTeamPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold font-[var(--font-display)] uppercase tracking-tighter text-white">
              Crear Equipo
            </h1>
            <p className="text-zinc-400">Registra tu escuadra para competir en los torneos</p>
          </div>
          <Link 
            href="/dashboard" 
            className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            ← Volver
          </Link>
        </header>

        <CreateTeamForm session={session} />
      </div>
    </main>
  );
}
