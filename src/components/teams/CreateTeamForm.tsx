"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function CreateTeamForm({ session }: { session: any }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name");
    const size = formData.get("size");

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, size: parseInt(size as string) })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: "Equipo creado exitosamente!" });
      } else {
        setMessage({ type: 'error', text: data.message || "Error al crear el equipo" });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Error de conexión con el servidor" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-zinc-500">Nombre del Equipo</label>
          <input 
            name="name" 
            required 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors" 
            placeholder="Ej. Galactic Warriors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-zinc-500">Cantidad de Integrantes</label>
          <input 
            name="size" 
            type="number" 
            required 
            min="1"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-arena-cyan transition-colors" 
            placeholder="Ej. 5"
          />
        </div>

        {message && (
          <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            {message.text}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 text-sm font-bold uppercase tracking-widest text-zinc-950 bg-arena-cyan rounded-lg hover:bg-arena-cyan-dim transition-all duration-300 disabled:opacity-50"
        >
          {loading ? "Creando..." : "Registrar Equipo"}
        </button>
      </form>
    </div>
  );
}
