import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProfileForm from "@/app/profile/ProfileForm";

// Mock the action
vi.mock("@/app/profile/actions", () => ({
  updateProfileAction: vi.fn(),
}));

describe("ProfileForm", () => {
  const mockUser = {
    username: "TestUser",
    email: "test@example.com",
    theme_color: "#ff0000",
    avatar_url: "https://example.com/avatar.png",
    banner_url: "https://example.com/banner.png",
    bio: "Test bio",
    competitive_rank: "Oro",
    role: "PLAYER",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with user data", () => {
    render(<ProfileForm user={mockUser as any} />);

    expect(
      screen.getByDisplayValue("https://example.com/avatar.png"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://example.com/banner.png"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("#ff0000")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Oro")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test bio")).toBeInTheDocument();
  });

  it("allows changing inputs and submitting form", () => {
    render(<ProfileForm user={mockUser as any} />);

    const bioInput = screen.getByPlaceholderText(/Cuéntanos sobre ti/i);
    fireEvent.change(bioInput, { target: { value: "New bio updated" } });

    expect(screen.getByDisplayValue("New bio updated")).toBeInTheDocument();

    const submitButton = screen.getByRole("button", {
      name: /Guardar Cambios/i,
    });
    fireEvent.submit(submitButton.closest("form")!);

    // We can't directly check startTransition in jsdom easily, but we know it doesn't crash.
  });

  it("renders default values for missing data", () => {
    const emptyUser = { username: "NoDataUser", email: "no@example.com" };
    render(<ProfileForm user={emptyUser as any} />);

    expect(screen.getByDisplayValue("#00ffff")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Unranked")).toBeInTheDocument();
  });
});
