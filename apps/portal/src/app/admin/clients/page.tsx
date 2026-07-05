import type { Metadata } from "next";
import Link from "next/link";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
} from "@ajh/ui";
import type { ClientStatus } from "@ajh/db";
import { requireAgency } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Clients" };

const STATUS_VARIANT: Record<ClientStatus, "default" | "secondary" | "outline" | "success" | "destructive"> = {
  lead: "outline",
  onboarding: "secondary",
  active: "success",
  paused: "outline",
  archived: "destructive",
};

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string }>;
}) {
  await requireAgency();
  const { invited } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, slug, status, plan, marketing_plan, monthly_update_quota, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clients"
        description="Every business on the books. Full client detail pages land in Phase 1."
        action={
          <Link href="/admin/clients/new">
            <Button>New client</Button>
          </Link>
        }
      />

      {invited === "1" ? (
        <Alert variant="success">
          <AlertDescription>Client created and the owner's invite email is on its way.</AlertDescription>
        </Alert>
      ) : null}

      {!clients || clients.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No clients yet — create your first one to send a portal invite.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Marketing</th>
                    <th className="px-4 py-3 font-medium">Quota</th>
                    <th className="px-4 py-3 font-medium">Since</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[client.status]}>{client.status}</Badge>
                      </td>
                      <td className="px-4 py-3 capitalize">{client.plan}</td>
                      <td className="px-4 py-3">{client.marketing_plan ? "Yes" : "—"}</td>
                      <td className="px-4 py-3">{client.monthly_update_quota}/mo</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(client.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
