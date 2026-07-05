import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { enabledModuleSlugs, getModule } from "@/lib/modules";

/** Mounts the ClientRoot of an enabled module; disabled/unknown slugs 404. */
export default async function ClientModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { client } = await requireClient();

  const mod = getModule(slug);
  if (!mod || !enabledModuleSlugs(client).includes(mod.manifest.slug)) notFound();

  const Root = mod.ClientRoot;
  return <Root />;
}
