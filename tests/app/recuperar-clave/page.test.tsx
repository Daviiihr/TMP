import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecuperarClavePage from "@/app/recuperar-clave/page";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("RecuperarClavePage", () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
    vi.clearAllMocks();
  });

  it("renders recuperar clave form", () => {
    render(<RecuperarClavePage />);
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Enviar Enlace/i }),
    ).toBeInTheDocument();
  });

  it("shows error for invalid email", async () => {
    render(<RecuperarClavePage />);
    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const submitButton = screen.getByRole("button", { name: /Enviar Enlace/i });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.submit(submitButton.closest("form")!);

    await waitFor(() => {
      expect(
        screen.getByText("Por favor, ingresa un correo electrónico válido."),
      ).toBeInTheDocument();
    });
  });

  it("handles successful submission and shows success message", async () => {
    render(<RecuperarClavePage />);
    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const submitButton = screen.getByRole("button", { name: /Enviar Enlace/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.submit(submitButton.closest("form")!);

    await waitFor(
      () => {
        expect(
          screen.getByText(
            "Si el correo existe en nuestro sistema, te hemos enviado un enlace para restablecer tu contraseña.",
          ),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    const backButton = screen.getByRole("button", { name: /Volver al login/i });
    fireEvent.click(backButton);
    expect(mockRouter.push).toHaveBeenCalledWith("/login");
  });
});
