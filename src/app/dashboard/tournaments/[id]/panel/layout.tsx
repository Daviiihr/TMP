import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TournamentPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
