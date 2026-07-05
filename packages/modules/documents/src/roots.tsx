import { ModulePlaceholder } from "@ajh/ui";

export function ClientRoot() {
  return (
    <ModulePlaceholder
      title="Documents"
      phase={3}
      description="Your contract, welcome pack and reports in one place."
      features={[
        "Contract, welcome pack, reports and other files in one vault",
        "Status badges: draft, sent, viewed, accepted",
        "Secure, expiring download links",
      ]}
    />
  );
}

export function AgencyRoot() {
  return (
    <ModulePlaceholder
      title="Documents — agency view"
      phase={3}
      description="Document vault listing the client's contract, welcome pack, monthly reports and other files with status badges (draft/sent/viewed/accepted) and signed Storage download links."
      features={[
        "Upload and manage documents per client",
        "Contract acceptance status at a glance",
      ]}
    />
  );
}
