import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold font-[var(--font-display)] uppercase tracking-tighter mb-8">
          Mi Perfil
        </h1>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-zinc-400 mb-4">Esta sección está en construcción.</p>
          <div className="flex flex-col items-center gap-4">
            <button className="px-6 py-2 bg-arena-cyan text-black font-bold rounded-lg hover:bg-arena-cyan/80 transition-colors">
              Editar Perfil
            </button>
          </div>
        </div>
        <a href="/dashboard">Volver a mi perfil</a>
      </div>
    </main>
  );
}
