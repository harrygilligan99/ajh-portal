import Link from "next/link";
import { Badge } from "@ajh/ui";
import { requireAgency } from "@/lib/auth";
import { agencyNavItems } from "@/lib/modules";
import { NavLink } from "@/components/nav-link";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAgency();

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-3">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            AJH
            <Badge variant="secondary">Agency console</Badge>
          </Link>
          <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{profile.full_name}</span>
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 py-2">
          <NavLink href="/admin" label="Overview" />
          <NavLink href="/admin/clients" label="Clients" />
          {agencyNavItems().map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
