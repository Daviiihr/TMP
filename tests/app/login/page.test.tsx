import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "@/app/login/page";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("LoginPage", () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter);
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Iniciar Sesión/i }),
    ).toBeInTheDocument();
  });

  it("shows error for invalid email", async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const submitButton = screen.getByRole("button", {
      name: /Iniciar Sesión/i,
    });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.submit(submitButton.closest("form")!);

    expect(
      screen.getByText("Por favor, ingresa un correo electrónico válido."),
    ).toBeInTheDocument();
  });

  it("shows error for empty password", async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const submitButton = screen.getByRole("button", {
      name: /Iniciar Sesión/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.submit(submitButton.closest("form")!);

    expect(
      screen.getByText("Por favor, ingresa tu contraseña."),
    ).toBeInTheDocument();
  });

  it("handles successful login and redirects", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ redirect: "/dashboard" }),
    });

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const passwordInput = screen.getByLabelText(/Contraseña/i);
    const submitButton = screen.getByRole("button", {
      name: /Iniciar Sesión/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.submit(submitButton.closest("form")!);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("handles login error", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Credenciales inválidas" }),
    });

    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const passwordInput = screen.getByLabelText(/Contraseña/i);
    const submitButton = screen.getByRole("button", {
      name: /Iniciar Sesión/i,
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.submit(submitButton.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Credenciales inválidas")).toBeInTheDocument();
    });
  });

  it("toggles password visibility", () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/Contraseña/i);

    expect(passwordInput).toHaveAttribute("type", "password");

    // Find the toggle button which is inside the password input wrapper
    const toggleButton = passwordInput.nextElementSibling;
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "text");

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    }
  });
});
