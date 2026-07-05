"use client";

import { useActionState } from "react";
import { Alert, AlertDescription, Button, Textarea } from "@ajh/ui";
import { initialActionState } from "@/lib/action-state";
import { addInternalNote } from "./actions";

export function AddNoteForm({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState(addInternalNote, initialActionState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="clientId" value={clientId} />
      <Textarea
        name="body"
        placeholder="Internal note — never visible to the client…"
        required
        disabled={pending}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add note"}
        </Button>
        {state.message ? (
          <Alert variant={state.ok ? "success" : "destructive"} className="py-2">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </form>
  );
}
