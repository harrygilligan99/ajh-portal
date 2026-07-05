"use client";

import { useActionState } from "react";
import { Alert, AlertDescription, Button, Input, Label } from "@ajh/ui";
import { initialActionState } from "@/lib/action-state";
import { createClientWithOwner } from "./actions";

export function NewClientForm() {
  const [state, formAction, pending] = useActionState(createClientWithOwner, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Business name</Label>
        <Input id="name" name="name" placeholder="Blush & Co Hair" required disabled={pending} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ownerName">Owner's full name</Label>
          <Input id="ownerName" name="ownerName" required disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ownerEmail">Owner's email</Label>
          <Input id="ownerEmail" name="ownerEmail" type="email" required disabled={pending} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="plan">Plan</Label>
        <select
          id="plan"
          name="plan"
          defaultValue="standard"
          disabled={pending}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="starter">Starter</option>
          <option value="standard">Standard</option>
          <option value="pro">Pro</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create client & send invite"}
      </Button>
      {state.message ? (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
