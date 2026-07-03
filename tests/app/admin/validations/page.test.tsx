import { render, screen, waitFor } from "@testing-library/react";
import ValidationsPage from "@/app/admin/validations/page";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

global.fetch = vi.fn();

describe("ValidationsPage", () => {
  beforeEach(() => {
    vi.mocked(global.fetch).mockReset();
  });

  it("should render page skeleton initially", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ validations: [] }),
    } as any);

    render(<ValidationsPage />);
    expect(screen.getByText(/Validar/i)).toBeInTheDocument();
  });

  it("should render error state", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
    } as any);

    render(<ValidationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Error al obtener las validaciones/i),
      ).toBeInTheDocument();
    });
  });

  it("should render validations", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        validations: [
          {
            validation_id: "v1",
            match_id: "m1",
            score_participant1: 2,
            score_participant2: 1,
            participant1_name: "P1",
            participant2_name: "P2",
            tournament_name: "T1",
            round_label: "Final",
          },
        ],
      }),
    } as any);

    render(<ValidationsPage />);

    await waitFor(() => {
      expect(screen.getByText("P1")).toBeInTheDocument();
    });

    expect(screen.getByText("P2")).toBeInTheDocument();
    expect(screen.getByText(/T1/i)).toBeInTheDocument();
  });
});
