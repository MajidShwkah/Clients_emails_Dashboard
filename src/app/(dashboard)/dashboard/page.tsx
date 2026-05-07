import {
  Users,
  Send,
  CheckCircle2,
  AlertTriangle,
  Mail,
  History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/dashboard/metric-card";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { parseFilters } from "@/lib/filter-utils";
import { SendVolumeChart, type DayVolume } from "@/components/dashboard/send-volume-chart";
import { DeliveryDonut, type StatusCount } from "@/components/dashboard/delivery-donut";
import {
  ActivityTable,
  type SendRow,
  type EventRow,
} from "@/components/dashboard/activity-table";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Dashboard — RIME Email Routing" };

export default async function DashboardHome(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp      = await props.searchParams;
  const filters = parseFilters(sp);

  const supabase = await createClient();
  const sync     = supabase.schema("sync");

  const fromTs = filters.from ? `${filters.from}T00:00:00.000Z` : undefined;
  const toTs   = filters.to   ? `${filters.to}T23:59:59.999Z`   : undefined;

  // ── Filter bar data ───────────────────────────────────────────────────────
  const [brandsListRes, branchesListRes] = await Promise.all([
    supabase.from("brands").select("id, name").eq("is_archived", false).order("name"),
    supabase.from("branches").select("id, name, brand").eq("is_archived", false).order("name"),
  ]);
  const brandsList   = brandsListRes.data   ?? [];
  const branchesList = (branchesListRes.data ?? []) as { id: number; name: string | null; brand: number }[];

  // ── Helper: apply date + brand + branch + email + status to any query ─────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyFilters<T>(q: T): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let r = q as any;
    if (fromTs)                  r = r.gte("sent_at", fromTs);
    if (toTs)                    r = r.lte("sent_at", toTs);
    if (filters.brandId)         r = r.eq("brand_id", Number(filters.brandId));
    if (filters.branchId)        r = r.eq("branch_id", Number(filters.branchId));
    if (filters.email)           r = r.ilike("recipient_email", `%${filters.email}%`);
    if (filters.statuses.length) r = r.in("status", filters.statuses);
    return r;
  }

  // ── All queries in parallel ───────────────────────────────────────────────
  const [
    brandWide,
    branchSpecific,
    globals,
    brandsCount,
    sendsFiltered,
    deliveredFiltered,
    bouncedFiltered,
    failedFiltered,
    volumeRaw,
    statusRaw,
    recentAudit,
  ] = await Promise.all([
    // Recipients — never filtered (structural metric)
    sync.from("email_recipients").select("*", { count: "exact", head: true }).eq("active", true).is("branch_id", null),
    sync.from("email_recipients").select("*", { count: "exact", head: true }).eq("active", true).not("branch_id", "is", null),
    sync.from("global_recipients").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("brands").select("*", { count: "exact", head: true }).eq("is_archived", false),

    // Metric counts — respect all filters
    applyFilters(sync.from("email_sends").select("*", { count: "exact", head: true })),
    applyFilters(sync.from("email_sends").select("*", { count: "exact", head: true }).eq("status", "delivered")),
    applyFilters(sync.from("email_sends").select("*", { count: "exact", head: true }).eq("status", "bounced")),
    applyFilters(sync.from("email_sends").select("*", { count: "exact", head: true }).eq("status", "failed")),

    // Chart data — respect filters
    applyFilters(sync.from("email_sends").select("sent_at").limit(5000)),
    applyFilters(sync.from("email_sends").select("status").limit(5000)),

    // Audit log — structural, never filtered
    sync.from("email_audit_log")
      .select("id, table_name, record_id, action, changed_at")
      .order("changed_at", { ascending: false })
      .limit(15),
  ]);

  // Server-side error logging
  for (const [k, r] of Object.entries({ brandWide, branchSpecific, globals, brandsCount, sendsFiltered, deliveredFiltered, bouncedFiltered, failedFiltered })) {
    if ("error" in r && r.error) console.error(`[dashboard] ${k}:`, r.error.message);
  }

  // ── Section 1: Metrics ────────────────────────────────────────────────────
  const bwCount  = brandWide.count   ?? 0;
  const bsCount  = branchSpecific.count ?? 0;
  const glCount  = globals.count     ?? 0;
  const totalRecipients = bwCount + bsCount + glCount;

  const totalSends     = sendsFiltered.count     ?? 0;
  const totalDelivered = deliveredFiltered.count  ?? 0;
  const bouncedCount   = bouncedFiltered.count    ?? 0;
  const failedCount    = failedFiltered.count     ?? 0;
  const totalIssues    = bouncedCount + failedCount;
  const hasEmailData   = totalSends > 0;

  const deliveryRate = hasEmailData ? Math.round((totalDelivered / totalSends) * 100) : null;
  const deliveryStatus =
    deliveryRate === null ? "empty"
    : deliveryRate >= 95  ? "good"
    : deliveryRate >= 90  ? "warning"
    : "critical";

  // ── Section 2: Chart data ─────────────────────────────────────────────────
  const dayMap: Record<string, number> = {};
  for (const row of volumeRaw.data ?? []) {
    const day = (row.sent_at as string).substring(0, 10);
    dayMap[day] = (dayMap[day] ?? 0) + 1;
  }

  // Build chart from the active date range (not always 30 days)
  const chartDays = buildDateRange(filters.from, filters.to);
  const volumeChartData: DayVolume[] = chartDays.map((key) => ({
    date: key,
    count: dayMap[key] ?? 0,
  }));

  const statusMap: Record<string, number> = {};
  for (const row of statusRaw.data ?? []) {
    const s = row.status as string;
    statusMap[s] = (statusMap[s] ?? 0) + 1;
  }
  const statusChartData: StatusCount[] = Object.entries(statusMap)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
  const totalSends30d = statusChartData.reduce((s, r) => s + r.count, 0);

  // ── Section 3: Recent sends ───────────────────────────────────────────────
  let sendsData: SendRow[]                     = [];
  let brandMap: Record<number, string>         = {};
  let branchMap: Record<number, string>        = {};
  let eventMap: Record<string, EventRow[]>     = {};

  if (hasEmailData) {
    const sendsQ = applyFilters(
      sync.from("email_sends").select(
        "id, brand_id, branch_id, recipient_email, status, subject, sent_at, sg_message_id, failure_reason",
      ),
    ).order("sent_at", { ascending: false }).limit(20);

    const sendsRes = await sendsQ;
    sendsData = (sendsRes.data ?? []) as SendRow[];

    const bIds  = [...new Set(sendsData.map((s) => s.brand_id).filter((id): id is number => id !== null))];
    const brIds = [...new Set(sendsData.map((s) => s.branch_id).filter((id): id is number => id !== null))];
    const sIds  = sendsData.map((s) => s.id);

    const [bRes, brRes, evRes] = await Promise.all([
      bIds.length  > 0 ? supabase.from("brands").select("id, name").in("id", bIds)   : Promise.resolve({ data: [] as { id: number; name: string }[] }),
      brIds.length > 0 ? supabase.from("branches").select("id, name").in("id", brIds) : Promise.resolve({ data: [] as { id: number; name: string | null }[] }),
      sIds.length  > 0 ? sync.from("email_events").select("id, send_id, event_type, event_at, reason").in("send_id", sIds).order("event_at", { ascending: true }) : Promise.resolve({ data: [] as EventRow[] }),
    ]);

    brandMap  = Object.fromEntries((bRes.data  ?? []).map((b) => [b.id, b.name]));
    branchMap = Object.fromEntries((brRes.data ?? []).map((b) => [b.id, b.name ?? `Branch ${b.id}`]));
    for (const e of (evRes.data ?? []) as EventRow[]) {
      if (e.send_id) {
        if (!eventMap[e.send_id]) eventMap[e.send_id] = [];
        eventMap[e.send_id].push(e);
      }
    }
  }

  // ── Filter active label ───────────────────────────────────────────────────
  const isFiltered =
    filters.brandId || filters.branchId || filters.email ||
    filters.statuses.length || filters.preset !== "7d";

  const dateRangeLabel =
    filters.preset !== "custom"
      ? { today: "today", yesterday: "yesterday", "7d": "last 7 days", "30d": "last 30 days", "90d": "last 90 days" }[filters.preset]
      : `${filters.from} → ${filters.to}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Email routing health across all brands.
          </p>
        </div>
        {isFiltered && (
          <p className="shrink-0 text-xs text-muted-foreground">
            Filtered · {dateRangeLabel}
          </p>
        )}
      </div>

      {/* Section 1: Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Recipients"
          primary={totalRecipients}
          breakdown={`${bwCount} brand-wide · ${bsCount} branch · ${glCount} global`}
          icon={Users}
        />
        <MetricCard
          title="Emails Sent"
          primary={hasEmailData ? totalSends.toLocaleString() : "0"}
          note={hasEmailData ? undefined : "Awaiting first send"}
          icon={Send}
          status={hasEmailData ? "default" : "empty"}
        />
        <MetricCard
          title="Delivery Rate"
          primary={deliveryRate !== null ? `${deliveryRate}%` : "—%"}
          breakdown={
            hasEmailData
              ? `${totalDelivered.toLocaleString()} delivered / ${totalSends.toLocaleString()} sent`
              : undefined
          }
          note={!hasEmailData ? "No sends yet" : undefined}
          icon={CheckCircle2}
          status={deliveryStatus}
        />
        <MetricCard
          title="Active Issues"
          primary={totalIssues}
          note={
            !hasEmailData ? "No tracking data yet"
            : totalIssues > 0 ? "Bounced or failed sends"
            : "No issues detected"
          }
          icon={AlertTriangle}
          status={totalIssues > 0 ? "critical" : hasEmailData ? "good" : "empty"}
        />
      </div>

      {/* Filter bar */}
      <FilterBar brands={brandsList} branches={branchesList} defaultOpen={false} />

      {/* Section 2: Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <SendVolumeChart data={volumeChartData} />
        <DeliveryDonut data={statusChartData} total={totalSends30d} />
      </div>

      {/* Sections 3 + 4 */}
      <div className="grid gap-4 items-start 2xl:grid-cols-[1fr_300px]">

        {/* Section 3: Sends / audit log */}
        {hasEmailData ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Recent Sends
                {isFiltered && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    — filtered view · {totalSends.toLocaleString()} total
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ActivityTable
                sends={sendsData}
                brandMap={brandMap}
                branchMap={branchMap}
                eventMap={eventMap}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Mail className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Send tracking not yet active</p>
                <p className="mt-1 max-w-[380px] text-sm text-muted-foreground">
                  Per-send activity will appear here once the email pipeline is deployed.
                </p>
              </div>
            </CardContent>
            {recentAudit.data && recentAudit.data.length > 0 && (
              <>
                <Separator />
                <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Migration Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="divide-y divide-border text-sm">
                    {recentAudit.data.map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground">
                            {row.action}
                          </span>
                          <span className="truncate text-foreground">{row.table_name}</span>
                          <span className="hidden truncate font-mono text-xs text-muted-foreground sm:block">{row.record_id}</span>
                        </div>
                        <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                          {new Date(row.changed_at).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* Section 4: Alerts */}
        <AlertsPanel
          hasEmailData={hasEmailData}
          bouncedCount={bouncedCount}
          failedCount={failedCount}
        />
      </div>
    </div>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────

/** Build an array of YYYY-MM-DD strings covering the active date range (max 90 days). */
function buildDateRange(from: string, to: string): string[] {
  if (!from || !to) return [];
  const start = new Date(from);
  const end   = new Date(to);
  const diff  = Math.min(90, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  return Array.from({ length: diff }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().substring(0, 10);
  });
}
