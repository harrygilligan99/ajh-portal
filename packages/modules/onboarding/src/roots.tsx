import { ModulePlaceholder } from "@ajh/ui";

export function ClientRoot() {
  return (
    <ModulePlaceholder
      title="Onboarding"
      phase={3}
      description="Get set up with AJH: business details, brand assets, account access and your contract."
      features={[
        "Step-by-step setup wizard: business details, brand assets, questionnaire",
        "Access grants: tell us where your domain, analytics and social accounts live — no passwords, ever",
        "Contract review and acceptance with a typed-name signature",
        "Welcome Pack download once you're done",
      ]}
    />
  );
}

export function AgencyRoot() {
  return (
    <ModulePlaceholder
      title="Onboarding — agency view"
      phase={3}
      description="Guided new-client setup wizard: business details, brand asset uploads, provider access grants (invite/delegate — never passwords) and a short questionnaire. On completion it generates the Welcome Pack and Contract PDFs from editable {{placeholder}} templates and records typed-name contract acceptance."
      features={[
        "Onboarding checklist per client (docs generated → sent → accepted)",
        "Access grant status tracking with per-provider instructions",
        "Welcome Pack + Contract PDF generation from editable templates",
      ]}
    />
  );
}
