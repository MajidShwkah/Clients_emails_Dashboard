import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActiveToggle } from "@/components/recipients/active-toggle";
import {
  RecipientFormDialog,
  type BranchOption,
} from "@/components/recipients/recipient-form-dialog";
import type { EmailRecipient } from "@/lib/types/db";

type Props = {
  rows: EmailRecipient[];
  brandId: number;
  /** When set, edit dialog locks branch_id to this value. Use null for brand-wide tables. */
  lockedBranchId?: number | null;
  /** When edit dialog is unlocked, available branches to pick from. */
  branches?: BranchOption[];
  emptyLabel: string;
};

export function RecipientsTable({
  rows,
  brandId,
  lockedBranchId,
  branches,
  emptyLabel,
}: Props) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="w-[120px]">Updated</TableHead>
          <TableHead className="w-[80px] text-center">Active</TableHead>
          <TableHead className="w-[80px] text-right">Edit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow
            key={r.id}
            className={r.active ? "" : "opacity-50"}
          >
            <TableCell className="font-medium">{r.email}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {r.notes ?? <span className="italic">—</span>}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground tabular-nums">
              {new Date(r.updated_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-center">
              <ActiveToggle
                scope="recipient"
                id={r.id}
                brandId={brandId}
                active={r.active}
              />
            </TableCell>
            <TableCell className="text-right">
              <RecipientFormDialog
                trigger={
                  <Button variant="ghost" size="icon" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
                brandId={brandId}
                lockedBranchId={lockedBranchId}
                branches={branches}
                initial={{
                  id: r.id,
                  email: r.email,
                  branch_id: r.branch_id,
                  notes: r.notes,
                  active: r.active,
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
