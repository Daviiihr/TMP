import { describe, it, expect } from "vitest";
import {
  validateTournamentCreation,
  assertAdminAccess,
  TournamentCreationInput,
} from "./tournament.rules";
import { AuthUser } from "@/lib/auth";

describe("tournament.rules", () => {
  describe("assertAdminAccess", () => {
    it("should throw if session is null", () => {
      expect(() => assertAdminAccess(null)).toThrow("Sesion no iniciada.");
    });

    it("should throw if user is not ADMIN", () => {
      const user = { role: "PLAYER" } as AuthUser;
      expect(() => assertAdminAccess(user)).toThrow(
        "Solo usuarios administradores pueden realizar esta accion.",
      );
    });

    it("should not throw if user is ADMIN", () => {
      const user = { role: "ADMIN" } as AuthUser;
      expect(() => assertAdminAccess(user)).not.toThrow();
    });
  });

  describe("validateTournamentCreation", () => {
    const validBaseInput: TournamentCreationInput = {
      name: "My Tournament",
      game: "Valorant",
      regions: ["LATAM"],
      type: "INDIVIDUAL",
      eliminationMode: "SINGLE_ELIMINATION",
      maxPlayers: 8,
      startDate: "2024-01-01",
      endDate: "2024-01-10",
      registrationClosesAt: "2023-12-31",
      organizerId: "org-1",
    };

    it("should return valid input for individual tournament", () => {
      const result = validateTournamentCreation(validBaseInput);
      expect(result.name).toBe("My Tournament");
      expect(result.type).toBe("INDIVIDUAL");
      expect(result.playersPerTeam).toBeNull();
    });

    it("should return valid input for team tournament", () => {
      const teamInput = {
        ...validBaseInput,
        type: "TEAM",
        playersPerTeam: 5,
      };
      const result = validateTournamentCreation(teamInput);
      expect(result.type).toBe("TEAM");
      expect(result.playersPerTeam).toBe(5);
    });

    it("should throw if required fields are missing", () => {
      const invalidInput = { ...validBaseInput, name: "" };
      expect(() => validateTournamentCreation(invalidInput)).toThrow(
        "Faltan campos obligatorios para crear el torneo.",
      );
    });

    it("should throw for invalid tournament type", () => {
      const invalidInput = { ...validBaseInput, type: "INVALID_TYPE" };
      expect(() => validateTournamentCreation(invalidInput)).toThrow(
        "Tipo de torneo invalido. Debe ser: INDIVIDUAL, TEAM.",
      );
    });

    it("should throw for invalid elimination mode", () => {
      const invalidInput = { ...validBaseInput, eliminationMode: "NONE" };
      expect(() => validateTournamentCreation(invalidInput)).toThrow(
        "Modalidad invalida. Debe ser: SINGLE_ELIMINATION, DOUBLE_ELIMINATION.",
      );
    });

    it("should throw if maxPlayers is less than MIN_TOURNAMENT_PARTICIPANTS", () => {
      const invalidInput = { ...validBaseInput, maxPlayers: 3 };
      expect(() => validateTournamentCreation(invalidInput)).toThrow(
        "El torneo debe permitir al menos 4 participantes.",
      );
    });

    it("should throw if team tournament has no playersPerTeam", () => {
      const invalidInput = { ...validBaseInput, type: "TEAM", playersPerTeam: null };
      expect(() => validateTournamentCreation(invalidInput)).toThrow(
        "Los torneos por equipo deben definir al menos 1 jugador por equipo.",
      );
    });

    it("should throw if individual tournament defines playersPerTeam", () => {
      const invalidInput = { ...validBaseInput, type: "INDIVIDUAL", playersPerTeam: 1 };
      expect(() => validateTournamentCreation(invalidInput)).toThrow(
        "Los torneos individuales no deben definir jugadores por equipo.",
      );
    });
  });
});
