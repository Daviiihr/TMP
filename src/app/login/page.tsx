"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulación de llamada al backend (NestJS)
    console.log("Intentando iniciar sesión con:", { email, password });
    
    setTimeout(() => {
      setIsLoading(false);
      alert("Conecta el backend de NestJS para validar las credenciales");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden p-4">
      {/* Efectos de fondo (Glow Orbs) */}
      <div className="glow-orb w-[500px] h-[500px] bg-arena-cyan top-[-10%] left-[-10%] opacity-20" />
      <div className="glow-orb w-[500px] h-[500px] bg-arena-magenta bottom-[-10%] right-[-10%] opacity-20" />
      
      {/* Fondo de rejilla sutil */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-arena-cyan to-arena-magenta text-white font-black text-3xl mb-4 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            T
          </div>
          <h1 className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tighter text-white">
            Acceso a la <span className="text-transparent bg-clip-text bg-gradient-to-r from-arena-cyan to-arena-magenta">Arena</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest">Tournament Manager Pro</p>
        </div>

        {/* Tarjeta de Login */}
        <div className="glass-card gradient-border rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-arena-cyan transition-all duration-300"
                placeholder="nombre@example"
              />
            </div>

            {/* Campo Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Contraseña
                </label>
                <a href="#" className="text-[10px] text-arena-cyan hover:underline">¿Olvidaste tu clave?</a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-arena-magenta transition-all duration-300"
                placeholder="••••••••"
              />
            </div>

            {/* Botón de Ingreso */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-arena-cyan to-arena-cyan-dim text-zinc-950 font-black uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Validando...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Footer de la tarjeta */}
          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-arena-cyan font-bold hover:underline">
                Crea una gratis
              </Link>
            </p>
          </div>
        </div>

        {/* Botón Volver */}
        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-zinc-600 text-xs uppercase tracking-widest hover:text-zinc-400 transition-colors">
            ← Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
