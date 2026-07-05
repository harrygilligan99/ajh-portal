import { ModulePlaceholder } from "@ajh/ui";

export function ClientRoot() {
  return (
    <ModulePlaceholder
      title="Messages"
      phase={6}
      description="Message the AJH team — one simple thread for everything."
      features={[
        "One simple thread between you and AJH",
        "Unread badges so nothing gets missed",
        "Email notifications for new replies",
      ]}
    />
  );
}

export function AgencyRoot() {
  return (
    <ModulePlaceholder
      title="Messages — agency view"
      phase={6}
      description="A single per-client thread between the client and the agency, with unread badges on both sides and email notification on new messages (respecting per-user notification preferences)."
      features={[
        "Per-client threads with unread indicators",
        "Email notifications respecting per-user preferences",
      ]}
    />
  );
}
