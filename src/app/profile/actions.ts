"use server";

import { getSession } from "@/lib/session";
import { UserRepository } from "@/repositories/user.repository";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error("No autorizado");
  }

  const avatar_url = formData.get("avatar_url") as string | null;
  const banner_url = formData.get("banner_url") as string | null;
  const theme_color = formData.get("theme_color") as string | null;
  const bio = formData.get("bio") as string | null;
  const competitive_rank = formData.get("competitive_rank") as string | null;

  const repo = new UserRepository();
  await repo.updateProfile(session.id, {
    avatar_url: avatar_url || undefined,
    banner_url: banner_url || undefined,
    theme_color: theme_color || undefined,
    bio: bio || undefined,
    competitive_rank: competitive_rank || undefined,
  });

  revalidatePath("/profile");
}
