import { Building2, Globe2, MailCheck, Mailbox, History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Dashboard — RIME Email Routing" };

export default async function DashboardHome() {
  const supabase = await createClient();
  const sync = supabase.schema("sync");

  const [brandWide, branchSpecific, globals, brandsCount, recentAudit] =
    await Promise.all([
      sync
        .from("email_recipients")
        .select("*", { count: "exact", head: true })
        .eq("active", true)
        .is("branch_id", null),
      sync
        .from("email_recipients")
        .select("*", { count: "exact", head: true })
        .eq("active", true)
        .not("branch_id", "is", null),
      sync
        .from("global_recipients")
        .select("*", { count: "exact", head: true })
        .eq("active", true),
      supabase
        .from("brands")
        .select("*", { count: "exact", head: true })
        .eq("is_archived", false),
      sync
        .from("email_audit_log")
        .select("id, table_name, record_id, action, changed_at, changed_by")
        .order("changed_at", { ascending: false })
        .limit(10),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of recipients across all brands.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Brand-wide recipients"
          value={brandWide.count ?? 0}
          hint="Active, fire on every branch"
          icon={Mailbox}
        />
        <StatCard
          title="Branch-specific recipients"
          value={branchSpecific.count ?? 0}
          hint="Active, scoped to one branch"
          icon={MailCheck}
        />
        <StatCard
          title="Global recipients"
          value={globals.count ?? 0}
          hint="RIME internal — every email"
          icon={Globe2}
        />
        <StatCard
          title="Brands"
          value={brandsCount.count ?? 0}
          hint="Non-archived"
          icon={Building2}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAudit.error ? (
            <p className="text-sm text-muted-foreground">
              Could not load activity log.
            </p>
          ) : !recentAudit.data || recentAudit.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No changes recorded yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentAudit.data.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <span className="font-medium uppercase tracking-wide text-xs text-muted-foreground">
                      {row.action}
                    </span>{" "}
                    <span className="text-foreground">{row.table_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {new Date(row.changed_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
