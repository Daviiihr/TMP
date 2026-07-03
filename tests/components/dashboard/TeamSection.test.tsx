import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TeamSection from "@/components/dashboard/TeamSection";

describe("TeamSection", () => {
  it("renders empty state when no teams", () => {
    render(<TeamSection teams={[]} userId="user-1" />);

    expect(screen.getByText("Mis Equipos")).toBeInTheDocument();
    expect(screen.getByText("¿Aún no tienes equipo?")).toBeInTheDocument();
    expect(screen.getByText("+ Crear Equipo")).toBeInTheDocument();
    expect(screen.getByText("Buscar Equipo")).toBeInTheDocument();
  });

  it("renders teams when available", () => {
    const teams = [
      {
        id: "1",
        name: "Alpha",
        size: 5,
        member_count: 2,
        captain_id: "user-1",
      } as any,
      {
        id: "2",
        name: "Beta",
        size: 5,
        member_count: 5,
        captain_id: "user-2",
      } as any,
    ];

    render(<TeamSection teams={teams} userId="user-1" />);

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
    expect(screen.getByText("Capitán")).toBeInTheDocument();

    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("5 / 5")).toBeInTheDocument();
    expect(screen.getByText("Miembro")).toBeInTheDocument();
  });
});
