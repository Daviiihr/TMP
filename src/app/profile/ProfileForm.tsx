"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "./actions";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export default function ProfileForm({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();
  const [themeColor, setThemeColor] = useState(user.theme_color || "#00ffff");
  const [avatar, setAvatar] = useState(user.avatar_url || "");
  const [banner, setBanner] = useState(user.banner_url || "");
  const [bio, setBio] = useState(user.bio || "");
  const [rank, setRank] = useState(user.competitive_rank || "Unranked");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      updateProfileAction(formData);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        <h2 className="text-2xl font-bold font-[var(--font-display)] uppercase text-zinc-100 border-b border-zinc-800 pb-2">
          Editar Información
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-zinc-400">URL del Avatar</label>
          <input name="avatar_url" value={avatar} onChange={e => setAvatar(e.target.value)} type="url" placeholder="https://ejemplo.com/avatar.png" className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none transition-colors" style={{ outlineColor: themeColor }} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-zinc-400">URL del Banner</label>
          <input name="banner_url" value={banner} onChange={e => setBanner(e.target.value)} type="url" placeholder="https://ejemplo.com/banner.png" className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none transition-colors" style={{ outlineColor: themeColor }} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-zinc-400">Color de Tema</label>
          <div className="flex items-center gap-4">
            <input name="theme_color" value={themeColor} onChange={e => setThemeColor(e.target.value)} type="color" className="w-12 h-12 rounded cursor-pointer bg-zinc-950 border-0" />
            <span className="font-mono text-zinc-300 bg-zinc-900 px-3 py-1 rounded border border-zinc-800 uppercase tracking-widest text-sm">{themeColor}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-zinc-400">Rango Competitivo</label>
          <select name="competitive_rank" value={rank} onChange={e => setRank(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none transition-colors appearance-none" style={{ outlineColor: themeColor }}>
            <option value="Unranked">Unranked</option>
            <option value="Bronce">Bronce</option>
            <option value="Plata">Plata</option>
            <option value="Oro">Oro</option>
            <option value="Platino">Platino</option>
            <option value="Diamante">Diamante</option>
            <option value="Maestro">Maestro</option>
            <option value="Gran Maestro">Gran Maestro</option>
            <option value="Challenger">Challenger</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-zinc-400">Biografía</label>
          <textarea name="bio" value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Cuéntanos sobre ti, tus juegos favoritos..." className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:outline-none transition-colors resize-none" style={{ outlineColor: themeColor }}></textarea>
        </div>

        <button disabled={isPending} type="submit" className="mt-4 px-6 py-3 font-bold uppercase tracking-wider text-black rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none" style={{ backgroundColor: themeColor, boxShadow: `0 0 15px ${themeColor}40` }}>
          {isPending ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>

      {/* VISTA PREVIA */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold font-[var(--font-display)] uppercase text-zinc-100 border-b border-zinc-800 pb-2">
          Vista Previa
        </h2>
        
        <div className="bg-zinc-900 border rounded-2xl overflow-hidden shadow-2xl relative group transition-all duration-300 hover:scale-[1.01]" style={{ borderColor: `${themeColor}40` }}>
          {/* Banner */}
          <div className="h-36 w-full bg-zinc-800 relative">
            {banner ? (
              /* eslint-disable-next-line @next/next/no-img-element */
<img src={banner} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-80" />
          </div>

          {/* Avatar & Info */}
          <div className="px-6 pb-6 relative">
            <div className="flex justify-between items-end -mt-14 mb-4">
              <div className="w-28 h-28 rounded-2xl border-4 border-zinc-900 overflow-hidden bg-zinc-800 shadow-xl" style={{ borderColor: themeColor }} >
                {avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
<img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-bold font-[var(--font-display)] uppercase" style={{ backgroundColor: themeColor, color: '#000' }}>
                    {user.username.charAt(0)}
                  </div>
                )}
              </div>
              <div className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border" style={{ backgroundColor: `${themeColor}20`, color: themeColor, borderColor: `${themeColor}50` }}>
                {rank}
              </div>
            </div>

            <h3 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
              {user.username}
              {user.role === 'ADMIN' && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase tracking-wider border border-red-500/30">Admin</span>}
              {user.role === 'CAPTAIN' && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded uppercase tracking-wider border border-yellow-500/30">Capitán</span>}
            </h3>
            
            <p className="text-zinc-400 text-sm mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }}></span>
              {user.email} • {user.region}
            </p>
            
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {bio || <span className="text-zinc-600 italic">Este jugador aún no tiene una biografía. El misterio le rodea...</span>}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
