import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ajh/ui";
import { requireAgency } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { NewClientForm } from "./new-client-form";

export const metadata: Metadata = { title: "New client" };

export default async function NewClientPage() {
  await requireAgency();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="New client"
        description="Creates the client record and emails the owner their portal invite."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client & owner details</CardTitle>
          <CardDescription>
            All modules start enabled; tune modules, quota and branding from the client's
            settings (Phase 1).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
