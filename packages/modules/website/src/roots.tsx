import { ModulePlaceholder } from "@ajh/ui";

export function ClientRoot() {
  return (
    <ModulePlaceholder
      title="Website"
      phase={6}
      description="Your website's uptime, domain and hosting at a glance."
      features={[
        "Live uptime status and response time",
        "Domain registrar and renewal date",
        "Hosting notes from AJH",
      ]}
    />
  );
}

export function AgencyRoot() {
  return (
    <ModulePlaceholder
      title="Website — agency view"
      phase={6}
      description="A website card showing the live URL, latest uptime ping result and response time, domain registrar + renewal date and hosting notes. Uptime is captured by a daily Vercel Cron ping stored in uptime_checks."
      features={[
        "Daily uptime cron across all active client sites",
        "Renewal dates surfaced before they bite",
      ]}
    />
  );
}
