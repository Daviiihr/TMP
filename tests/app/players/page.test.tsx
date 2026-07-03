import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PlayersSearchPage from "@/app/players/page";
import { UserRepository } from "@/repositories/user.repository";

// Mock repository
vi.mock("@/repositories/user.repository", () => {
  const UserRepository = vi.fn();
  UserRepository.prototype.searchUsers = vi.fn().mockResolvedValue([
    {
      id: "1",
      username: "ProPlayer",
      theme_color: "#ff0000",
      banner_url: "http://example.com/banner.jpg",
      avatar_url: "http://example.com/avatar.jpg",
      competitive_rank: "Diamond",
      region: "NA",
    },
  ]);
  return { UserRepository };
});

describe("PlayersSearchPage", () => {
  it("renders correctly and searches for users", async () => {
    const searchParams = Promise.resolve({ q: "Pro" });
    const jsx = await PlayersSearchPage({ searchParams });
    render(jsx);

    expect(screen.getByText("Buscador de Jugadores")).toBeInTheDocument();
    expect(screen.getByText("ProPlayer")).toBeInTheDocument();
    expect(screen.getByText("Diamond")).toBeInTheDocument();
    expect(screen.getByText("NA")).toBeInTheDocument();
  });

  it("renders empty state when no users found", async () => {
    UserRepository.prototype.searchUsers = vi.fn().mockResolvedValue([]);

    const searchParams = Promise.resolve({ q: "Unknown" });
    const jsx = await PlayersSearchPage({ searchParams });
    render(jsx);

    expect(
      screen.getByText(/No se encontraron jugadores que coincidan/i),
    ).toBeInTheDocument();
  });
});
