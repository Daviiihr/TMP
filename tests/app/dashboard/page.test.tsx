import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "@/app/dashboard/page";
import * as sessionModule from "@/lib/session";
import { appFactory } from "@/factories/app.factory";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirected");
  }),
  useRouter: vi.fn(),
}));

// Mock repositories
const { mockTournamentRepo, mockTeamRepo, mockRankingRepo } = vi.hoisted(
  () => ({
    mockTournamentRepo: {
      findByOrganizer: vi.fn(),
      getUserParticipationHistory: vi.fn(),
    },
    mockTeamRepo: {
      findByMember: vi.fn(),
    },
    mockRankingRepo: {
      getRankingsByCountry: vi.fn(),
      getUserRanking: vi.fn(),
    },
  }),
);

vi.mock("@/factories/app.factory", () => ({
  appFactory: {
    createTournamentRepository: () => mockTournamentRepo,
    createTeamRepository: () => mockTeamRepo,
    createRankingRepository: () => mockRankingRepo,
  },
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTournamentRepo.findByOrganizer.mockResolvedValue([]);
    mockTournamentRepo.getUserParticipationHistory.mockResolvedValue([]);
    mockTeamRepo.findByMember.mockResolvedValue([]);
    mockRankingRepo.getRankingsByCountry.mockResolvedValue([]);
    mockRankingRepo.getUserRanking.mockResolvedValue(null);
  });

  it("redirects to home if no session", async () => {
    (sessionModule.getSession as any).mockResolvedValue(null);
    const { redirect } = await import("next/navigation");

    try {
      await DashboardPage();
    } catch (e: any) {
      if (e.message !== "redirected") throw e;
    }

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders dashboard for regular player", async () => {
    (sessionModule.getSession as any).mockResolvedValue({
      id: "user1",
      username: "TestPlayer",
      role: "PLAYER",
    });

    const jsx = await DashboardPage();
    render(jsx);

    expect(screen.getByText(/TestPlayer/i)).toBeInTheDocument();
    expect(screen.queryByText("Panel Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Crear Torneo")).not.toBeInTheDocument();
  });

  it("renders dashboard for admin", async () => {
    (sessionModule.getSession as any).mockResolvedValue({
      id: "admin1",
      username: "AdminUser",
      role: "ADMIN",
    });

    mockTournamentRepo.findByOrganizer.mockResolvedValue([
      {
        id: "t1",
        name: "Admin Tourney",
        status: "REGISTRATION",
        created_at: new Date().toISOString(),
      },
    ]);

    const jsx = await DashboardPage();
    render(jsx);

    expect(screen.getByText(/AdminUser/i)).toBeInTheDocument();
    expect(screen.getByText("Panel Admin")).toBeInTheDocument();
    expect(screen.getByText("Crear Torneo")).toBeInTheDocument();
    expect(screen.getByText("Admin Tourney")).toBeInTheDocument();
  });

  it("renders participation history", async () => {
    (sessionModule.getSession as any).mockResolvedValue({
      id: "user1",
      username: "TestPlayer",
      role: "PLAYER",
    });

    mockTournamentRepo.getUserParticipationHistory.mockResolvedValue([
      {
        id: "t1",
        name: "Past Tourney",
        type: "INDIVIDUAL",
        status: "COMPLETED",
        game: "LOL",
        created_at: new Date().toISOString(),
      },
    ]);

    const jsx = await DashboardPage();
    render(jsx);

    expect(screen.getByText("Past Tourney")).toBeInTheDocument();
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
  });

  it("renders ranking information", async () => {
    (sessionModule.getSession as any).mockResolvedValue({
      id: "user1",
      username: "TestPlayer",
      role: "PLAYER",
    });

    mockRankingRepo.getRankingsByCountry.mockResolvedValue([
      { username: "TopPlayer", position: 1, country: "Chile", points: 1000 },
    ]);
    mockRankingRepo.getUserRanking.mockResolvedValue({
      username: "TestPlayer",
      position: 5,
      country: "Chile",
      points: 500,
    });

    const jsx = await DashboardPage();
    render(jsx);

    expect(screen.getByText("TopPlayer")).toBeInTheDocument();
    expect(screen.getByText(/Tú estás en la posición #5/i)).toBeInTheDocument();
  });
});
