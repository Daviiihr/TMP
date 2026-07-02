import { UserRepository } from "@/repositories/user.repository";

export default async function PlayersSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await searchParams;
  const q = resolvedParams.q || "";
  
  const repo = new UserRepository();
  const users = await repo.searchUsers(q);

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold font-[var(--font-display)] uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
            Buscador de Jugadores
          </h1>
          <p className="text-zinc-400 text-lg mb-8">Encuentra aliados, explora perfiles y descubre a tus próximos rivales en la arena.</p>
          
          <form className="flex gap-4 max-w-2xl">
            <input 
              type="text" 
              name="q" 
              defaultValue={q} 
              placeholder="Buscar por nombre de usuario o rango (ej. Oro, Diamante)..." 
              className="flex-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg p-4 text-zinc-100 focus:outline-none focus:border-arena-cyan transition-colors"
            />
            <button 
              type="submit" 
              className="px-8 py-4 bg-zinc-100 hover:bg-white text-black font-bold uppercase tracking-wider rounded-lg transition-transform hover:scale-105 active:scale-95"
            >
              Buscar
            </button>
          </form>

          <li className="mt-4 text-sm text-zinc-500">
            <Link href="/" className="hover:text-arena-cyan transition-colors duration-300">
              Volver al inicio
            </Link>
          </li>
        </header>

        {users.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
            <p className="text-zinc-500 text-xl font-medium">No se encontraron jugadores que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((user) => {
              const themeColor = user.theme_color || "#00ffff";
              return (
                <Link 
                  key={user.id} 
                  href={`/player/${user.username}`}
                  className="group block bg-zinc-900 border rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 shadow-lg relative"
                  style={{ borderColor: `${themeColor}30` }}
                >
                  <div className="h-24 w-full bg-zinc-800 relative">
                    {user.banner_url ? (
                      <img src={user.banner_url} alt="Banner" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-90" />
                  </div>
                  
                  <div className="px-5 pb-5 relative -mt-10">
                    <div className="w-16 h-16 rounded-xl border-2 border-zinc-900 overflow-hidden bg-zinc-800 shadow-lg mb-3" style={{ borderColor: themeColor }} >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold font-[var(--font-display)] uppercase" style={{ backgroundColor: themeColor, color: '#000' }}>
                          {user.username.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-1 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">
                      {user.username}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border" style={{ backgroundColor: `${themeColor}10`, color: themeColor, borderColor: `${themeColor}40` }}>
                        {user.competitive_rank || 'Unranked'}
                      </span>
                      <span className="text-xs text-zinc-500 uppercase tracking-widest">{user.region}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
