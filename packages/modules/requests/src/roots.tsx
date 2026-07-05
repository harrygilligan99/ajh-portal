import { ModulePlaceholder } from "@ajh/ui";

export function ClientRoot() {
  return (
    <ModulePlaceholder
      title="Requests"
      phase={2}
      description="Raise website update requests, track progress and approve previews."
      features={[
        "Raise update requests with page URL, priority and screenshots",
        "Status timeline and comment thread on every request",
        "Monthly quota meter (e.g. 2 of 4 updates used this month)",
        "Approve previews or request changes, then rate the work 1–5",
      ]}
    />
  );
}

export function AgencyRoot() {
  return (
    <ModulePlaceholder
      title="Requests — agency view"
      phase={2}
      description="Client-facing update requests with screenshots, a status timeline, comment threads and a monthly quota meter. Preview approval flow (approve / request changes) with a 1–5 rating on completion. Agency side: a cross-client kanban with drag-to-change-status, staff assignment and an internal notes panel."
      features={[
        "Kanban across ALL clients — drag to change status",
        "Assign requests to staff",
        "Internal notes panel (never visible to clients)",
      ]}
    />
  );
}
