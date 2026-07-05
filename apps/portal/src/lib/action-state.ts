export interface ActionState {
  ok: boolean;
  message: string | null;
}

export const initialActionState: ActionState = { ok: false, message: null };
