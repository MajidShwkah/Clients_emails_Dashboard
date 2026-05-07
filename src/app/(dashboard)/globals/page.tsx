import { Plus, Globe2, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { GlobalRecipientDialog } from "@/components/globals/global-recipient-dialog";

export const metadata = { title: "Globals — RIME Email Routing" };

export default async function GlobalsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("sync")
    .from("global_recipients")
    .select("*")
    .order("created_at", { ascending: true });

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Global recipients
        </h1>
        <p className="text-sm text-muted-foreground">
          Notified on every email RIME sends, regardless of brand or branch.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">All globals</CardTitle>
            <CardDescription>
              {rows.length} configured · {rows.filter((r) => r.active).length}{" "}
              active
            </CardDescription>
          </div>
          <GlobalRecipientDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add global
              </Button>
            }
          />
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {error ? (
            <p className="p-6 text-sm text-destructive">
              Could not load globals. {error.message}
            </p>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <Globe2 className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No global recipients yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[120px]">Updated</TableHead>
                  <TableHead className="w-[80px] text-center">
                    Active
                  </TableHead>
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
                        scope="global"
                        id={r.id}
                        active={r.active}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <GlobalRecipientDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                        initial={{
                          id: r.id,
                          email: r.email,
                          notes: r.notes,
                          active: r.active,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
