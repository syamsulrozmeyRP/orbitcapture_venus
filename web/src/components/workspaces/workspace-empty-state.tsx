import { Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";

export function WorkspaceEmptyState() {
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>Let’s create your first workspace</CardTitle>
          <CardDescription>
            Workspaces keep content, permissions, and branding isolated for each client or business unit.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Start with a name and theme color. You can customize domains, roles, and invitations later.
        </p>
        <CreateWorkspaceDialog />
      </CardContent>
    </Card>
  );
}
