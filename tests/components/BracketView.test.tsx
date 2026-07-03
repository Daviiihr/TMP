import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BracketView from "@/components/BracketView";
import type { BracketResult } from "@/lib/algorithms/brackets";

describe("BracketView", () => {
  const mockResult: BracketResult = {
    totalRounds: 2,
    rounds: [
      {
        round: 1,
        label: "Semifinal",
        matches: [
          {
            id: "m1",
            round: 1,
            position: 1,
            isBye: false,
            player1: { id: "p1", name: "Player 1" },
            player2: { id: "p2", name: "Player 2" },
          },
          {
            id: "m2",
            round: 1,
            position: 2,
            isBye: false,
            player1: { id: "p3", name: "Player 3" },
            player2: { id: "p4", name: "Player 4" },
          },
        ],
      },
      {
        round: 2,
        label: "Final",
        matches: [
          {
            id: "m3",
            round: 2,
            position: 1,
            isBye: false,
            player1: undefined,
            player2: undefined,
          },
        ],
      },
    ],
    loserRounds: [],
  };

  it("renders bracket view correctly", () => {
    render(<BracketView result={mockResult} />);

    expect(screen.getByText("Llave de Ganadores")).toBeInTheDocument();

    // Players
    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    expect(screen.getByText("Player 3")).toBeInTheDocument();
    expect(screen.getByText("Player 4")).toBeInTheDocument();
  });

  it("opens modal on match click", async () => {
    const handleMatchUpdate = vi.fn();

    render(
      <BracketView result={mockResult} onMatchUpdate={handleMatchUpdate} />,
    );

    const p1 = screen.getByText("Player 1");
    const matchCard = p1.closest(".match-card")!;

    fireEvent.click(matchCard);

    expect(screen.getByText("Reportar Resultado")).toBeInTheDocument();

    // Select winner
    const p1Radio = screen.getAllByRole("radio")[0];
    fireEvent.click(p1Radio);

    // Click submit
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(handleMatchUpdate).toHaveBeenCalledWith(
        "m1",
        "p1",
        undefined,
        undefined,
      );
    });
  });

  it("undo match result works", async () => {
    const handleMatchUndo = vi.fn();
    const handleMatchUpdate = vi.fn();

    const resultWithFinishedMatch: BracketResult = {
      ...mockResult,
      rounds: [
        {
          round: 1,
          label: "Semifinal",
          matches: [
            {
              id: "m1",
              round: 1,
              position: 1,
              isBye: false,
              player1: { id: "p1", name: "Player 1" },
              player2: { id: "p2", name: "Player 2" },
              status: "FINISHED",
              winnerId: "p1",
            } as any,
          ],
        },
      ],
    };

    render(
      <BracketView
        result={resultWithFinishedMatch}
        onMatchUndo={handleMatchUndo}
        onMatchUpdate={handleMatchUpdate}
      />,
    );

    const p1 = screen.getByText("Player 1");
    const matchCard = p1.closest(".match-card")!;

    fireEvent.click(matchCard);

    expect(screen.getByText("Reportar Resultado")).toBeInTheDocument();

    // Click undo
    fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));

    await waitFor(() => {
      expect(handleMatchUndo).toHaveBeenCalledWith("m1");
    });
  });
});
