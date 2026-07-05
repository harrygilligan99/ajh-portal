import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ajh/ui";
import { SignOutButton } from "@/components/sign-out-button";

export default function NoAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Account not linked yet</CardTitle>
          <CardDescription>
            Your sign-in worked, but this account isn't linked to a client portal.
            Contact AJH and we'll sort it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
