"use client";

import { useActionState } from "react";
import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  Select,
  Textarea,
} from "@ajh/ui";
import { CLIENT_PLANS, CLIENT_STATUSES, MODULE_SLUGS, type ModuleSlug } from "@ajh/config";
import type { ClientRow } from "@ajh/db";
import { initialActionState } from "@/lib/action-state";
import { CLIENT_STATUS_LABEL } from "@/lib/client-status";
import { updateClientSettings } from "./actions";

const MODULE_LABEL: Record<ModuleSlug, string> = {
  onboarding: "Onboarding",
  requests: "Requests",
  messages: "Messages",
  billing: "Billing",
  marketing: "Marketing",
  documents: "Documents",
  website: "Website",
};

export function SettingsForm({
  client,
  enabledModules,
  primaryColor,
  logoUrl,
}: {
  client: ClientRow;
  enabledModules: ModuleSlug[];
  primaryColor: string;
  logoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateClientSettings, initialActionState);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="clientId" value={client.id} />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={client.status} disabled={pending}>
            {CLIENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CLIENT_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan">Plan</Label>
          <Select id="plan" name="plan" defaultValue={client.plan} disabled={pending}>
            {CLIENT_PLANS.map((p) => (
              <option key={p} value={p} className="capitalize">
                {p}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly_update_quota">Monthly update quota</Label>
          <Input
            id="monthly_update_quota"
            name="monthly_update_quota"
            type="number"
            min={0}
            max={999}
            defaultValue={client.monthly_update_quota}
            disabled={pending}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="marketing_plan"
              defaultChecked={client.marketing_plan}
              disabled={pending}
              className="h-4 w-4 rounded border-input"
            />
            Marketing plan
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium">Enabled modules</p>
          <p className="text-xs text-muted-foreground">
            Controls which features appear in this client's portal navigation.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_SLUGS.map((slug) => (
            <label
              key={slug}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name={`module:${slug}`}
                defaultChecked={enabledModules.includes(slug)}
                disabled={pending}
                className="h-4 w-4 rounded border-input"
              />
              {MODULE_LABEL[slug]}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-medium">Branding</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary colour</Label>
            <div className="flex items-center gap-2">
              <input
                id="primary_color"
                name="primary_color"
                type="color"
                defaultValue={primaryColor}
                disabled={pending}
                className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent"
              />
              <span className="text-xs text-muted-foreground">
                Used as the accent throughout this client's portal.
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              name="logo_url"
              type="url"
              placeholder="https://…/logo.png"
              defaultValue={logoUrl ?? ""}
              disabled={pending}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-medium">Website & hosting</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              placeholder="https://…"
              defaultValue={client.website_url ?? ""}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain_registrar">Domain registrar</Label>
            <Input
              id="domain_registrar"
              name="domain_registrar"
              placeholder="Namecheap"
              defaultValue={client.domain_registrar ?? ""}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain_renewal_date">Domain renewal date</Label>
            <Input
              id="domain_renewal_date"
              name="domain_renewal_date"
              type="date"
              defaultValue={client.domain_renewal_date ?? ""}
              disabled={pending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="hosting_notes">Hosting notes</Label>
            <Textarea
              id="hosting_notes"
              name="hosting_notes"
              placeholder="Where it's hosted, DNS, gotchas…"
              defaultValue={client.hosting_notes ?? ""}
              disabled={pending}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {state.message ? (
          <Alert variant={state.ok ? "success" : "destructive"} className="py-2">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </form>
  );
}
