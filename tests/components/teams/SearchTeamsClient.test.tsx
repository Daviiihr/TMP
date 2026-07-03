import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SearchTeamsClient from "@/components/teams/SearchTeamsClient";

describe("SearchTeamsClient", () => {
  const initialTeams = [
    {
      id: "1",
      name: "Alpha",
      size: 5,
      member_count: 2,
      captain_id: "c1",
    } as any,
    {
      id: "2",
      name: "Beta",
      size: 5,
      member_count: 5,
      captain_id: "c2",
    } as any,
  ];

  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  it("renders initial teams correctly", () => {
    render(<SearchTeamsClient initialTeams={initialTeams} />);

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();

    const joinButtons = screen.getAllByRole("button", {
      name: /Unirse|Lleno/i,
    });
    expect(joinButtons[0]).toHaveTextContent("Unirse");
    expect(joinButtons[0]).not.toBeDisabled();

    expect(joinButtons[1]).toHaveTextContent("Lleno");
    expect(joinButtons[1]).toBeDisabled();
  });

  it("handles search correctly", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ teams: [initialTeams[0]] }),
    });

    render(<SearchTeamsClient initialTeams={initialTeams} />);

    const input = screen.getByPlaceholderText(
      "Escribe el nombre del equipo...",
    );
    fireEvent.change(input, { target: { value: "Alpha" } });

    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(global.fetch).toHaveBeenCalledWith("/api/teams/search?q=Alpha");

    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeInTheDocument();
      expect(screen.queryByText("Beta")).not.toBeInTheDocument();
    });
  });

  it("handles search error", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: "Search error" }),
    });

    render(<SearchTeamsClient initialTeams={initialTeams} />);

    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(screen.getByText("Search error")).toBeInTheDocument();
    });
  });

  it("handles join successfully", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/teams/join") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Joined successfully" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ teams: initialTeams }),
      });
    });

    render(<SearchTeamsClient initialTeams={initialTeams} />);

    const joinButtons = screen.getAllByRole("button", {
      name: /Unirse|Lleno/i,
    });
    fireEvent.click(joinButtons[0]);

    expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/teams/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: "1" }),
    });

    await waitFor(() => {
      expect(screen.getByText("Joined successfully")).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledTimes(2); // join + loadTeams
    });
  });

  it("handles join error", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: "Cannot join" }),
    });

    render(<SearchTeamsClient initialTeams={initialTeams} />);

    const joinButtons = screen.getAllByRole("button", {
      name: /Unirse|Lleno/i,
    });
    fireEvent.click(joinButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Cannot join")).toBeInTheDocument();
    });
  });
});
