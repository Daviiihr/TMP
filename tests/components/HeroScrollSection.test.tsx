import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HeroScrollSection from "@/components/HeroScrollSection";

// Mock GSAP and @gsap/react
vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
    matchMedia: vi.fn(() => ({
      add: vi.fn((_query, callback) => callback()),
    })),
    timeline: vi.fn(() => ({
      to: vi.fn(),
      fromTo: vi.fn(),
    })),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: vi.fn(),
}));

vi.mock("@gsap/react", () => ({
  useGSAP: vi.fn((callback) => callback()), // Execute immediately for tests
}));

describe("HeroScrollSection", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  it("renders correctly and fetches active tournaments", async () => {
    (global.fetch as any).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: true, count: 5 }),
    });

    render(<HeroScrollSection />);

    expect(screen.getByText("Domina")).toBeInTheDocument();
    expect(screen.getByText("La Arena")).toBeInTheDocument();
    expect(screen.getByText("Únete ahora")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/5/i)).toBeInTheDocument();
    });
  });

  it("handles fetch error gracefully", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    render(<HeroScrollSection />);

    expect(screen.getByText("Domina")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/\.\.\./i)).toBeInTheDocument();
    });
  });
});
