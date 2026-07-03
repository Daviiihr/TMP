"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ValidationRow {
  validation_id: string;
  match_id: string;
  score_participant1: number;
  score_participant2: number;
  created_at: string;
  participant1_name: string | null;
  participant2_name: string | null;
  round_label: string | null;
  round_number: number;
  match_number: number;
  tournament_id: string;
  tournament_name: string;
}

export default function ValidationsPage() {
  const [validations, setValidations] = useState<ValidationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal de rechazo
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingValidationId, setRejectingValidationId] = useState<
    string | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchValidations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/validations");
      if (!res.ok) throw new Error("Error al obtener las validaciones");
      const data = await res.json();
      setValidations(data.validations || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchValidations(), 0);
    return () => clearTimeout(t);
  }, []);

  const handleApprove = async (id: string) => {
    if (
      !confirm(
        "¿Estás seguro de aprobar este resultado? El bracket avanzará automáticamente.",
      )
    )
      return;

    try {
      setProcessingId(id);
      const res = await fetch(`/api/admin/validations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al aprobar");

      setValidations((prev) => prev.filter((v) => v.validation_id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingValidationId(id);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setRejectingValidationId(null);
    setRejectionReason("");
  };

  const handleReject = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rejectingValidationId) return;

    try {
      setProcessingId(rejectingValidationId);
      const res = await fetch(
        `/api/admin/validations/${rejectingValidationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "REJECTED", rejectionReason }),
        },
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al rechazar");

      setValidations((prev) =>
        prev.filter((v) => v.validation_id !== rejectingValidationId),
      );
      closeRejectModal();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-bold font-[var(--font-display)] uppercase tracking-tighter text-white">
              Validar <span className="text-arena-magenta">Resultados</span>
            </h1>
            <p className="text-zinc-400">
              Revisa los resultados pendientes reportados por los jugadores.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold uppercase tracking-widest text-white bg-zinc-800 border border-zinc-700 rounded-lg transition-all duration-300 hover:bg-zinc-700"
          >
            Volver al Dashboard
          </Link>
        </header>

        {(() => {
          if (loading) {
            return (
              <div className="flex justify-center items-center py-20">
                <div className="w-10 h-10 border-4 border-arena-magenta border-t-transparent rounded-full animate-spin"></div>
              </div>
            );
          }
          if (error) {
            return (
              <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl text-red-400 text-center">
                {error}
              </div>
            );
          }
          if (validations.length === 0) {
            return (
              <div className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-2xl py-20 text-center">
                <svg
                  className="w-16 h-16 text-zinc-700 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h2 className="text-xl font-bold text-white mb-2">
                  Todo al día
                </h2>
                <p className="text-zinc-500">
                  No hay resultados pendientes de validación en este momento.
                </p>
              </div>
            );
          }
          return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-950/80 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Torneo</th>
                      <th className="px-6 py-4 font-semibold">Partido</th>
                      <th className="px-6 py-4 font-semibold">Participantes</th>
                      <th className="px-6 py-4 font-semibold">
                        Resultado Reportado
                      </th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {validations.map((val) => (
                      <tr
                        key={val.validation_id}
                        className="hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">
                            {val.tournament_name}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {new Date(val.created_at).toLocaleString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-800 text-xs font-medium text-zinc-300">
                            {val.round_label || `Ronda ${val.round_number}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={
                                val.score_participant1 > val.score_participant2
                                  ? "text-arena-cyan font-bold"
                                  : "text-zinc-300"
                              }
                            >
                              {val.participant1_name || "TBD"}
                            </span>
                            <span className="text-zinc-600 text-[10px] uppercase font-bold">
                              vs
                            </span>
                            <span
                              className={
                                val.score_participant2 > val.score_participant1
                                  ? "text-arena-cyan font-bold"
                                  : "text-zinc-300"
                              }
                            >
                              {val.participant2_name || "TBD"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 font-mono text-lg font-black">
                            <span
                              className={
                                val.score_participant1 > val.score_participant2
                                  ? "text-arena-cyan"
                                  : "text-zinc-400"
                              }
                            >
                              {val.score_participant1}
                            </span>
                            <span className="text-zinc-600">{" - "}</span>
                            <span
                              className={
                                val.score_participant2 > val.score_participant1
                                  ? "text-arena-cyan"
                                  : "text-zinc-400"
                              }
                            >
                              {val.score_participant2}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openRejectModal(val.validation_id)}
                            disabled={processingId === val.validation_id}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-zinc-800 border border-zinc-700 rounded hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-colors disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                          <button
                            onClick={() => handleApprove(val.validation_id)}
                            disabled={processingId === val.validation_id}
                            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-900 bg-arena-cyan rounded hover:bg-white transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)] hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] disabled:opacity-50"
                          >
                            {processingId === val.validation_id
                              ? "..."
                              : "Aprobar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal Rechazo */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">
                Rechazar Resultado
              </h3>
              <p className="text-sm text-zinc-400 mb-6">
                Indica el motivo por el cual estás rechazando este resultado
                reportado. Los jugadores podrán volver a reportarlo.
              </p>

              <form onSubmit={handleReject}>
                <div className="space-y-4 mb-8">
                  <div>
                    <label
                      htmlFor="rejectionReason"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2"
                    >
                      Motivo (Opcional)
                    </label>
                    <textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-arena-magenta transition-colors resize-none h-24"
                      placeholder="Ej. Evidencia insuficiente, puntaje irreal..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={closeRejectModal}
                    className="px-4 py-2 text-sm font-bold text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={processingId === rejectingValidationId}
                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processingId === rejectingValidationId
                      ? "Rechazando..."
                      : "Confirmar Rechazo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
