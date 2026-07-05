import { ModulePlaceholder } from "@ajh/ui";

export function ClientRoot() {
  return (
    <ModulePlaceholder
      title="Billing"
      phase={5}
      description="Invoices, your current plan and secure card management."
      features={[
        "Invoice list with Stripe-hosted payment links and PDFs",
        "Current plan card",
        "Manage billing securely via the Stripe customer portal",
        "Upgrade to the marketing plan via Stripe Checkout",
      ]}
    />
  );
}

export function AgencyRoot() {
  return (
    <ModulePlaceholder
      title="Billing — agency view"
      phase={5}
      description="Invoice list synced from Stripe webhooks with links to Stripe-hosted invoices/PDFs, a current plan card, Stripe customer portal access, and an upgrade CTA to Stripe Checkout for the marketing plan add-on. Agency side: create and send Stripe invoices from the console. No custom payment UI — Stripe hosts everything."
      features={[
        "Create and send a Stripe invoice for any client",
        "Automatic invoice sync via Stripe webhooks",
      ]}
    />
  );
}
