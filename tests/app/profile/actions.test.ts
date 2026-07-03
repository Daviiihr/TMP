import { describe, it, expect, vi } from "vitest";
import { updateProfileAction } from "@/app/profile/actions";
import { UserRepository } from "@/repositories/user.repository";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

vi.mock("@/repositories/user.repository", () => {
  const UserRepository = vi.fn();
  UserRepository.prototype.updateProfile = vi.fn().mockResolvedValue(true);
  return { UserRepository };
});

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("updateProfileAction", () => {
  it("returns error if no session", async () => {
    (getSession as any).mockResolvedValue(null);
    try {
      await updateProfileAction(new FormData());
    } catch (e: any) {
      expect(e.message).toBe("No autorizado");
    }
  });

  it("updates profile and revalidates path on success", async () => {
    (getSession as any).mockResolvedValue({ id: "user-1" });
    const formData = new FormData();
    formData.append("username", "newUsername");
    formData.append("theme_color", "#123456");

    await updateProfileAction(formData);

    expect(revalidatePath).toHaveBeenCalledWith("/profile");
  });
});
