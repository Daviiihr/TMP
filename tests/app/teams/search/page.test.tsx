import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SearchTeamsPage from "@/app/teams/search/page";
import { getSession } from "@/lib/session";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/repositories/team.repository", () => {
  const TeamRepository = vi.fn();
  TeamRepository.prototype.searchTeams = vi.fn().mockResolvedValue([]);
  return { TeamRepository };
});

vi.mock("@/factories/app.factory", () => ({
  AppFactory: vi.fn(),
  appFactory: {
    getUserRepository: vi.fn(),
    getTeamRepository: vi.fn(),
    getTournamentRepository: vi.fn(),
    createTeamService: vi.fn().mockReturnValue({
      searchTeams: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock("@/components/teams/SearchTeamsClient", () => ({
  default: () => <div data-testid="search-teams-client">Client</div>,
}));

describe("SearchTeamsPage", () => {
  it("renders the search teams page", async () => {
    (getSession as any).mockResolvedValue({ id: "1", role: "USER" });
    const jsx = await SearchTeamsPage();
    render(jsx);
    expect(screen.getByTestId("search-teams-client")).toBeInTheDocument();
  });
});
