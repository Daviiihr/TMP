import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProfilePage from "@/app/profile/page";
import { getSession } from "@/lib/session";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/repositories/user.repository", () => {
  const UserRepository = vi.fn();
  UserRepository.prototype.findById = vi
    .fn()
    .mockResolvedValue({
      id: "1",
      username: "TestUser",
      email: "test@test.com",
    });
  return { UserRepository };
});

vi.mock("@/app/profile/ProfileForm", () => ({
  default: () => <div data-testid="profile-form">Form</div>,
}));

describe("ProfilePage", () => {
  it("renders profile page with session user", async () => {
    (getSession as any).mockResolvedValue({
      id: "1",
      username: "TestUser",
      email: "test@test.com",
    });

    const jsx = await ProfilePage();
    render(jsx);

    expect(screen.getByText("Personalización de Perfil")).toBeInTheDocument();
    expect(screen.getByTestId("profile-form")).toBeInTheDocument();
  });
});
