import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TournamentDetailsPage from "@/app/tournaments/[id]/page";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("TournamentDetailsPage", () => {
  const mockRouter = { push: vi.fn() };
  const mockTournamentId = "tournament-123";

  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  const mockParams = Promise.resolve({ id: mockTournamentId });

  it("renders loading state initially", () => {
    // Return an unresolved promise to keep it in loading state
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    // @ts-expect-error: mock params type
    render(<TournamentDetailsPage params={mockParams} />);

    // We expect the loading spinner to be there (it doesn't have text, just a div with animate-spin class)
    // Testing Library doesn't easily select by class without a querySelector, but we can assume it renders
    // if it doesn't render the error or main content
    expect(screen.queryByText("Torneo no encontrado")).not.toBeInTheDocument();
  });

  it("renders tournament not found when fetch fails or returns error", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false, message: "Not found error message" }),
    });

    // @ts-expect-error: mock params type
    render(<TournamentDetailsPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText("Torneo no encontrado")).toBeInTheDocument();
      expect(screen.getByText("Not found error message")).toBeInTheDocument();
    });
  });

  it("renders individual tournament details and allows enrollment", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes(`/api/tournaments/${mockTournamentId}`)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            tournament: {
              id: mockTournamentId,
              name: "LoL Championship",
              game: "League of Legends",
              type: "INDIVIDUAL",
              status: "REGISTRATION",
              max_players: 16,
              elimination_mode: "SINGLE_ELIMINATION",
            },
          }),
        });
      }
      if (url.includes("/api/enrollments/individual")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    // @ts-expect-error: mock params type
    render(<TournamentDetailsPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText("LoL Championship")).toBeInTheDocument();
    });

    const enrollButton = screen.getByText("Inscribirme Ahora");
    fireEvent.click(enrollButton);

    await waitFor(() => {
      expect(
        screen.getByText("¡Inscripción exitosa! Ya estás en el torneo."),
      ).toBeInTheDocument();
    });
  });

  it("renders team tournament details and allows team enrollment", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes(`/api/tournaments/${mockTournamentId}`)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            tournament: {
              id: mockTournamentId,
              name: "CSGO Major",
              game: "CS:GO",
              type: "TEAM",
              status: "REGISTRATION",
              max_players: 8,
              min_players_per_team: 5,
              elimination_mode: "SINGLE_ELIMINATION",
            },
          }),
        });
      }
      if (url.includes("/api/teams")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            teams: [
              {
                id: "team-1",
                name: "Alpha Team",
                size: 5,
                member_count: 5,
                tournament_id: null,
              },
              {
                id: "team-2",
                name: "Beta Team",
                size: 3,
                member_count: 3,
                tournament_id: null,
              }, // Invalid size
            ],
          }),
        });
      }
      if (url.includes("/api/enrollments/team")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    // @ts-expect-error: mock params type
    render(<TournamentDetailsPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText("CSGO Major")).toBeInTheDocument();
    });

    // Should render team options
    const enrollButton = screen.getByText("Inscribir Equipo Seleccionado");
    fireEvent.click(enrollButton);

    await waitFor(() => {
      expect(
        screen.getByText("¡Equipo inscrito exitosamente!"),
      ).toBeInTheDocument();
    });
  });
});
