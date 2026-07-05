import type { Metadata } from "next";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ajh/ui";
import { requireClient } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { InviteMemberForm } from "./invite-member-form";

export const metadata: Metadata = { title: "Team" };

export default async function TeamSettingsPage() {
  const { profile } = await requireClient();
  const supabase = await createSupabaseServerClient();

  // RLS limits this to profiles in the same client.
  const { data: team } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Who can sign in to this portal for your business."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {(team ?? []).map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm font-medium">
                  {member.full_name ?? "Pending sign-in"}
                  {member.id === profile.id ? (
                    <span className="text-muted-foreground"> (you)</span>
                  ) : null}
                </span>
                <Badge variant={member.role === "client_owner" ? "default" : "secondary"}>
                  {member.role === "client_owner" ? "Owner" : "Member"}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {profile.role === "client_owner" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite a teammate</CardTitle>
            <CardDescription>
              They'll get an email invite and sign in with secure email links — no passwords.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMemberForm />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
