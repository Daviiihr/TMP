import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FeaturesSection from "@/components/FeaturesSection";

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

describe("FeaturesSection", () => {
  it("renders features header", () => {
    render(<FeaturesSection />);

    expect(screen.getByText("Características")).toBeInTheDocument();
    expect(screen.getByText("Todo lo que necesitas")).toBeInTheDocument();
    expect(screen.getByText("para competir")).toBeInTheDocument();
  });

  it("renders all feature cards", () => {
    render(<FeaturesSection />);

    expect(screen.getByText("Brackets inteligentes")).toBeInTheDocument();
    expect(screen.getByText("Inscripción transaccional")).toBeInTheDocument();
    expect(screen.getByText("Ranking dinámico")).toBeInTheDocument();
    expect(screen.getByText("Sanciones acumulativas")).toBeInTheDocument();
    expect(screen.getByText("Premios automáticos")).toBeInTheDocument();
    expect(screen.getByText("Auditoría total")).toBeInTheDocument();
  });
});
