import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { UserRepository } from "@/repositories/user.repository";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const repo = new UserRepository();
  const user = await repo.findById(session.id);

  if (!user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-[var(--font-display)] uppercase tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
              Personalización de Perfil
            </h1>
            <p className="text-zinc-400 text-lg">Define tu identidad en la arena.</p>
          </div>
          <a href="/dashboard" className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold rounded-lg transition-colors border border-zinc-700 text-center">
            Volver al Dashboard
          </a>
        </header>

        <ProfileForm user={user} />
      </div>
    </main>
  );
}
