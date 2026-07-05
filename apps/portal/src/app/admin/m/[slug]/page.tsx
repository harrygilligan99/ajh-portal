import { notFound } from "next/navigation";
import { requireAgency } from "@/lib/auth";
import { getModule } from "@/lib/modules";

/** Mounts a module's AgencyRoot — agency users see every module. */
export default async function AgencyModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireAgency();

  const mod = getModule(slug);
  if (!mod) notFound();

  const Root = mod.AgencyRoot;
  return <Root />;
}
