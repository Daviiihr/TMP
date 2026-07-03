import { describe, it, expect, vi } from "vitest";
import PlayerProfilePage from "@/app/player/[username]/page";
import { notFound } from "next/navigation";
import { render } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

const mockFindByUsername = vi.fn();
vi.mock("@/repositories/user.repository", () => {
  return {
    UserRepository: class {
      findByUsername = mockFindByUsername;
    },
  };
});

describe("PlayerProfilePage", () => {
  it("should call notFound if user does not exist", async () => {
    mockFindByUsername.mockResolvedValue(null);
    const params = Promise.resolve({ username: "unknown" });

    await expect(PlayerProfilePage({ params })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );

    expect(notFound).toHaveBeenCalled();
  });

  it("should render player profile if user exists", async () => {
    mockFindByUsername.mockResolvedValue({
      username: "GamerX",
      role: "PLAYER",
      region: "NA",
      bio: "Hello world",
    });
    const params = Promise.resolve({ username: "GamerX" });

    const page = await PlayerProfilePage({ params });
    const { getByText } = render(page as React.ReactElement);

    expect(getByText(/GamerX/i)).toBeInTheDocument();
    expect(getByText(/Jugador de NA/i)).toBeInTheDocument();
    expect(getByText(/Hello world/i)).toBeInTheDocument();
  });
});
