import { redirect } from "next/navigation";
import BracketsTestClient from "./BracketsTestClient";
import { getSession } from "@/lib/session";

export default async function BracketsTestPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <BracketsTestClient />;
}
