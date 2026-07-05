import { ModulePlaceholder } from "@ajh/ui";

export function ClientRoot() {
  return (
    <ModulePlaceholder
      title="Marketing"
      phase={5}
      description="Ad performance reporting — spend, clicks, impressions and leads."
      features={[
        "Monthly ad spend, clicks, impressions and leads charts",
        "Month-over-month performance table",
        "Downloadable monthly reports",
        "Not on the plan yet? A clear pitch with pricing and one-click join",
      ]}
    />
  );
}

export function AgencyRoot() {
  return (
    <ModulePlaceholder
      title="Marketing — agency view"
      phase={5}
      description="For clients on the marketing plan: monthly ad spend / clicks / impressions / leads charts (recharts), a month-over-month table and downloadable monthly reports. For everyone else: a pitch page with pricing and a Stripe Checkout join flow. Ad spend is entered manually by agency staff (no ads API connections in v1)."
      features={[
        "Manual ad spend entry per client / month / platform",
        "Feeds the monthly report generator",
      ]}
    />
  );
}
