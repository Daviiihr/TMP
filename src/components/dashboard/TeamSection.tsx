import React from "react";
import Link from "next/link";
import { TeamWithMemberCount } from "@/repositories/team.repository";

export default function TeamSection({ teams, userId }: { teams: TeamWithMemberCount[]; userId: string }) {
  return (
    <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-6">
        Mis Equipos
      </h2>
      <div className="space-y-4">
        {teams.length === 0 ? (
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
        ) : (
          <>
            {teams.map((team) => (
              <div key={team.id} className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-white">{team.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Miembros: <span className="text-arena-cyan">{team.member_count} / {team.size}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {team.captain_id === userId ? "Capitán" : "Miembro"}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Link
                href="/teams/create"
                className="flex-1 px-4 py-2 text-center text-xs font-bold uppercase tracking-widest bg-arena-cyan text-zinc-950 rounded-lg hover:bg-arena-cyan-dim transition-colors"
              >
                + Crear Equipo
              </Link>
              <Link
                href="/teams/search"
                className="flex-1 px-4 py-2 text-center text-xs font-bold uppercase tracking-widest bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Buscar Equipo
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
