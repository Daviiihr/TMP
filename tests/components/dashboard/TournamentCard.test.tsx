import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TournamentCard from "@/components/dashboard/TournamentCard";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

describe("TournamentCard", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  const defaultProps = {
    id: "t1",
    name: "Copa Verano",
    status: "DRAFT",
    createdAt: "2024-01-01",
    hasActiveTournament: false,
  };

  it("renders draft tournament correctly", () => {
    render(<TournamentCard {...defaultProps} />);

    expect(screen.getByText("Copa Verano")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(screen.getByText("Activar")).toBeInTheDocument();
    expect(screen.getByText("Gestionar →")).toBeInTheDocument();
  });

  it("renders active tournament correctly", () => {
    render(<TournamentCard {...defaultProps} status="REGISTRATION" />);

    expect(screen.getByText("● ACTIVO")).toBeInTheDocument();
    expect(screen.getByText("Desactivar")).toBeInTheDocument();
  });

  it("disables activate button if user has active tournament", () => {
    render(<TournamentCard {...defaultProps} hasActiveTournament={true} />);

    const btn = screen.getByRole("button", { name: "Activar" });
    expect(btn).toBeDisabled();
  });

  it("calls API to activate tournament", async () => {
    (global.fetch as any).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: true }),
    });

    render(<TournamentCard {...defaultProps} />);

    const btn = screen.getByRole("button", { name: "Activar" });
    fireEvent.click(btn);

    expect(global.fetch).toHaveBeenCalledWith("/api/tournaments/t1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REGISTRATION" }),
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows alert on API error", async () => {
    (global.fetch as any).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: false, message: "Invalid state" }),
    });

    render(<TournamentCard {...defaultProps} />);

    const btn = screen.getByRole("button", { name: "Activar" });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Invalid state");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows generic alert on fetch failure", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    render(<TournamentCard {...defaultProps} />);

    const btn = screen.getByRole("button", { name: "Activar" });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Error al cambiar el estado del torneo.",
      );
    });
  });
});
