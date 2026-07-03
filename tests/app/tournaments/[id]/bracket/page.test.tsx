import { render, screen, act, waitFor } from "@testing-library/react";
import PublicBracketPage from "@/app/tournaments/[id]/bracket/page";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/components/BracketView", () => ({
  default: () => <div data-testid="bracket-view">BracketView</div>,
}));

describe("PublicBracketPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state and fetch bracket", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        bracketData: { rounds: [] },
        eliminationMode: "SINGLE_ELIMINATION",
      }),
    });

    const params = Promise.resolve({ id: "1" });

    await act(async () => {
      render(<PublicBracketPage params={params} />);
    });

    expect(screen.getByText(/Bracket en Vivo/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("bracket-view")).toBeInTheDocument();
    });
  });

  it("should display empty state if no bracket data", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({}),
    });

    const params = Promise.resolve({ id: "1" });

    await act(async () => {
      render(<PublicBracketPage params={params} />);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/El bracket aún no ha sido generado/i),
      ).toBeInTheDocument();
    });
  });
});
