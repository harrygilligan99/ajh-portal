"use client";

import { useActionState } from "react";
import { Alert, AlertDescription, Button, Input, Label } from "@ajh/ui";
import { initialActionState } from "@/lib/action-state";
import { inviteClientMember } from "./actions";

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState(inviteClientMember, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" required disabled={pending} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending invite…" : "Send invite"}
      </Button>
      {state.message ? (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
