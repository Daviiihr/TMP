import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CreateTournamentPage from "@/app/tournaments/create/page";
import { getSession } from "@/lib/session";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/app/tournaments/create/components/CreateTournamentForm", () => ({
  CreateTournamentForm: () => (
    <div data-testid="create-tournament-form">Form</div>
  ),
}));

describe("CreateTournamentPage", () => {
  it("renders the create tournament page", async () => {
    (getSession as any).mockResolvedValue({ id: "1", role: "ADMIN" });
    const jsx = await CreateTournamentPage({
      searchParams: Promise.resolve({ type: "INDIVIDUAL" }),
    });
    render(jsx);
    expect(screen.getByText(/Crear Torneo/i)).toBeInTheDocument();
    expect(screen.getByTestId("create-tournament-form")).toBeInTheDocument();
  });
});
