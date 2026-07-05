import { redirect } from "next/navigation";
import { isAgencyRole } from "@ajh/config";
import { getSessionContext } from "@/lib/auth";

export default async function Home() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  redirect(isAgencyRole(ctx.profile.role) ? "/admin" : "/dashboard");
}
