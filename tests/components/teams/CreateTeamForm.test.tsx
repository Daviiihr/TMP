import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateTeamForm from "@/components/teams/CreateTeamForm";

describe("CreateTeamForm", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  it("renders form inputs correctly", () => {
    render(<CreateTeamForm />);

    expect(screen.getByText("Nombre del Equipo")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ej. Galactic Warriors"),
    ).toBeInTheDocument();
    expect(screen.getByText("Cantidad de Integrantes")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ej. 5")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar Equipo" }),
    ).toBeInTheDocument();
  });

  it("calls API and shows success message", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ message: "Success" }),
    });

    render(<CreateTeamForm />);

    fireEvent.change(screen.getByPlaceholderText("Ej. Galactic Warriors"), {
      target: { value: "My Team" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej. 5"), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Registrar Equipo" }));

    expect(global.fetch).toHaveBeenCalledWith("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My Team", size: 3 }),
    });

    await waitFor(() => {
      expect(
        screen.getByText("Equipo creado exitosamente!"),
      ).toBeInTheDocument();
    });
  });

  it("calls API and shows error message", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: "Name taken" }),
    });

    render(<CreateTeamForm />);

    fireEvent.change(screen.getByPlaceholderText("Ej. Galactic Warriors"), {
      target: { value: "My Team" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej. 5"), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Registrar Equipo" }));

    await waitFor(() => {
      expect(screen.getByText("Name taken")).toBeInTheDocument();
    });
  });

  it("handles fetch exception", async () => {
    (global.fetch as any).mockRejectedValue(new Error("crash"));

    render(<CreateTeamForm />);

    fireEvent.change(screen.getByPlaceholderText("Ej. Galactic Warriors"), {
      target: { value: "My Team" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej. 5"), {
      target: { value: "3" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Registrar Equipo" }));

    await waitFor(() => {
      expect(
        screen.getByText("Error de conexión con el servidor"),
      ).toBeInTheDocument();
    });
  });
});
