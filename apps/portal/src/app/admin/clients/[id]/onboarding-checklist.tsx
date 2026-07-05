import { Check, Circle } from "lucide-react";
import { cn } from "@ajh/ui";

export interface ChecklistItem {
  label: string;
  done: boolean;
  detail: string;
}

export function OnboardingChecklist({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((i) => i.done).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {done} of {items.length} steps complete
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-start gap-3 rounded-md border px-3 py-2.5"
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                item.done ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
              )}
            >
              {item.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
