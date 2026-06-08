import type { AuthUser } from "@/lib/auth";

export const MIN_TOURNAMENT_PARTICIPANTS = 4;

export const TOURNAMENT_TYPES = ["INDIVIDUAL", "TEAM"] as const;
export type TournamentType = (typeof TOURNAMENT_TYPES)[number];

export const ELIMINATION_MODES = ["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION"] as const;
export type EliminationMode = (typeof ELIMINATION_MODES)[number];

export type TournamentCreationInput = {
  name?: string | null;
  game?: string | null;
  regions?: string[];
  type?: string | null;
  eliminationMode?: string | null;
  maxPlayers?: number;
  playersPerTeam?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  registrationClosesAt?: string | null;
  organizerId: string;
};

export type ValidTournamentCreationInput = {
  name: string;
  game: string;
  regions: string[];
  type: TournamentType;
  eliminationMode: EliminationMode;
  maxPlayers: number;
  playersPerTeam: number | null;
  startDate: string;
  endDate: string;
  registrationClosesAt: string;
  organizerId: string;
};

function isTournamentType(value: string): value is TournamentType {
  return TOURNAMENT_TYPES.includes(value as TournamentType);
}

function isEliminationMode(value: string): value is EliminationMode {
  return ELIMINATION_MODES.includes(value as EliminationMode);
}

export function assertAdminAccess(session: AuthUser | null): asserts session is AuthUser {
  if (!session) {
    throw new Error("Sesion no iniciada.");
  }

  if (session.role !== "ADMIN") {
    throw new Error("Solo usuarios administradores pueden realizar esta accion.");
  }
}

export function validateTournamentCreation(input: TournamentCreationInput): ValidTournamentCreationInput {
  const name = input.name?.trim();
  const game = input.game?.trim();
  const regions = input.regions?.map((region) => region.trim()).filter(Boolean) ?? [];
  const type = input.type?.trim().toUpperCase() ?? "INDIVIDUAL";
  const eliminationMode = input.eliminationMode?.trim().toUpperCase() ?? "";

  if (!name || !game || regions.length === 0 || !input.startDate || !input.endDate || !input.registrationClosesAt) {
    throw new Error("Faltan campos obligatorios para crear el torneo.");
  }

  if (!isTournamentType(type)) {
    throw new Error(`Tipo de torneo invalido. Debe ser: ${TOURNAMENT_TYPES.join(", ")}.`);
  }

  if (!isEliminationMode(eliminationMode)) {
    throw new Error(`Modalidad invalida. Debe ser: ${ELIMINATION_MODES.join(", ")}.`);
  }

  const maxPlayers = input.maxPlayers;
  if (typeof maxPlayers !== "number" || !Number.isInteger(maxPlayers) || maxPlayers < MIN_TOURNAMENT_PARTICIPANTS) {
    throw new Error(`El torneo debe permitir al menos ${MIN_TOURNAMENT_PARTICIPANTS} participantes.`);
  }

  const playersPerTeam = input.playersPerTeam ?? null;
  if (type === "TEAM" && (typeof playersPerTeam !== "number" || !Number.isInteger(playersPerTeam) || playersPerTeam < 1)) {
    throw new Error("Los torneos por equipo deben definir al menos 1 jugador por equipo.");
  }

  if (type === "INDIVIDUAL" && playersPerTeam !== null) {
    throw new Error("Los torneos individuales no deben definir jugadores por equipo.");
  }

  return {
    name,
    game,
    regions,
    type,
    eliminationMode,
    maxPlayers,
    playersPerTeam,
    startDate: input.startDate,
    endDate: input.endDate,
    registrationClosesAt: input.registrationClosesAt,
    organizerId: input.organizerId,
  };
}
