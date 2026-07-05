import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@ajh/ui";
import { requireAgency } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Agency overview" };

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminOverviewPage() {
  await requireAgency();
  const supabase = await createSupabaseServerClient();

  const [clients, activeClients, openRequests, newRequests] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("update_requests")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(done,declined)"),
    supabase.from("update_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Across every client AJH looks after."
        action={
          <Link href="/admin/clients/new">
            <Button>New client</Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clients" value={clients.count ?? 0} />
        <StatCard label="Active clients" value={activeClients.count ?? 0} />
        <StatCard label="Open requests" value={openRequests.count ?? 0} />
        <StatCard label="New requests" value={newRequests.count ?? 0} />
      </div>
    </div>
  );
}
