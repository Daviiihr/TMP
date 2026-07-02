"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RecuperarClavePage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const router = useRouter();

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage("");
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      triggerError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    setIsLoading(true);

    try {
      // Aquí iría la llamada a tu API real, por ejemplo:
      // const response = await fetch("/api/auth/recuperar-clave", { ... });

      // Simulamos un tiempo de carga para demostrar la UI
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccessMessage(
        "Si el correo existe en nuestro sistema, te hemos enviado un enlace para restablecer tu contraseña.",
      );
      setEmail("");
    } catch {
      triggerError("No se pudo procesar la solicitud. Inténtalo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden p-4">
      {/* Efectos de fondo (Glow Orbs) */}
      <div className="glow-orb w-[500px] h-[500px] bg-arena-cyan top-[-10%] left-[-10%] opacity-20" />
      <div className="glow-orb w-[500px] h-[500px] bg-arena-magenta bottom-[-10%] right-[-10%] opacity-20" />

      {/* Fondo de rejilla sutil */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-arena-cyan to-arena-magenta text-white font-black text-3xl mb-4 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            T
          </div>
          <h1 className="font-[var(--font-display)] text-4xl font-black uppercase tracking-tighter text-white">
            Recuperar{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-arena-cyan to-arena-magenta">
              Clave
            </span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest">
            Ingresa tu correo para continuar
          </p>
        </div>

        {/* Tarjeta de Recuperación */}
        <div
          className={`glass-card gradient-border rounded-3xl p-8 shadow-2xl transition-transform ${isShaking ? "animate-shake" : ""}`}
        >
          {successMessage ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center border border-green-500/20 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm">
                {successMessage}
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full py-4 mt-4 bg-zinc-800 text-white font-black uppercase tracking-widest rounded-xl transition-all duration-300 hover:bg-zinc-700 active:scale-95"
              >
                Volver al login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1"
                >
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errorMessage}
                  aria-describedby={errorMessage ? "error-message" : undefined}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-arena-cyan transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="nombre@example.com"
                />
              </div>

              {/* Mensaje de Error */}
              {errorMessage && (
                <div
                  id="error-message"
                  role="alert"
                  className="text-red-500 text-sm font-semibold text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20"
                >
                  {errorMessage}
                </div>
              )}

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-arena-cyan to-arena-cyan-dim text-zinc-950 font-black uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  "Enviar Enlace"
                )}
              </button>
            </form>
          )}

          {/* Footer de la tarjeta */}
          {!successMessage && (
            <div className="mt-8 text-center">
              <p className="text-zinc-500 text-sm">
                ¿Recordaste tu contraseña?{" "}
                <Link
                  href="/login"
                  className="text-arena-cyan font-bold hover:underline"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
