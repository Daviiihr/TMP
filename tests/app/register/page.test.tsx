import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RegisterPage from "@/app/register/page";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    window.alert = vi.fn();
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
    vi.clearAllMocks();
  });

  it("renders register form", () => {
    const { container } = render(<RegisterPage />);
    expect(
      container.querySelector('input[name="username"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
    expect(
      container.querySelector('input[name="password"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Registrarse ahora/i }),
    ).toBeInTheDocument();
  });

  it("handles successful registration and redirects to login", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Cuenta creada exitosamente." }),
    });

    const { container } = render(<RegisterPage />);

    fireEvent.change(container.querySelector('input[name="username"]')!, {
      target: { value: "NewUser" },
    });
    fireEvent.change(container.querySelector('input[name="email"]')!, {
      target: { value: "new@example.com" },
    });
    fireEvent.change(container.querySelector('input[name="password"]')!, {
      target: { value: "pass123" },
    });
    fireEvent.change(container.querySelector('select[name="region"]')!, {
      target: { value: "LATAM" },
    });
    fireEvent.change(container.querySelector('select[name="country"]')!, {
      target: { value: "Chile" },
    });

    fireEvent.submit(
      screen
        .getByRole("button", { name: /Registrarse ahora/i })
        .closest("form")!,
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Cuenta creada exitosamente.");
      expect(window.location.href).toBe("/login");
    });
  });

  it("handles registration error", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    const { container } = render(<RegisterPage />);

    fireEvent.change(container.querySelector('input[name="username"]')!, {
      target: { value: "NewUser" },
    });
    fireEvent.change(container.querySelector('input[name="email"]')!, {
      target: { value: "new@example.com" },
    });
    fireEvent.change(container.querySelector('input[name="password"]')!, {
      target: { value: "pass123" },
    });

    fireEvent.submit(
      screen
        .getByRole("button", { name: /Registrarse ahora/i })
        .closest("form")!,
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "No se pudo conectar con el servidor.",
      );
    });
  });
});
