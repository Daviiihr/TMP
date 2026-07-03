import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CTASection from "@/components/CTASection";

// Mock GSAP and @gsap/react
vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    fromTo: vi.fn(),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: vi.fn(),
}));

vi.mock("@gsap/react", () => ({
  useGSAP: vi.fn((callback) => callback()), // Execute immediately for tests
}));

describe("CTASection", () => {
  const mockTournaments = [
    {
      id: "1",
      name: "Tournament Alpha",
      status: "DRAFT",
      created_at: new Date("2024-01-01"),
    },
    {
      id: "2",
      name: "Tournament Beta",
      status: "IN_PROGRESS",
      created_at: new Date("2024-01-02"),
    },
  ];

  it("renders guest CTA correctly when no session", () => {
    render(<CTASection session={null} tournaments={[]} />);

    expect(screen.getByText("Inscripciones abiertas")).toBeInTheDocument();
    expect(screen.getByText(/¿Listo para/i)).toBeInTheDocument();
    expect(screen.getByText("competir?")).toBeInTheDocument();
    expect(screen.getByText("Crear cuenta gratis")).toBeInTheDocument();
    expect(screen.getByText("Ver todos los torneos")).toBeInTheDocument();
  });

  it("renders live view correctly when user has session and no tournaments", () => {
    render(
      <CTASection
        session={{ id: "user-1", role: "PLAYER" } as any}
        tournaments={[]}
      />,
    );

    expect(screen.getByText("En vivo")).toBeInTheDocument();
    expect(screen.getByText("Torneos")).toBeInTheDocument();
    expect(screen.getByText("disponibles")).toBeInTheDocument();
    expect(
      screen.getByText("No hay torneos disponibles en este momento."),
    ).toBeInTheDocument();
    expect(screen.getByText("Ir al panel de control →")).toBeInTheDocument();
  });

  it("renders live view correctly when user has session and active tournaments", () => {
    render(
      <CTASection
        session={{ id: "user-1", role: "PLAYER" } as any}
        tournaments={mockTournaments}
      />,
    );

    expect(screen.getByText("En vivo")).toBeInTheDocument();
    expect(screen.getByText("Tournament Alpha")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(screen.getByText("Tournament Beta")).toBeInTheDocument();
    expect(screen.getByText("IN_PROGRESS")).toBeInTheDocument();

    // There should be two "Ver más" buttons for each tournament
    const viewMoreButtons = screen.getAllByText("Ver más");
    expect(viewMoreButtons).toHaveLength(2);
  });
});
