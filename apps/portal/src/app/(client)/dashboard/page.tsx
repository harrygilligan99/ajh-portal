import type { Metadata } from "next";
import { Card, CardContent } from "@ajh/ui";
import { requireClient } from "@/lib/auth";
import { enabledModules } from "@/lib/modules";
import { ModuleCard } from "@/components/module-card";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { profile, client } = await requireClient();
  const modules = enabledModules(client);
  const firstName = profile.full_name?.split(" ")[0];

  return (
    <div>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description={`Everything AJH manages for ${client.name}, in one place.`}
      />
      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nothing is enabled for your portal yet — AJH will switch things on as your
            onboarding progresses.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const href = mod.manifest.navItems.client[0]?.href ?? `/m/${mod.manifest.slug}`;
            return (
              <ModuleCard
                key={mod.manifest.slug}
                name={mod.manifest.name}
                description={mod.manifest.description}
                href={href}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
