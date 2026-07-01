"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import BracketView from "@/components/BracketView";
import { Participant, BracketResult } from "@/lib/algorithms/brackets";
import "./panel.css";

export default function TournamentPanelPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tournamentId = resolvedParams.id;
  const router = useRouter();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [eliminationMode, setEliminationMode] = useState<"SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION">("SINGLE_ELIMINATION");
  const [bracketData, setBracketData] = useState<BracketResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    }
  };

  useEffect(() => {
    // Cargar participantes guardados localmente
    const saved = localStorage.getItem(`tournament_${tournamentId}_participants`);
    if (saved) {
      try {
        setParticipants(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar participantes", e);
      }
    }
    
    // Fetch active bracket initial load
    fetchBracket();
  }, [tournamentId]);

  useEffect(() => {
    // Guardar participantes en localStorage cada vez que cambian
    if (participants.length > 0 || localStorage.getItem(`tournament_${tournamentId}_participants`)) {
      localStorage.setItem(`tournament_${tournamentId}_participants`, JSON.stringify(participants));
    }
  }, [participants, tournamentId]);

  useEffect(() => {
    // Sincronización automática (Short-Polling cada 5 segundos)
    if (!bracketData) return;
    const interval = setInterval(() => {
      fetchBracket();
    }, 5000);
    return () => clearInterval(interval);
  }, [tournamentId, bracketData]);

  useEffect(() => {
    const delayFn = setTimeout(() => {
      fetch(`/api/players/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (data.users) setSearchResults(data.users);
        })
        .catch(console.error);
    }, 300);
    return () => clearTimeout(delayFn);
  }, [searchQuery]);

  const addParticipant = (user: { id: string; name: string }) => {
    if (!participants.find(p => p.id === user.id)) {
      setParticipants([...participants, { id: user.id, name: user.name, seed: participants.length + 1 }]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const loadEnrolledPlayers = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/enrollments`);
      const data = await res.json();
      
      if (data.players && data.players.length > 0) {
        // Merge without duplicates
        const currentIds = new Set(participants.map(p => p.id));
        const newParticipants = [...participants];
        let nextSeed = participants.length + 1;
        
        data.players.forEach((player: { id: string; name: string }) => {
          if (!currentIds.has(player.id)) {
            newParticipants.push({
              id: player.id,
              name: player.name,
              seed: nextSeed++
            });
            currentIds.add(player.id);
          }
        });
        
        setParticipants(newParticipants);
      }
    } catch (err) {
      console.error("Error cargando inscritos:", err);
    }
  };

  const generateBracket = async () => {
    if (participants.length < 2) {
      setError("Se requieren al menos 2 jugadores para generar el bracket.");
      return;
    }
    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/brackets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants, eliminationMode })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar bracket");
      
      setBracketData(data.bracketData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMatchUpdate = async (matchId: string, winnerId: string, score1?: number, score2?: number) => {
    const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
      method: 'PUT',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId, score1, score2 })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar partido");
    }

    // Refrescar el bracket completo
    await fetchBracket();
  };

  const handleMatchUndo = async (matchId: string) => {
    const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}/undo`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" }
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al deshacer partido");
    }

    // Refrescar el bracket completo
    await fetchBracket();
  };

  return (
    <div className="tournament-panel">
      <header className="panel-header">
        <h1>Panel de Control del Torneo</h1>
        <p>Configura las reglas, añade jugadores usando el buscador en vivo y genera tu bracket dinámico.</p>
      </header>

      <div className="panel-content">
        <section className="settings-section glass-card">
          <h2>Instrucciones</h2>
          <ul className="instructions-list">
            <li><strong>Paso 1:</strong> Selecciona el modo de eliminación (Simple o Doble).</li>
            <li><strong>Paso 2:</strong> Busca jugadores por nombre y añádelos a la lista de participantes. (Mínimo 2)</li>
            <li><strong>Paso 3:</strong> Presiona "Generar Bracket" para visualizar el árbol del torneo en la parte inferior y guardarlo en la base de datos.</li>
          </ul>
        </section>

        <section className="participants-section glass-card">
          <div className="section-header">
            <h2>Añadir Jugadores</h2>
            <div className="mode-toggle">
              <label>
                <input 
                  type="radio" 
                  value="SINGLE_ELIMINATION" 
                  checked={eliminationMode === "SINGLE_ELIMINATION"}
                  onChange={() => setEliminationMode("SINGLE_ELIMINATION")}
                />
                Eliminación Simple
              </label>
              <label>
                <input 
                  type="radio" 
                  value="DOUBLE_ELIMINATION" 
                  checked={eliminationMode === "DOUBLE_ELIMINATION"}
                  onChange={() => setEliminationMode("DOUBLE_ELIMINATION")}
                />
                Eliminación Doble
              </label>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button 
              onClick={loadEnrolledPlayers}
              className="btn-secondary"
              title="Cargar jugadores inscritos al torneo"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: "6px", color: "white", cursor: "pointer", transition: "all 0.2s" }}
            >
              Cargar Inscritos
            </button>
          </div>

          <div className="search-container">
            <input 
              type="text" 
              placeholder="Escribe una letra para buscar jugador..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="player-search-input"
            />
            {isFocused && searchResults.length > 0 && (
              <ul className="search-dropdown">
                {searchResults.map(user => (
                  <li key={user.id} onClick={() => addParticipant(user)}>
                    {user.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="participants-list">
            <h3>Participantes Seleccionados ({participants.length})</h3>
            {participants.length === 0 ? (
              <p className="empty-text">No hay jugadores añadidos aún.</p>
            ) : (
              <ul>
                {participants.map(p => (
                  <li key={p.id}>
                    <span><span className="seed-badge">#{p.seed}</span> {p.name}</span>
                    <button onClick={() => removeParticipant(p.id)} className="remove-btn">Quitar</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            className="generate-btn" 
            onClick={generateBracket}
            disabled={isGenerating || participants.length < 2}
          >
            {isGenerating ? "Generando..." : "Generar Bracket"}
          </button>
        </section>
      </div>

      {bracketData && (
        <section className="bracket-preview-section glass-card">
          <h2>Vista Previa del Bracket (En Vivo)</h2>
          <div className="bracket-scroll-container">
            <BracketView 
              result={bracketData} 
              onMatchUpdate={handleMatchUpdate} 
              onMatchUndo={handleMatchUndo}
            />
          </div>
        </section>
      )}
    </div>
  );
}
