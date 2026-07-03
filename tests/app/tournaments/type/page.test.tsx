import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SelectTournamentTypePage from "@/app/tournaments/type/page";
import { getSession } from "@/lib/session";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

describe("SelectTournamentTypePage", () => {
  it("renders the select type page", async () => {
    (getSession as any).mockResolvedValue({ id: "1", role: "ADMIN" });
    const jsx = await SelectTournamentTypePage();
    render(jsx);
    expect(screen.getByText("Tipo de Torneo")).toBeInTheDocument();
    expect(screen.getByText("Individual")).toBeInTheDocument();
    expect(screen.getByText("Por Equipos")).toBeInTheDocument();
  });
});
