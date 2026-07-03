import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CreateTeamPage from "@/app/teams/create/page";
import { getSession } from "@/lib/session";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/components/teams/CreateTeamForm", () => ({
  default: () => <div data-testid="create-team-form">Form</div>,
}));

describe("CreateTeamPage", () => {
  it("renders the create team page", async () => {
    (getSession as any).mockResolvedValue({ id: "1", role: "USER" });
    const jsx = await CreateTeamPage();
    render(jsx);
    expect(screen.getByText("Crear Equipo")).toBeInTheDocument();
    expect(screen.getByTestId("create-team-form")).toBeInTheDocument();
  });
});
