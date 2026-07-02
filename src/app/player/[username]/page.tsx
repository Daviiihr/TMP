import { UserRepository } from "@/repositories/user.repository";
import { notFound } from "next/navigation";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const resolvedParams = await params;
  const username = resolvedParams.username;

  const repo = new UserRepository();
  const user = await repo.findByUsername(username);

  if (!user) {
    notFound();
  }

  const themeColor = user.theme_color || "#00ffff";
  const avatar = user.avatar_url || "";
  const banner = user.banner_url || "";
  const rank = user.competitive_rank || "Unranked";

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <a
            href="/dashboard"
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold rounded-lg transition-colors border border-zinc-700 text-center"
          >
            ← Volver
          </a>
        </header>

        <div
          className="bg-zinc-900 border rounded-2xl overflow-hidden shadow-2xl relative group transition-all duration-300"
          style={{ borderColor: `${themeColor}40` }}
        >
          {/* Banner */}
          <div className="h-48 md:h-64 w-full bg-zinc-800 relative">
            {banner ? (
              <img
                src={banner}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent opacity-90" />
          </div>

          {/* Avatar & Info */}
          <div className="px-8 pb-10 relative">
            <div className="flex justify-between items-end -mt-20 mb-6 relative z-10">
              <div
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-zinc-900 overflow-hidden bg-zinc-800 shadow-2xl"
                style={{ borderColor: themeColor }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-6xl md:text-7xl font-bold font-[var(--font-display)] uppercase"
                    style={{ backgroundColor: themeColor, color: "#000" }}
                  >
                    {user.username.charAt(0)}
                  </div>
                )}
              </div>
              <div
                className="px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider border shadow-lg backdrop-blur-sm"
                style={{
                  backgroundColor: `${themeColor}20`,
                  color: themeColor,
                  borderColor: `${themeColor}50`,
                }}
              >
                {rank}
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-4">
              {user.username}
              {user.role === "ADMIN" && (
                <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-md uppercase tracking-wider border border-red-500/30">
                  Admin
                </span>
              )}
              {user.role === "CAPTAIN" && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-md uppercase tracking-wider border border-yellow-500/30">
                  Capitán
                </span>
              )}
            </h1>

            <p className="text-zinc-400 text-base md:text-lg mb-8 flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                style={{ backgroundColor: themeColor, color: themeColor }}
              ></span>
              Jugador de {user.region}
            </p>

            <div className="bg-zinc-950/80 p-6 rounded-xl border border-zinc-800/50 backdrop-blur-md">
              <h3
                className="text-zinc-500 uppercase tracking-widest text-xs font-bold mb-3 border-b border-zinc-800 pb-2"
                style={{ color: themeColor }}
              >
                Biografía
              </h3>
              <p className="text-zinc-200 text-base leading-relaxed whitespace-pre-wrap">
                {user.bio || (
                  <span className="text-zinc-600 italic">
                    Este jugador aún no tiene una biografía. El misterio le
                    rodea...
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
