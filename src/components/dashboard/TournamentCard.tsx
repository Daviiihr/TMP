"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TournamentCardProps = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  hasActiveTournament: boolean;
};

export default function TournamentCard({ id, name, status, createdAt, hasActiveTournament }: TournamentCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isActive = status === "REGISTRATION";
  const isDraft = status === "DRAFT";
  const isFinished = status === "COMPLETED" || status === "CANCELLED";

  const toggleStatus = async () => {
    if (loading) return;
    
    const newStatus = isActive ? "DRAFT" : "REGISTRATION";
    
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!data.ok) {
        alert(data.message);
      }
      router.refresh();
    } catch {
      alert("Error al cambiar el estado del torneo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-zinc-950/50 rounded-lg border transition-colors ${
      isActive 
        ? 'border-arena-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.07)]' 
        : 'border-zinc-800 hover:border-zinc-700'
    }`}>
      <div className="flex items-center gap-3">
        {/* Indicador de estado */}
        <div className={`w-2.5 h-2.5 rounded-full ${
          isActive ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)] animate-pulse' 
          : isDraft ? 'bg-zinc-600' 
          : 'bg-red-400/50'
        }`} />
        <div>
          <h3 className="font-bold text-white">{name}</h3>
          <p className="text-xs text-zinc-500 mt-1">Creado: {createdAt}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${
          isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' 
          : isDraft ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
          : status === 'CANCELLED' ? 'bg-red-500/20 text-red-400 border-red-500/30'
          : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        }`}>
          {isActive ? '● ACTIVO' : status}
        </span>
        
        {!isFinished && (
          <button 
            onClick={toggleStatus}
            disabled={loading || (!isActive && hasActiveTournament)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
              isActive 
                ? 'text-zinc-400 border-zinc-700 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10' 
                : 'text-arena-cyan border-arena-cyan/30 hover:bg-arena-cyan/10 hover:border-arena-cyan/60'
            }`}
            title={!isActive && hasActiveTournament ? "Ya tienes un torneo activo" : ""}
          >
            {loading ? '...' : isActive ? 'Desactivar' : 'Activar'}
          </button>
        )}

        <button className="text-xs font-bold uppercase text-white hover:text-arena-cyan transition-colors">
          Gestionar →
        </button>
      </div>
    </div>
  );
}
