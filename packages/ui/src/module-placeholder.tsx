import * as React from "react";
import { Badge } from "./badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

export interface ModulePlaceholderProps {
  title: string;
  /** Build phase in which this module's full UI lands */
  phase: number;
  description: string;
  features: string[];
}

/** Skeleton screen shown while a module's full UI is still to be built. */
export function ModulePlaceholder({ title, phase, description, features }: ModulePlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant="secondary">Full build lands in Phase {phase}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-sm font-medium">What's coming here:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
