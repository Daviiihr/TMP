"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface RankingRow {
  position: number;
  username: string;
  country: string;
  points: number;
  wins: number;
  losses: number;
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingRow[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [session, setSession] = useState<{ username: string } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;

    const loadRankings = async () => {
      setIsLoading(true);
      try {
        const url = selectedCountry
          ? `/api/ranking?country=${encodeURIComponent(selectedCountry)}`
          : "/api/ranking";
        const res = await fetch(url);
        const data = await res.json();
        if (active && data.ok) {
          setRankings(data.rankings || []);
        }
      } catch (error) {
        console.error("Error al cargar rankings:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadRankings();

    // Obtener sesión de forma segura del cliente
    fetch("/api/auth/login")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (active && data && data.user) {
          setSession(data.user);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [selectedCountry, refreshTrigger]);

  // Ejecutar recálculo / Sembrado de datos
  const handleRecalculate = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/ranking/recalculate?seed=true", {
        method: "POST",
      });
      const data = await res.json();
      alert(data.message || "Rankings recalculados.");
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      alert("Error al recalcular.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtrar en memoria por buscador de usuario
  const filteredRankings = rankings.filter((r) =>
    r.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const countries = [
    "Chile",
    "Argentina",
    "México",
    "España",
    "Colombia",
    "Perú",
    "Uruguay",
    "Venezuela",
    "Ecuador",
    "Estados Unidos",
  ];

  return (
    <main className="min-h-screen bg-[#09090b] text-white px-4 py-20 md:px-8 relative overflow-hidden">
      {/* Glow effects */}
      <div className="glow-orb w-[500px] h-[500px] bg-arena-cyan top-[-10%] left-[-10%] opacity-15" />
      <div className="glow-orb w-[500px] h-[500px] bg-arena-magenta bottom-[-10%] right-[-10%] opacity-15" />

      {/* Background grid */}
      <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-arena-cyan transition-colors uppercase tracking-widest mb-4 inline-block font-bold"
            >
              ← Volver al Inicio
            </Link>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-r from-arena-cyan via-arena-magenta to-arena-cyan bg-clip-text text-transparent">
              Ranking de Competidores
            </h1>
            <p className="text-zinc-400 mt-2 text-sm">
              Consulta la clasificación global o por país. Los puntos se
              calculan en base a victorias (+3 pts) y derrotas (+1 pt) en
              torneos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRecalculate}
              disabled={isUpdating}
              className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-arena-cyan/50 hover:text-arena-cyan font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-arena-cyan border-t-transparent rounded-full animate-spin" />
                  Actualizando...
                </>
              ) : (
                "🔄 Recalcular / Sembrar Semillas"
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur p-6 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-1/3 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Filtrar por País
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-arena-cyan/50"
            >
              <option value="">🌎 Todos los países (Global)</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/2 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Buscar Jugador
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escribe el nombre de usuario..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-arena-cyan/50"
            />
          </div>
        </div>

        {/* Podium Top 3 (Only shown when not loading, query is empty, and list has players) */}
        {!isLoading && filteredRankings.length >= 3 && searchQuery === "" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-end">
            {/* 2nd place */}
            <div className="order-2 md:order-1 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-center relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-400 to-zinc-200" />
              <div className="w-12 h-12 bg-zinc-800 text-zinc-300 font-black text-xl rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-zinc-400 shadow-[0_0_15px_rgba(200,200,200,0.15)]">
                2
              </div>
              <h3 className="font-bold text-lg text-white group-hover:text-arena-cyan transition-colors">
                {filteredRankings[1].username}
              </h3>
              <p className="text-xs text-zinc-500 uppercase mt-1 tracking-wider">
                {filteredRankings[1].country}
              </p>
              <p className="text-2xl font-black text-white mt-4">
                {filteredRankings[1].points.toLocaleString()}{" "}
                <span className="text-xs text-zinc-400 font-bold">PTS</span>
              </p>
              <div className="mt-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                W: {filteredRankings[1].wins} · L: {filteredRankings[1].losses}
              </div>
            </div>

            {/* 1st place */}
            <div className="order-1 md:order-2 bg-gradient-to-b from-arena-cyan/10 to-zinc-900/40 border-2 border-arena-cyan rounded-3xl p-8 text-center relative overflow-hidden group hover:border-arena-cyan-dim hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all duration-500 md:transform md:-translate-y-4">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-arena-cyan to-arena-cyan-dim" />
              <div className="w-16 h-16 bg-arena-cyan text-zinc-950 font-black text-2xl rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-arena-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                👑
              </div>
              <h3 className="font-black text-2xl text-white group-hover:text-arena-cyan transition-colors">
                {filteredRankings[0].username}
              </h3>
              <p className="text-xs text-arena-cyan font-bold uppercase mt-1 tracking-widest">
                {filteredRankings[0].country}
              </p>
              <p className="text-3xl font-black text-white mt-4">
                {filteredRankings[0].points.toLocaleString()}{" "}
                <span className="text-xs text-arena-cyan font-bold">PTS</span>
              </p>
              <div className="mt-2 text-xs text-zinc-400 uppercase tracking-widest font-semibold">
                W: {filteredRankings[0].wins} · L: {filteredRankings[0].losses}
              </div>
            </div>

            {/* 3rd place */}
            <div className="order-3 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 text-center relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-700 to-amber-500" />
              <div className="w-12 h-12 bg-zinc-800 text-amber-600 font-black text-xl rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-600 shadow-[0_0_15px_rgba(180,83,9,0.15)]">
                3
              </div>
              <h3 className="font-bold text-lg text-white group-hover:text-arena-cyan transition-colors">
                {filteredRankings[2].username}
              </h3>
              <p className="text-xs text-zinc-500 uppercase mt-1 tracking-wider">
                {filteredRankings[2].country}
              </p>
              <p className="text-2xl font-black text-white mt-4">
                {filteredRankings[2].points.toLocaleString()}{" "}
                <span className="text-xs text-zinc-400 font-bold">PTS</span>
              </p>
              <div className="mt-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                W: {filteredRankings[2].wins} · L: {filteredRankings[2].losses}
              </div>
            </div>
          </div>
        )}

        {/* Rankings Table */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-4 border-arena-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">
                Cargando la arena de competición...
              </p>
            </div>
          ) : filteredRankings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <p className="text-lg text-zinc-500 font-medium mb-2">
                No hay competidores registrados.
              </p>
              <p className="text-xs text-zinc-600 max-w-sm">
                Presiona el botón de &apos;🔄 Recalcular / Sembrar
                Semillas&apos; en la parte superior para generar partidas y
                usuarios ficticios de demostración.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 bg-zinc-900/30 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 text-center w-20">Rango</th>
                    <th className="py-4 px-6">Jugador</th>
                    <th className="py-4 px-6">País</th>
                    <th className="py-4 px-6 text-center">Partidas Jugadas</th>
                    <th className="py-4 px-6 text-center">
                      Victorias / Derrotas
                    </th>
                    <th className="py-4 px-6 text-center">Tasa de Victoria</th>
                    <th className="py-4 px-6 text-right">Puntos Totales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/50">
                  {filteredRankings.map((row) => {
                    const totalMatches = row.wins + row.losses;
                    const winRate =
                      totalMatches > 0
                        ? ((row.wins / totalMatches) * 100).toFixed(0)
                        : "0";
                    const isCurrentUser =
                      session && session.username === row.username;

                    return (
                      <tr
                        key={row.username}
                        className={`transition-colors hover:bg-white/[0.02] ${
                          isCurrentUser
                            ? "bg-arena-cyan/5 border-l-2 border-l-arena-cyan"
                            : ""
                        }`}
                      >
                        <td className="py-4 px-6 text-center">
                          {row.position === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-zinc-950 font-black text-xs shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                              1
                            </span>
                          ) : row.position === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-300 text-zinc-950 font-black text-xs shadow-[0_0_10px_rgba(200,200,200,0.2)]">
                              2
                            </span>
                          ) : row.position === 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-zinc-950 font-black text-xs shadow-[0_0_10px_rgba(180,83,9,0.2)]">
                              3
                            </span>
                          ) : (
                            <span className="text-zinc-500 font-bold">
                              {row.position}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-medium text-white">
                          <div className="flex items-center gap-2">
                            <span>{row.username}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-arena-cyan text-zinc-950 uppercase tracking-widest font-black">
                                TÚ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs text-zinc-300 font-semibold bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            {row.country}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-sm font-semibold text-zinc-400">
                          {totalMatches}
                        </td>
                        <td className="py-4 px-6 text-center text-xs tracking-wider text-zinc-400">
                          <span className="text-green-400 font-bold">
                            {row.wins} V
                          </span>
                          <span className="text-zinc-600 px-1">/</span>
                          <span className="text-red-400 font-bold">
                            {row.losses} D
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-arena-cyan h-full rounded-full"
                                style={{ width: `${winRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold w-8 text-right">
                              {winRate}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-black text-arena-cyan text-base">
                          {row.points.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
