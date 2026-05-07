"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    region: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = (await response.json()) as { message?: string };

      alert(data.message ?? "Cuenta creada exitosamente.");

      if (response.ok) {
        window.location.href = "/login";
      }
    } catch {
      alert("No se pudo conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden p-4">
      {/* Efectos de fondo (Glow Orbs) */}
      <div className="glow-orb w-[500px] h-[500px] bg-arena-magenta top-[-10%] right-[-10%] opacity-20" />
      <div className="glow-orb w-[500px] h-[500px] bg-arena-cyan bottom-[-10%] left-[-10%] opacity-20" />
      
      {/* Fondo de rejilla sutil */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-arena-magenta to-arena-cyan text-white font-black text-3xl mb-4 shadow-[0_0_30px_rgba(232,80,112,0.3)]">
            T
          </div>
          <h1 className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tighter text-white">
            Únete a la <span className="text-transparent bg-clip-text bg-gradient-to-r from-arena-magenta to-arena-cyan">Arena</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest">Crea tu cuenta de competidor</p>
        </div>

        {/* Tarjeta de Registro */}
        <div className="glass-card gradient-border rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Nombre de Usuario */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">
                Nombre de Usuario
              </label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-arena-magenta transition-all duration-300"
                placeholder="Ej: ProPlayer_99"
              />
            </div>

            {/* Campo Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-arena-magenta transition-all duration-300"
                placeholder="correo@example"
              />
            </div>

            {/* Campo Región (Importante para RN02 del SRS) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">
                Región Geográfica
              </label>
              <select
                name="region"
                required
                value={formData.region}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-arena-magenta transition-all duration-300 appearance-none"
              >
                <option value="" disabled>Selecciona tu región</option>
                <option value="NA">Norteamérica (NA)</option>
                <option value="EU">Europa (EU)</option>
                <option value="LATAM">Latinoamérica (LATAM)</option>
                <option value="ASIA">Asia (ASIA)</option>
              </select>
            </div>

            {/* Campo Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-arena-magenta transition-all duration-300"
                placeholder="••••••••"
              />
            </div>

            {/* Botón de Registro */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-arena-magenta to-arena-cyan text-white font-black uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(232,80,112,0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                "Registrarse ahora"
              )}
            </button>
          </form>

          {/* Footer de la tarjeta */}
          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-arena-magenta font-bold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        {/* Botón Volver */}
        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-zinc-600 text-xs uppercase tracking-widest hover:text-zinc-400 transition-colors"
          >
            ← Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
