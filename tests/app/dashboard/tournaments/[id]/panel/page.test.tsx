import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TournamentPanelPage from "@/app/dashboard/tournaments/[id]/panel/page";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock React.use to just return the promise value since it's a synchronous mock in tests
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    use: (p: any) => {
      // Very naive mock of React.use for promises
      return typeof p.then === "function" ? p._value : p;
    },
  };
});

// Create a mock bracket view
vi.mock("@/components/BracketView", () => ({
  default: () => <div data-testid="bracket-view-mock">Bracket View</div>,
}));

describe("TournamentPanelPage", () => {
  const mockRouter = { push: vi.fn(), refresh: vi.fn() };
  let mockParamsPromise: any;

  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
    global.fetch = vi.fn();

    // Mock local storage
    Storage.prototype.getItem = vi.fn();
    Storage.prototype.setItem = vi.fn();

    mockParamsPromise = Promise.resolve({ id: "test-tourney-1" });
    mockParamsPromise._value = { id: "test-tourney-1" }; // For our fake React.use

    vi.clearAllMocks();
  });

  it("renders loading/empty state initially", () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<TournamentPanelPage params={mockParamsPromise} />);

    expect(screen.getByText("Panel de Control")).toBeInTheDocument();
    expect(screen.getAllByText("DRAFT").length).toBeGreaterThan(0);
    expect(screen.getByText("El bracket está vacío.")).toBeInTheDocument();
  });

  it("fetches and displays tournament details", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/brackets")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              bracketData: null,
              eliminationMode: "SINGLE_ELIMINATION",
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            tournament: {
              name: "My Test Tourney",
              status: "REGISTRATION",
              eliminationMode: "SINGLE_ELIMINATION",
            },
          }),
      });
    });

    render(<TournamentPanelPage params={mockParamsPromise} />);

    await waitFor(() => {
      expect(screen.getByText("My Test Tourney")).toBeInTheDocument();
    });
  });

  it("handles loading enrolled players", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/enrollments")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              players: [
                { id: "p1", name: "Player One" },
                { id: "p2", name: "Player Two" },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<TournamentPanelPage params={mockParamsPromise} />);

    const loadBtn = screen.getByRole("button", {
      name: /Cargar Inscritos Automáticamente/i,
    });
    fireEvent.click(loadBtn);

    await waitFor(() => {
      expect(screen.getByText("Player One")).toBeInTheDocument();
    });
  });

  it("updates tournament status", async () => {
    (global.fetch as any).mockImplementation((url: string, opts: any) => {
      if (opts && opts.method === "PATCH") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tournament: { status: "DRAFT" } }),
      });
    });

    render(<TournamentPanelPage params={mockParamsPromise} />);

    await waitFor(() => {
      expect(screen.getAllByText("DRAFT").length).toBeGreaterThan(0);
    });

    const progressBtn = screen.getByRole("button", { name: "IN_PROGRESS" });
    fireEvent.click(progressBtn);

    await waitFor(() => {
      expect(screen.getAllByText("IN_PROGRESS").length).toBeGreaterThan(0);
    });
  });

  it("generates bracket", async () => {
    // Need 4 players to generate bracket
    Storage.prototype.getItem = vi.fn((key) => {
      if (key.includes("participants")) {
        return JSON.stringify([
          { id: "1", name: "p1", seed: 1 },
          { id: "2", name: "p2", seed: 2 },
          { id: "3", name: "p3", seed: 3 },
          { id: "4", name: "p4", seed: 4 },
        ]);
      }
      return null;
    });

    (global.fetch as any).mockImplementation((url: string, opts: any) => {
      if (opts && opts.method === "POST" && url.includes("/brackets")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            bracketData: { rounds: [], preliminaryMatches: [] },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<TournamentPanelPage params={mockParamsPromise} />);

    await waitFor(() => {
      expect(screen.getByText("p1")).toBeInTheDocument();
    });

    const generateBtn = screen.getByRole("button", {
      name: /¡Generar Bracket!/i,
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByTestId("bracket-view-mock")).toBeInTheDocument();
    });
  });
});
