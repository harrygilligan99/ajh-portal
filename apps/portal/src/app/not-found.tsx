import Link from "next/link";
import { Button } from "@ajh/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you're after doesn't exist or isn't enabled for your account.
      </p>
      <Link href="/">
        <Button variant="outline">Back to your portal</Button>
      </Link>
    </div>
  );
}
