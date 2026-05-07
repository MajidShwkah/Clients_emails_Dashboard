import { Plus, Building } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecipientFormDialog } from "@/components/recipients/recipient-form-dialog";
import { RecipientsTable } from "@/components/recipients/recipients-table";
import type { Branch, EmailRecipient } from "@/lib/types/db";

type Props = {
  brandId: number;
  branches: Branch[];
  recipientsByBranch: Map<number, EmailRecipient[]>;
};

export function BranchExtrasSection({
  brandId,
  branches,
  recipientsByBranch,
}: Props) {
  if (branches.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No active branches for this brand.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {branches.map((branch) => {
        const rows = recipientsByBranch.get(branch.id) ?? [];
        const activeCount = rows.filter((r) => r.active).length;
        const branchName = branch.name ?? `Branch #${branch.id}`;

        return (
          <Card key={branch.id}>
            <Collapsible defaultOpen={rows.length > 0}>
              <CollapsibleTrigger className="w-full text-left">
                <CardHeader className="flex flex-row items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{branchName}</CardTitle>
                      <CardDescription className="text-xs">
                        ID {branch.id}
                        {branch.location ? ` · ${branch.location}` : ""}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={activeCount > 0 ? "secondary" : "outline"}>
                    {activeCount} active
                    {rows.length > activeCount
                      ? ` · ${rows.length - activeCount} inactive`
                      : ""}
                  </Badge>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3 p-0 pb-4">
                  <RecipientsTable
                    rows={rows}
                    brandId={brandId}
                    lockedBranchId={branch.id}
                    emptyLabel="No branch-specific recipients yet."
                  />
                  <div className="px-4">
                    <RecipientFormDialog
                      trigger={
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add recipient for this branch
                        </Button>
                      }
                      brandId={brandId}
                      lockedBranchId={branch.id}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
