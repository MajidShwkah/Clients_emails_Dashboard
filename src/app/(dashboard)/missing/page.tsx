import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/brands/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { MissingFilters } from "@/components/missing/missing-filters";
import { RecipientHistoryDrawer } from "@/components/missing/recipient-history-drawer";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";
import { presetDates, type DatePreset } from "@/lib/filter-utils";
import { MailX, MailWarning, MailCheck, ArrowUpDown } from "lucide-react";

export const metadata = { title: "Missing Deliveries — RIME Email Routing" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const SOURCE_LABEL: Record<string, string> = {
  default:      "Default",
  brand_extra:  "Brand extra",
  branch_extra: "Branch extra",
  global:       "Global",
};

type SortKey = "priority" | "email" | "brand" | "last";

type MissingRow = {
  brand_id:       number | null;
  branch_id:      number | null;
  email:          string | null;
  source:         string | null;
  total_attempts: number;
  delivered:      number;
  failed:         number;
  last_attempt:   string | null;
};

function StatusBadge({ attempts, delivered }: { attempts: number; delivered: number }) {
  if (attempts === 0) return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
      Never sent
    </span>
  );
  if (delivered === 0) return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Undelivered
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Partial
    </span>
  );
}

function DeliveryFraction({ delivered, attempts }: { delivered: number; attempts: number }) {
  if (attempts === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const missing = attempts - delivered;
  const pct = Math.round((delivered / attempts) * 100);
  return (
    <div className="flex flex-col gap-1 min-w-[90px]">
      <div className="flex items-baseline gap-1 text-xs tabular-nums">
        <span className="font-medium text-foreground">{delivered}</span>
        <span className="text-muted-foreground">/ {attempts}</span>
        {missing > 0 && <span className="ml-1 text-red-500 dark:text-red-400">−{missing}</span>}
      </div>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full", pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function MissingDeliveriesPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await props.searchParams;

  const page    = Math.max(1, Number(sp.page ?? 1) || 1);
  const emailQ  = sp.email  ?? "";
  const brandQ  = sp.brand  ?? "";
  const statusQ = sp.status ?? "";
  const sort    = (sp.sort  ?? "priority") as SortKey;

  // Date range — default to last 30 days
  const preset   = (sp.preset as DatePreset) ?? "30d";
  const safePreset = (preset === "custom" ? "30d" : preset) as Exclude<DatePreset, "custom">;
  const defaults = presetDates(safePreset);
  const fromDate = sp.from ?? defaults.from;
  const toDate   = sp.to   ?? defaults.to;
  const fromTs   = `${fromDate}T00:00:00.000Z`;
  const toTs     = `${toDate}T23:59:59.999Z`;

  const supabase = await createClient();

  // ── All queries in parallel ───────────────────────────────────────────────
  const [brandsRes, summaryRes, rowsRes] = await Promise.all([
    supabase.from("brands").select("id, name").eq("is_archived", false).order("name"),

    // Summary chips — all 3 counts in one query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)("get_missing_delivery_summary", {
      p_from_ts:  fromTs,
      p_to_ts:    toTs,
      p_brand_id: brandQ ? Number(brandQ) : null,
      p_email:    emailQ || null,
    }),

    // Paginated rows via date-aware function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)("get_missing_delivery_rows", {
      p_from_ts:  fromTs,
      p_to_ts:    toTs,
      p_brand_id: brandQ  ? Number(brandQ) : null,
      p_email:    emailQ  || null,
      p_status:   statusQ || null,
      p_sort:     sort,
      p_limit:    PAGE_SIZE,
      p_offset:   (page - 1) * PAGE_SIZE,
    }),
  ]);

  const brands = (brandsRes.data ?? []) as { id: number; name: string }[];
  const rows   = (rowsRes.data   ?? []) as MissingRow[];

  const summaryRows     = (summaryRes.data ?? []) as { status_type: string; cnt: number }[];
  const neverCount       = Number(summaryRows.find((r) => r.status_type === "never")?.cnt       ?? 0);
  const undeliveredCount = Number(summaryRows.find((r) => r.status_type === "undelivered")?.cnt ?? 0);
  const partialCount     = Number(summaryRows.find((r) => r.status_type === "partial")?.cnt     ?? 0);

  // Total for pagination = count of the active status category (or sum of all)
  const total =
    statusQ === "never"       ? neverCount :
    statusQ === "undelivered" ? undeliveredCount :
    statusQ === "partial"     ? partialCount :
    neverCount + undeliveredCount + partialCount;

  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b.name]));
  const hasFilters = emailQ || brandQ || statusQ;

  // ── URL builders ──────────────────────────────────────────────────────────
  function dateParams() {
    return `preset=${preset}&from=${fromDate}&to=${toDate}`;
  }

  function chipHref(s: string) {
    const p = new URLSearchParams();
    p.set("preset", preset); p.set("from", fromDate); p.set("to", toDate);
    if (emailQ) p.set("email", emailQ);
    if (brandQ) p.set("brand", brandQ);
    if (s && s !== statusQ) p.set("status", s);
    return `?${p.toString()}`;
  }

  function sortHref(key: SortKey) {
    const p = new URLSearchParams();
    p.set("preset", preset); p.set("from", fromDate); p.set("to", toDate);
    if (emailQ)  p.set("email",  emailQ);
    if (brandQ)  p.set("brand",  brandQ);
    if (statusQ) p.set("status", statusQ);
    p.set("sort", key);
    return `?${p.toString()}`;
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Missing Deliveries</h1>
        <p className="text-sm text-muted-foreground">
          Recipients with at least one unconfirmed or missing email delivery.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">

        {/* Never sent */}
        <div className="flex items-center gap-1.5">
          <a href={chipHref("never")} className={cn(
            "flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/60",
            statusQ === "never" ? "border-muted-foreground/40 bg-muted" : "border-border bg-card",
          )}>
            <MailX className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Never sent</span>
            <span className="ml-1 font-semibold tabular-nums">{neverCount.toLocaleString()}</span>
          </a>
          <InfoTooltip text="Expected recipients that exist in the system but have received zero email attempts within the selected date range." />
        </div>

        {/* Attempted, undelivered */}
        <div className="flex items-center gap-1.5">
          <a href={chipHref("undelivered")} className={cn(
            "flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-red-50 dark:hover:bg-red-950/20",
            statusQ === "undelivered"
              ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
              : undeliveredCount > 0
              ? "border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/10"
              : "border-border bg-card",
          )}>
            <MailWarning className={cn("h-4 w-4", undeliveredCount > 0 ? "text-red-500" : "text-muted-foreground")} />
            <span className={undeliveredCount > 0 ? "text-red-700 dark:text-red-400" : "text-muted-foreground"}>
              Attempted, undelivered
            </span>
            <span className={cn("ml-1 font-semibold tabular-nums", undeliveredCount > 0 ? "text-red-700 dark:text-red-400" : "")}>
              {undeliveredCount.toLocaleString()}
            </span>
          </a>
          <InfoTooltip text="At least one email was attempted for this recipient in the date range, but every single attempt ended in bounced, failed, dropped, or spam — none reached the inbox." />
        </div>

        {/* Partial delivery */}
        <div className="flex items-center gap-1.5">
          <a href={chipHref("partial")} className={cn(
            "flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/20",
            statusQ === "partial"
              ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
              : "border-border bg-card",
          )}>
            <MailCheck className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">Partial delivery</span>
            <span className="ml-1 font-semibold tabular-nums">{partialCount.toLocaleString()}</span>
          </a>
          <InfoTooltip text="Some emails reached this recipient successfully, but others in the same date range bounced or failed. The delivery bar shows the ratio." />
        </div>

        {statusQ && (
          <a href={chipHref("")} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60">
            Show all
          </a>
        )}
      </div>

      {/* Filters */}
      <MissingFilters brands={brands} />

      {/* Result count */}
      <p className="text-sm text-muted-foreground">
        {hasFilters
          ? <><span className="font-medium text-foreground">{total.toLocaleString()}</span> recipient{total !== 1 ? "s" : ""} match your filters</>
          : <><span className="font-medium text-foreground">{total.toLocaleString()}</span> recipient{total !== 1 ? "s" : ""} with missing deliveries</>
        }
        <span className="ml-2 text-muted-foreground/60">· {fromDate} → {toDate}</span>
      </p>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {rowsRes.error ? (
            <p className="p-6 text-sm text-destructive">{String(rowsRes.error)}</p>
          ) : rows.length === 0 ? (
            <EmptyState statusQ={statusQ} emailQ={emailQ} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <SortTh href={sortHref("brand")} active={sort === "brand"} className="pl-4">Brand</SortTh>
                    <SortTh href={sortHref("email")} active={sort === "email"}>Email</SortTh>
                    <th className="hidden px-3 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">Source</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="hidden px-3 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">
                      Delivered / Total
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground/60">red = missing</span>
                    </th>
                    <SortTh href={sortHref("last")} active={sort === "last"} className="hidden xl:table-cell">Last Attempt</SortTh>
                    <th className="px-3 py-3 text-xs font-medium text-muted-foreground">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row, i) => {
                    const brandName = row.brand_id ? (brandMap[row.brand_id] ?? `Brand ${row.brand_id}`) : "—";
                    const attempts  = Number(row.total_attempts ?? 0);
                    const delivered = Number(row.delivered      ?? 0);

                    return (
                      <tr key={`${row.brand_id}-${row.branch_id}-${row.email}-${i}`}
                        className="transition-colors hover:bg-muted/40">
                        <td className="py-2.5 pl-4 pr-3 font-medium">{brandName}</td>
                        <td className="px-3 py-2.5">
                          <span className="block max-w-[220px] truncate font-mono text-xs" title={row.email ?? ""}>
                            {row.email ?? "—"}
                          </span>
                        </td>
                        <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell">
                          {SOURCE_LABEL[row.source ?? ""] ?? row.source ?? "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge attempts={attempts} delivered={delivered} />
                        </td>
                        <td className="hidden px-3 py-2.5 lg:table-cell">
                          <DeliveryFraction delivered={delivered} attempts={attempts} />
                        </td>
                        <td className="hidden px-3 py-2.5 text-xs text-muted-foreground xl:table-cell">
                          {row.last_attempt
                            ? new Date(row.last_attempt).toLocaleString()
                            : <span className="italic">Never</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          {row.email && (
                            <RecipientHistoryDrawer
                              email={row.email}
                              brandId={row.brand_id}
                              brandName={brandName}
                              fromDate={fromDate}
                              toDate={toDate}
                            />
                          )}
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function SortTh({ href, active, children, className }: {
  href: string; active: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <th className={cn("px-3 py-3", className)}>
      <a href={href} className={cn(
        "inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}>
        {children}
        <ArrowUpDown className={cn("h-3 w-3", active ? "opacity-100" : "opacity-40")} />
      </a>
    </th>
  );
}

function EmptyState({ statusQ, emailQ }: { statusQ: string; emailQ: string }) {
  const messages: Record<string, { title: string; body: string }> = {
    never:       { title: "No recipients without sends",  body: "All expected recipients have been attempted at least once in this date range." },
    undelivered: { title: "No fully undelivered sends",   body: "All attempted recipients have at least one confirmed delivery." },
    partial:     { title: "No partial deliveries",        body: "No recipients match partial delivery criteria for this date range." },
  };
  const msg = statusQ ? messages[statusQ] : null;

  if (emailQ && !msg) return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <MailX className="h-8 w-8 text-muted-foreground" />
      <p className="font-medium">No results for &ldquo;{emailQ}&rdquo;</p>
      <p className="text-sm text-muted-foreground">Try a different email or clear the search.</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <MailCheck className="h-8 w-8 text-emerald-500" />
      <p className="font-medium">{msg?.title ?? "No missing deliveries"}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {msg?.body ?? "No recipients match your current filters for this date range."}
      </p>
    </div>
  );
}
