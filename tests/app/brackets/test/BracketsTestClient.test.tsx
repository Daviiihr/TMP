import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import BracketsTestClient from "@/app/brackets/test/BracketsTestClient";

vi.mock("@/lib/algorithms/brackets", () => ({
  generateBracket: vi.fn(() => ({
    rounds: [],
    preliminaryMatches: [],
    isPerfectPowerOfTwo: false,
    bracketSize: 4,
  })),
}));

describe("BracketsTestClient", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders BracketsTestClient", () => {
    render(<BracketsTestClient />);
    expect(screen.getByText("Generador de Brackets")).toBeInTheDocument();
  });

  it("allows adding a player manually", () => {
    render(<BracketsTestClient />);
    const input = screen.getByPlaceholderText(/Nombre del jugador/i);
    const addButton = screen.getByRole("button", { name: "+" });

    fireEvent.change(input, { target: { value: "Player1" } });
    fireEvent.click(addButton);

    expect(screen.getByText("Player1")).toBeInTheDocument();
  });

  it("handles searching for players and adding from results", async () => {
    vi.useRealTimers();
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        users: [{ id: "1", name: "SearchPlayer" }],
      }),
    });

    render(<BracketsTestClient />);
    const input = screen.getByPlaceholderText(/Nombre del jugador/i);

    fireEvent.change(input, { target: { value: "Search" } });

    await waitFor(() => {
      expect(screen.getByText("SearchPlayer")).toBeInTheDocument();
    });

    // Click the search result
    fireEvent.click(screen.getByText("SearchPlayer"));

    expect(screen.getByText("SearchPlayer")).toBeInTheDocument();
    vi.useFakeTimers();
  });

  it("allows removing a player", () => {
    render(<BracketsTestClient />);
    const input = screen.getByPlaceholderText(/Nombre del jugador/i);
    const addButton = screen.getByRole("button", { name: "+" });

    fireEvent.change(input, { target: { value: "PlayerToRemove" } });
    fireEvent.click(addButton);

    expect(screen.getByText("PlayerToRemove")).toBeInTheDocument();

    const removeButton = screen.getByRole("button", { name: "✕" });
    fireEvent.click(removeButton);

    expect(screen.queryByText("PlayerToRemove")).not.toBeInTheDocument();
  });

  it("allows generating a bracket with 4 players", () => {
    render(<BracketsTestClient />);
    const input = screen.getByPlaceholderText(/Nombre del jugador/i);
    const addButton = screen.getByRole("button", { name: "+" });

    for (let i = 1; i <= 4; i++) {
      fireEvent.change(input, { target: { value: `P${i}` } });
      fireEvent.click(addButton);
    }

    const generateBtn = screen.getByRole("button", {
      name: /Generar Bracket/i,
    });
    expect(generateBtn).not.toBeDisabled();

    fireEvent.click(generateBtn);

    // We mocked generateBracket, it shouldn't crash
  });

  it("allows resetting the bracket", () => {
    render(<BracketsTestClient />);
    const input = screen.getByPlaceholderText(/Nombre del jugador/i);
    const addButton = screen.getByRole("button", { name: "+" });

    fireEvent.change(input, { target: { value: "PlayerToReset" } });
    fireEvent.click(addButton);

    expect(screen.getByText("PlayerToReset")).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: /Limpiar/i });
    fireEvent.click(resetBtn);

    expect(screen.queryByText("PlayerToReset")).not.toBeInTheDocument();
  });
});
