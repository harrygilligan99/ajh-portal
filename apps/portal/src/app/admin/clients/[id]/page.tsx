import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ajh/ui";
import { enabledModulesSchema } from "@ajh/config";
import { requireAgency } from "@/lib/auth";
import { brandingFromClient } from "@/lib/branding";
import { CLIENT_STATUS_LABEL, CLIENT_STATUS_VARIANT } from "@/lib/client-status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AddNoteForm } from "./add-note-form";
import { OnboardingChecklist, type ChecklistItem } from "./onboarding-checklist";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Client" };

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "settings", label: "Settings" },
  { key: "onboarding", label: "Onboarding" },
  { key: "notes", label: "Internal notes" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function tabHref(id: string, tab: TabKey): string {
  return tab === "overview" ? `/admin/clients/${id}` : `/admin/clients/${id}?tab=${tab}`;
}

/** UTC start of the current month, matching created_at (stored as UTC timestamptz). */
function startOfMonthUtc(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAgency();
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab: TabKey = TABS.some((t) => t.key === tabParam)
    ? (tabParam as TabKey)
    : "overview";

  const supabase = await createSupabaseServerClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  const branding = brandingFromClient(client);
  const enabledModules = enabledModulesSchema.safeParse(client.enabled_modules);
  const enabledSlugs = enabledModules.success ? enabledModules.data : [];

  // Data for overview + onboarding checklist (all agency-visible via RLS).
  const [
    team,
    openRequestsRes,
    thisMonthRequests,
    documents,
    accessGrants,
    invoicesPaid,
    onboardingDone,
    latestUptime,
    recentNotes,
    recentActivity,
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").eq("client_id", id),
    supabase
      .from("update_requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", id)
      .not("status", "in", "(done,declined)"),
    supabase
      .from("update_requests")
      .select("id", { count: "exact", head: true })
      .eq("client_id", id)
      .gte("created_at", startOfMonthUtc()),
    supabase.from("documents").select("kind, status").eq("client_id", id),
    supabase.from("access_grants").select("status").eq("client_id", id),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("client_id", id)
      .eq("status", "paid"),
    supabase
      .from("onboarding_responses")
      .select("id", { count: "exact", head: true })
      .eq("client_id", id)
      .not("completed_at", "is", null),
    supabase
      .from("uptime_checks")
      .select("ok, checked_at, response_ms")
      .eq("client_id", id)
      .order("checked_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("internal_notes")
      .select("id, body, created_at, author_id")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("activity_log")
      .select("id, verb, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const docs = documents.data ?? [];
  const grants = accessGrants.data ?? [];
  const contractAccepted = docs.some((d) => d.kind === "contract" && d.status === "accepted");
  const welcomeSent = docs.some(
    (d) => d.kind === "welcome_pack" && ["sent", "viewed", "accepted"].includes(d.status),
  );
  const grantsResolved =
    grants.length > 0 && grants.every((g) => g.status === "granted" || g.status === "not_applicable");
  const uptime = latestUptime.data;

  const checklist: ChecklistItem[] = [
    {
      label: "Onboarding questionnaire completed",
      done: (onboardingDone.count ?? 0) > 0,
      detail: (onboardingDone.count ?? 0) > 0 ? "Client submitted their details" : "Awaiting client wizard completion",
    },
    {
      label: "Welcome pack sent",
      done: welcomeSent,
      detail: welcomeSent ? "Welcome pack delivered" : "Not generated / sent yet",
    },
    {
      label: "Contract accepted",
      done: contractAccepted,
      detail: contractAccepted ? "Signed via typed-name acceptance" : "Awaiting client acceptance",
    },
    {
      label: "Account access granted",
      done: grantsResolved,
      detail:
        grants.length === 0
          ? "No access grants recorded yet"
          : grantsResolved
            ? "All requested access resolved"
            : `${grants.filter((g) => g.status === "granted" || g.status === "not_applicable").length}/${grants.length} resolved`,
    },
    {
      label: "First invoice paid",
      done: (invoicesPaid.count ?? 0) > 0,
      detail: (invoicesPaid.count ?? 0) > 0 ? "At least one paid invoice" : "No paid invoice yet",
    },
    {
      label: "Website live",
      done: Boolean(client.website_url) && (uptime?.ok ?? false),
      detail: !client.website_url
        ? "No website URL set"
        : uptime
          ? uptime.ok
            ? `Up — ${uptime.response_ms ?? "?"}ms at last check`
            : "Last uptime check failed"
          : "URL set, awaiting first uptime check",
    },
  ];

  return (
    <div>
      <PageHeader
        title={client.name}
        description={`${client.slug} · created ${formatDate(client.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={CLIENT_STATUS_VARIANT[client.status]}>
              {CLIENT_STATUS_LABEL[client.status]}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {client.plan}
            </Badge>
          </div>
        }
      />

      <div className="mb-6 flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <Link
              key={t.key}
              href={tabHref(id, t.key)}
              className={
                active
                  ? "whitespace-nowrap border-b-2 border-primary px-3 py-2 text-sm font-medium"
                  : "whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {activeTab === "overview" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{openRequestsRes.count ?? 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {thisMonthRequests.count ?? 0} created this month · quota {client.monthly_update_quota}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Portal team</CardTitle>
            </CardHeader>
            <CardContent>
              {team.data && team.data.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {team.data.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <span>{m.full_name ?? "Pending sign-in"}</span>
                      <Badge variant={m.role === "client_owner" ? "default" : "secondary"}>
                        {m.role === "client_owner" ? "Owner" : "Member"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No portal users yet.</p>
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Enabled modules
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {enabledSlugs.length > 0 ? (
                enabledSlugs.map((slug) => (
                  <Badge key={slug} variant="secondary" className="capitalize">
                    {slug}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No modules enabled.</p>
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.data && recentActivity.data.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {recentActivity.data.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">{a.verb}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "settings" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
            <CardDescription>
              Feature flags, plan, quota, branding and hosting for {client.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              client={client}
              enabledModules={enabledSlugs}
              primaryColor={branding.primary_color}
              logoUrl={branding.logo_url}
            />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "onboarding" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Onboarding checklist</CardTitle>
            <CardDescription>
              Live status pulled from documents, access grants, invoices and uptime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingChecklist items={checklist} />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "notes" ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add internal note</CardTitle>
              <CardDescription>Agency-only. Clients never see these.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddNoteForm clientId={id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentNotes.data && recentNotes.data.length > 0 ? (
                <ul className="divide-y">
                  {recentNotes.data.map((n) => (
                    <li key={n.id} className="py-3">
                      <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No internal notes yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
