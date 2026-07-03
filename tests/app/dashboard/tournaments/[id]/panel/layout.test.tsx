import { describe, it, expect, vi } from "vitest";
import TournamentPanelLayout from "@/app/dashboard/tournaments/[id]/panel/layout";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import React from "react";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECTED");
  }),
}));

describe("TournamentPanelLayout", () => {
  it("should redirect if not admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ role: "PLAYER" } as any);

    await expect(TournamentPanelLayout({ children: "test" })).rejects.toThrow(
      "REDIRECTED",
    );
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("should redirect if no session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    await expect(TournamentPanelLayout({ children: "test" })).rejects.toThrow(
      "REDIRECTED",
    );
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("should render children if admin", async () => {
    vi.mocked(getSession).mockResolvedValue({ role: "ADMIN" } as any);

    const result = await TournamentPanelLayout({ children: "test" });
    expect(result).toBeDefined();
  });
});
