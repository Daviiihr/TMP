"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AVAILABLE_GAMES = [
  "League of Legends",
  "Valorant",
  "Counter-Strike 2",
  "Dota 2",
  "Apex Legends",
  "Rocket League",
  "Overwatch 2",
  "Fortnite",
  "Street Fighter 6",
  "Tekken 8",
];

interface CreateTournamentFormProps {
  type: string;
}

export function CreateTournamentForm({ type }: CreateTournamentFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    game: "",
    regions: "",
    elimination_mode: "",
    max_players: "16",
    players_per_team: "5",
    start_date: "",
    registration_closes_at: "",
    end_date: "",
  });

  const isTeamTournament = type === "TEAM";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const setQuickDates = (preset: "hoy" | "finde" | "semana") => {
    const now = new Date();
    const fmt = (d: Date) => {
      // Ajustar a timezone local para que el input type="datetime-local" lo lea correctamente
      const tzoffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
    };

    const regDate = new Date(now);
    const startDate = new Date(now);
    const endDate = new Date(now);

    if (preset === "hoy") {
      regDate.setHours(regDate.getHours() + 1);
      startDate.setHours(startDate.getHours() + 2);
      endDate.setHours(endDate.getHours() + 5);
    } else if (preset === "finde") {
      const day = now.getDay();
      const dist = (5 - day + 7) % 7 || 7;
      regDate.setDate(now.getDate() + dist);
      regDate.setHours(18, 0, 0, 0);

      startDate.setDate(now.getDate() + dist);
      startDate.setHours(20, 0, 0, 0);

      endDate.setDate(now.getDate() + dist + 2);
      endDate.setHours(22, 0, 0, 0);
    } else if (preset === "semana") {
      regDate.setDate(now.getDate() + 7);
      regDate.setHours(12, 0, 0, 0);

      startDate.setDate(now.getDate() + 8);
      startDate.setHours(12, 0, 0, 0);

      endDate.setDate(now.getDate() + 14);
      endDate.setHours(20, 0, 0, 0);
    }

    setFormData((prev) => ({
      ...prev,
      registration_closes_at: fmt(regDate),
      start_date: fmt(startDate),
      end_date: fmt(endDate),
    }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (
        !formData.name ||
        !formData.game ||
        !formData.regions ||
        !formData.elimination_mode
      ) {
        setError("Por favor completa todos los campos de información básica.");
        return;
      }
    } else if (step === 2) {
      if (
        !formData.max_players ||
        (isTeamTournament && !formData.players_per_team)
      ) {
        setError("Por favor define las restricciones de participantes.");
        return;
      }
    }
    setError(null);
    setStep((s) => Math.min(3, s + 1));
  };

  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.start_date ||
      !formData.end_date ||
      !formData.registration_closes_at
    ) {
      setError("Por favor completa todas las fechas.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const data = new FormData();
    data.set("type", type);
    Object.entries(formData).forEach(([key, value]) => {
      // No enviar players_per_team si es torneo INDIVIDUAL para no fallar validacion del backend
      if (key === "players_per_team" && !isTeamTournament) return;
      data.set(key, value);
    });

    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        body: data,
      });

      if (response.redirected) {
        router.push(response.url);
        return;
      }

      if (!response.ok) {
        const resData = await response.json().catch(() => null);
        setError(
          resData?.message || "Ocurrió un error inesperado al crear el torneo.",
        );
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Error de red. Por favor intenta nuevamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-arena-cyan opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        {[1, 2, 3].map((num) => {
          const stepNames = ["Básicos", "Reglas", "Fechas"];
          const stepName = stepNames[num - 1];
          return (
            <div
              key={num}
              className="flex flex-col items-center flex-1 relative"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 z-10 ${
                  step >= num
                    ? "bg-arena-cyan text-zinc-950 shadow-[0_0_15px_rgba(0,242,254,0.4)]"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {num}
              </div>
              <span
                className={`text-[10px] mt-2 uppercase tracking-widest font-bold hidden md:block ${
                  step >= num ? "text-arena-cyan" : "text-zinc-500"
                }`}
              >
                {stepName}
              </span>
              {num < 3 && (
                <div
                  className={`absolute top-5 left-[50%] w-full h-[2px] -z-0 transition-colors duration-500 ${
                    step > num ? "bg-arena-cyan" : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3 mb-6 relative z-10 animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="relative z-10 min-h-[300px] flex flex-col justify-between"
      >
        {/* STEP 1: BÁSICOS */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6">
              Información General
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-400"
                >
                  Nombre del Torneo
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arena-cyan focus:bg-zinc-900 transition-all"
                  placeholder="Ej. Global Masters 2026"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="game"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-400"
                >
                  Videojuego
                </label>
                <select
                  id="game"
                  name="game"
                  value={formData.game}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arena-cyan focus:bg-zinc-900 transition-all appearance-none"
                >
                  <option value="" disabled>
                    Selecciona un juego
                  </option>
                  {AVAILABLE_GAMES.map((game) => (
                    <option key={game} value={game}>
                      {game}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="regions"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-400"
                >
                  Regiones Permitidas
                </label>
                <input
                  id="regions"
                  name="regions"
                  value={formData.regions}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arena-cyan focus:bg-zinc-900 transition-all"
                  placeholder="Ej. NA, EU, LATAM"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="elimination_mode"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-400"
                >
                  Formato del Bracket
                </label>
                <select
                  id="elimination_mode"
                  name="elimination_mode"
                  value={formData.elimination_mode}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arena-cyan focus:bg-zinc-900 transition-all appearance-none"
                >
                  <option value="" disabled>
                    Selecciona una modalidad
                  </option>
                  <option value="SINGLE_ELIMINATION">Eliminación Simple</option>
                  <option value="DOUBLE_ELIMINATION">Eliminación Doble</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: REGLAS Y RESTRICCIONES */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6">
              Restricciones de Inscripción
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="max_players"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-400"
                >
                  {isTeamTournament
                    ? "Máximo de Equipos"
                    : "Máximo de Jugadores"}
                </label>
                <input
                  id="max_players"
                  name="max_players"
                  type="number"
                  min="4"
                  value={formData.max_players}
                  onChange={handleChange}
                  className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arena-cyan focus:bg-zinc-900 transition-all"
                />
              </div>

              {isTeamTournament && (
                <div className="space-y-2">
                  <label
                    htmlFor="players_per_team"
                    className="text-xs font-bold uppercase tracking-wider text-zinc-400"
                  >
                    Jugadores por Equipo
                  </label>
                  <input
                    id="players_per_team"
                    name="players_per_team"
                    type="number"
                    min="1"
                    value={formData.players_per_team}
                    onChange={handleChange}
                    className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-arena-cyan focus:bg-zinc-900 transition-all"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: FECHAS */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white">
                Cronograma del Evento
              </h2>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setQuickDates("hoy")}
                  className="whitespace-nowrap px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold uppercase transition-colors"
                >
                  Torneo Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDates("finde")}
                  className="whitespace-nowrap px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold uppercase transition-colors"
                >
                  Este Finde
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDates("semana")}
                  className="whitespace-nowrap px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold uppercase transition-colors"
                >
                  Próx. Semana
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2 bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/50 transition-all focus-within:border-arena-cyan focus-within:bg-zinc-900/50">
                <label
                  htmlFor="registration_closes_at"
                  className="text-xs font-bold uppercase tracking-wider text-arena-cyan"
                >
                  Fase 1: Fin de Inscripciones
                </label>
                <input
                  id="registration_closes_at"
                  name="registration_closes_at"
                  type="datetime-local"
                  value={formData.registration_closes_at}
                  onChange={handleChange}
                  className="w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-arena-cyan focus:outline-none transition-all cursor-pointer"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div className="space-y-2 bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/50 transition-all focus-within:border-[#9d4edd] focus-within:bg-zinc-900/50">
                <label
                  htmlFor="start_date"
                  className="text-xs font-bold uppercase tracking-wider text-[#9d4edd]"
                >
                  Fase 2: Inicio de Partidas (Check-in)
                </label>
                <input
                  id="start_date"
                  name="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-[#9d4edd] focus:outline-none transition-all cursor-pointer"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div className="space-y-2 bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/50 transition-all focus-within:border-zinc-500 focus-within:bg-zinc-900/50">
                <label
                  htmlFor="end_date"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-400"
                >
                  Fase 3: Gran Final (Estimada)
                </label>
                <input
                  id="end_date"
                  name="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-zinc-500 focus:outline-none transition-all cursor-pointer"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-zinc-800">
          <button
            type="button"
            onClick={prevStep}
            className={`px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all ${step === 1 ? "invisible" : "visible"}`}
          >
            ← Atrás
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-8 py-3 bg-white text-zinc-950 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-arena-cyan text-zinc-950 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#00d0db] transition-all shadow-[0_0_20px_rgba(0,242,254,0.3)] disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
              )}
              {isLoading ? "Creando..." : "Publicar Torneo"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
