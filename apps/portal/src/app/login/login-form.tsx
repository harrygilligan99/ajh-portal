"use client";

import { useActionState } from "react";
import { Alert, AlertDescription, Button, Input, Label } from "@ajh/ui";
import { initialActionState } from "@/lib/action-state";
import { sendMagicLink } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@yourbusiness.co.uk"
          required
          disabled={pending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending link…" : "Email me a sign-in link"}
      </Button>
      {state.message ? (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
