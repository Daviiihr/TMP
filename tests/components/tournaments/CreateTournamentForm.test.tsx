import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateTournamentForm } from "@/app/tournaments/create/components/CreateTournamentForm";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("CreateTournamentForm", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    global.fetch = vi.fn();
  });

  it("renders step 1 and validates required fields", () => {
    render(<CreateTournamentForm type="INDIVIDUAL" />);

    expect(screen.getByText("Información General")).toBeInTheDocument();

    // Click next without filling fields
    fireEvent.click(screen.getByText("Siguiente →"));

    expect(
      screen.getByText(
        "Por favor completa todos los campos de información básica.",
      ),
    ).toBeInTheDocument();
  });

  it("progresses through steps and submits successfully", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<CreateTournamentForm type="TEAM" />);

    // Step 1
    fireEvent.change(screen.getByPlaceholderText("Ej. Global Masters 2026"), {
      target: { value: "My Tourney" },
    });
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "Valorant" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej. NA, EU, LATAM"), {
      target: { value: "LATAM" },
    });
    fireEvent.change(screen.getAllByRole("combobox")[1], {
      target: { value: "SINGLE_ELIMINATION" },
    });

    fireEvent.click(screen.getByText("Siguiente →"));

    // Step 2
    expect(
      screen.getByText("Restricciones de Inscripción"),
    ).toBeInTheDocument();

    const inputs = screen.getAllByRole("spinbutton"); // max_players and players_per_team
    fireEvent.change(inputs[0], { target: { value: "16" } });
    fireEvent.change(inputs[1], { target: { value: "5" } });

    fireEvent.click(screen.getByText("Siguiente →"));

    // Step 3
    expect(screen.getByText("Cronograma del Evento")).toBeInTheDocument();

    // Use quick dates
    fireEvent.click(screen.getByText("Torneo Hoy"));

    // Submit
    fireEvent.click(screen.getByText("Publicar Torneo"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tournaments",
        expect.any(Object),
      );
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("handles API errors on submit", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Server error" }),
    });

    render(<CreateTournamentForm type="INDIVIDUAL" />);

    // Step 1
    fireEvent.change(screen.getByPlaceholderText("Ej. Global Masters 2026"), {
      target: { value: "My Tourney" },
    });
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "Valorant" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej. NA, EU, LATAM"), {
      target: { value: "LATAM" },
    });
    fireEvent.change(screen.getAllByRole("combobox")[1], {
      target: { value: "SINGLE_ELIMINATION" },
    });
    fireEvent.click(screen.getByText("Siguiente →"));

    // Step 2
    fireEvent.click(screen.getByText("Siguiente →"));

    // Step 3
    fireEvent.click(screen.getByText("Este Finde")); // testing another quick date
    fireEvent.click(screen.getByText("Publicar Torneo"));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });
});
