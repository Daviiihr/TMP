"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const router = useRouter();

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      triggerError("Por favor, ingresa un correo electrónico válido.");
      return;
    }
    if (!password) {
      triggerError("Por favor, ingresa tu contraseña.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as {
        message?: string;
        redirect?: string;
      };

      if (!response.ok) {
        triggerError(
          data.message ||
            "Usuario o contraseña incorrectos, por favor verifique.",
        );
        return;
      }

      if (data.redirect) {
        router.push(data.redirect);
      }
    } catch {
      triggerError("No se pudo conectar con el servidor.");
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
            Acceso a la{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-arena-cyan to-arena-magenta">
              Arena
            </span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2 uppercase tracking-widest">
            Tournament Manager Pro
          </p>
        </div>

        {/* Tarjeta de Login */}
        <div
          className={`glass-card gradient-border rounded-3xl p-8 shadow-2xl transition-transform ${isShaking ? "animate-shake" : ""}`}
        >
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
                placeholder="nombre@example"
              />
            </div>

            {/* Campo Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label
                  htmlFor="password"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-400"
                >
                  Contraseña
                </label>
                <Link
                  href="/recuperar-clave"
                  className="text-[10px] text-arena-cyan hover:underline"
                >
                  ¿Olvidaste tu clave?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) =>
                    setIsCapsLockOn(e.getModifierState("CapsLock"))
                  }
                  onKeyDown={(e) =>
                    setIsCapsLockOn(e.getModifierState("CapsLock"))
                  }
                  aria-invalid={!!errorMessage}
                  aria-describedby={errorMessage ? "error-message" : undefined}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-900/50 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-arena-magenta transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  )}
                </button>
              </div>
              {isCapsLockOn && (
                <div className="text-amber-500 text-[10px] mt-1 flex items-center gap-1 font-semibold ml-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m10.273 2.513-.523.902L2.097 16.71c-.722 1.246.177 2.79 1.616 2.79h16.574c1.439 0 2.338-1.544 1.616-2.79L14.25 3.415c-.723-1.246-2.52-1.246-3.243 0l-.523.902Z" />
                    <line x1="12" x2="12" y1="9" y2="13" />
                    <line x1="12" x2="12.01" y1="17" y2="17" />
                  </svg>
                  Bloq Mayús activado
                </div>
              )}
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
              <Link
                href="/register"
                className="text-arena-cyan font-bold hover:underline"
              >
                Crea una gratis
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
