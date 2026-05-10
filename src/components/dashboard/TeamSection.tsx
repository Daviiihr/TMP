import React from "react";
import Link from "next/link";

export default function TeamSection() {
  return (
    <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-6">
        Mis Equipos
      </h2>
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50 mb-4">
          <p className="text-zinc-500 font-medium mb-4">¿Aún no tienes equipo?</p>
          <div className="flex gap-3">
            <Link 
              href="/teams/create" 
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-arena-cyan text-zinc-950 rounded-lg hover:bg-arena-cyan-dim transition-colors"
            >
              + Crear Equipo
            </Link>
            <Link 
              href="/teams/search" 
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Buscar Equipo
            </Link>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Tus equipos aparecerán aquí</p>
        </div>
      </div>
    </section>
  );
}
