import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/brands/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MissingDelivery } from "@/lib/types/db";

export const metadata = { title: "Missing Deliveries — RIME Email Routing" };

const PAGE_SIZE = 50;

const SOURCE_LABEL: Record<string, string> = {
  default:      "Default",
  brand_extra:  "Brand extra",
  branch_extra: "Branch extra",
  global:       "Global",
};

function StatusBadge({ attempts, delivered }: { attempts: number; delivered: number }) {
  if (attempts === 0) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
        Never sent
      </span>
    );
  }
  if (delivered === 0) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Undelivered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      Partial
    </span>
  );
}

export default async function MissingDeliveriesPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp   = await props.searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const supabase = await createClient();
  const sync = supabase.schema("sync");

  const from = (page - 1) * PAGE_SIZE;

  const [countRes, rowRes] = await Promise.all([
    sync.from("v_missing_deliveries").select("*", { count: "exact", head: true }),
    sync
      .from("v_missing_deliveries")
      .select("brand_id, branch_id, email, source, send_day, total_attempts, delivered, failed, pending, last_attempt")
      .order("total_attempts", { ascending: true })
      .order("brand_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1),
  ]);

  if (countRes.error) console.error("[missing] count:", countRes.error.message);
  if (rowRes.error)   console.error("[missing] rows:", rowRes.error.message);

  const rows  = (rowRes.data ?? []) as MissingDelivery[];
  const total = countRes.count ?? 0;

  // Brand name lookup
  const brandIds = [...new Set(rows.map((r) => r.brand_id).filter((id): id is number => id !== null))];
  const brandsRes = brandIds.length > 0
    ? await supabase.from("brands").select("id, name").in("id", brandIds)
    : { data: [] as { id: number; name: string }[] };
  const brandMap = Object.fromEntries((brandsRes.data ?? []).map((b) => [b.id, b.name]));

  const neverSent   = rows.filter((r) => (r.total_attempts ?? 0) === 0).length;
  const undelivered = rows.filter((r) => (r.total_attempts ?? 0) > 0 && (r.delivered ?? 0) === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Missing Deliveries</h1>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} recipient{total !== 1 ? "s" : ""} expected to receive emails but not yet delivered to.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-md border border-border bg-card px-3 py-2 text-sm">
          <span className="text-muted-foreground">Never sent </span>
          <span className="font-semibold tabular-nums">{neverSent}</span>
        </div>
        <div className={cn(
          "rounded-md border px-3 py-2 text-sm",
          undelivered > 0
            ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
            : "border-border bg-card",
        )}>
          <span className="text-muted-foreground">Attempted, undelivered </span>
          <span className={cn(
            "font-semibold tabular-nums",
            undelivered > 0 ? "text-red-600 dark:text-red-400" : "",
          )}>
            {undelivered}
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {rowRes.error ? (
            <p className="p-6 text-sm text-destructive">{rowRes.error.message}</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No missing deliveries found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground lg:table-cell">Attempts</th>
                    <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground lg:table-cell">Delivered</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground xl:table-cell">Last Attempt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row, i) => {
                    const brandName = row.brand_id ? (brandMap[row.brand_id] ?? `Brand ${row.brand_id}`) : "—";
                    const attempts  = row.total_attempts ?? 0;
                    const delivered = row.delivered ?? 0;

                    return (
                      <tr
                        key={`${row.brand_id}-${row.branch_id}-${row.email}-${i}`}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-medium">{brandName}</td>
                        <td className="px-4 py-2.5">
                          <span className="block max-w-[200px] truncate font-mono text-xs" title={row.email ?? ""}>
                            {row.email ?? "—"}
                          </span>
                        </td>
                        <td className="hidden px-4 py-2.5 md:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {SOURCE_LABEL[row.source ?? ""] ?? row.source ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge attempts={attempts} delivered={delivered} />
                        </td>
                        <td className="hidden px-4 py-2.5 text-right tabular-nums text-xs text-muted-foreground lg:table-cell">
                          {attempts}
                        </td>
                        <td className="hidden px-4 py-2.5 text-right tabular-nums text-xs lg:table-cell">
                          <span className={delivered > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                            {delivered}
                          </span>
                        </td>
                        <td className="hidden px-4 py-2.5 text-xs text-muted-foreground xl:table-cell">
                          {row.last_attempt
                            ? new Date(row.last_attempt).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} label="recipients" />
    </div>
  );
}
