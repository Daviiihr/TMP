"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import BracketView from "@/components/BracketView";
import { BracketResult } from "@/lib/algorithms/brackets";

export default function PublicBracketPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.id;

  const [bracketData, setBracketData] = useState<BracketResult | null>(null);
  const [eliminationMode, setEliminationMode] = useState<"SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION">("SINGLE_ELIMINATION");
  const [isLoading, setIsLoading] = useState(true);

  const fetchBracket = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/brackets`);
      const data = await res.json();
      if (data.bracketData) {
        setBracketData(data.bracketData);
        setEliminationMode(data.eliminationMode);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchBracket();

    // Sincronización automática (Short-Polling cada 5 segundos) para tiempo real
    const interval = setInterval(() => {
      fetchBracket();
    }, 5000);

    return () => clearInterval(interval);
  }, [tournamentId]);

  return (
    <main className="min-h-screen bg-[#09090b] text-white px-4 py-20 md:px-8 relative overflow-hidden">
      {/* Glow effect elements */}
      <div className="glow-orb w-[500px] h-[500px] bg-arena-magenta top-[-10%] right-[-10%] opacity-15 absolute rounded-full blur-[100px] pointer-events-none" />
      <div className="glow-orb w-[500px] h-[500px] bg-arena-cyan bottom-[-10%] left-[-10%] opacity-15 absolute rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/tournaments"
            className="text-xs text-zinc-500 hover:text-arena-cyan transition-colors uppercase tracking-widest mb-4 inline-block font-bold"
          >
            ← Volver a Torneos
          </Link>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-r from-arena-magenta via-arena-cyan to-arena-magenta bg-clip-text text-transparent">
            Bracket en Vivo
          </h1>
          <p className="text-zinc-400 mt-2 text-sm md:text-base">
            Sigue los resultados de este torneo en tiempo real. 
            Modo: {eliminationMode === "SINGLE_ELIMINATION" ? "Eliminación Simple" : "Eliminación Doble"}
          </p>
        </div>

        {/* Bracket Visualization */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur p-6 min-h-[500px]">
          {isLoading && !bracketData ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-8 h-8 border-4 border-arena-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">Cargando bracket en tiempo real...</p>
            </div>
          ) : !bracketData ? (
            <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20">
              <p className="text-zinc-500 font-medium text-lg mb-2">El bracket aún no ha sido generado.</p>
              <p className="text-xs text-zinc-650">El organizador abrirá el bracket cuando finalicen las inscripciones.</p>
            </div>
          ) : (
            <div className="bracket-scroll-container overflow-x-auto pb-4">
              {/* Le pasamos result pero SIN los handlers onMatchUpdate, así queda en modo Solo Lectura */}
              <BracketView result={bracketData} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
