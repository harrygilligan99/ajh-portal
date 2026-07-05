import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { brandingFromClient, contrastForegroundVar, hexToHslVar } from "@/lib/branding";
import { clientNavItems } from "@/lib/modules";
import { NavLink } from "@/components/nav-link";
import { SignOutButton } from "@/components/sign-out-button";

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const { profile, client } = await requireClient();
  const branding = brandingFromClient(client);
  const primary = hexToHslVar(branding.primary_color);

  const accentStyle = primary
    ? ({
        "--primary": primary,
        "--primary-foreground": contrastForegroundVar(branding.primary_color),
        "--ring": primary,
      } as React.CSSProperties)
    : undefined;

  return (
    <div style={accentStyle} className="flex min-h-screen flex-col bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 pt-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2 font-semibold">
            {branding.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logo_url} alt="" className="h-7 w-auto shrink-0" />
            ) : null}
            <span className="truncate">{client.name}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{profile.full_name}</span>
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 py-2">
          <NavLink href="/dashboard" label="Dashboard" />
          {clientNavItems(client).map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
          {profile.role === "client_owner" ? <NavLink href="/settings/team" label="Team" /> : null}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t bg-background py-4 text-center text-xs text-muted-foreground">
        Managed by AJH Website Management
      </footer>
    </div>
  );
}
