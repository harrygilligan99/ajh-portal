import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ajh/ui";
import { getSessionContext } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await getSessionContext();
  if (ctx) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <p className="text-lg font-bold tracking-tight">AJH Website Management</p>
          <p className="text-sm text-muted-foreground">Client portal</p>
        </div>
        {error === "link" ? (
          <Alert variant="destructive">
            <AlertDescription>
              That sign-in link is invalid or has expired. Request a fresh one below.
            </AlertDescription>
          </Alert>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              No passwords here — we'll email you a secure one-time link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
