import { createClient } from "@/lib/supabase/server";
import {
  ActivityTable,
  type SendRow,
  type EventRow,
} from "@/components/dashboard/activity-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { parseFilters } from "@/lib/filter-utils";
import { Pagination } from "@/components/brands/pagination";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Sends — RIME Email Routing" };

const PAGE_SIZE = 25;

export default async function SendsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp      = await props.searchParams;
  const page    = Math.max(1, Number(sp.page ?? 1) || 1);
  const filters = parseFilters(sp);

  const supabase = await createClient();
  const sync     = supabase.schema("sync");

  // from/to as UTC boundary timestamps
  const fromTs = filters.from ? `${filters.from}T00:00:00.000Z` : undefined;
  const toTs   = filters.to   ? `${filters.to}T23:59:59.999Z`   : undefined;

  // ── Filter bar data (brands + branches) ─────────────────────────────────
  const [brandsRes, branchesRes] = await Promise.all([
    supabase.from("brands").select("id, name").eq("is_archived", false).order("name"),
    supabase.from("branches").select("id, name, brand").eq("is_archived", false).order("name"),
  ]);

  const brands   = brandsRes.data   ?? [];
  const branches = (branchesRes.data ?? []) as { id: number; name: string | null; brand: number }[];

  // ── Sends query ──────────────────────────────────────────────────────────
  let countQ = sync.from("email_sends").select("*", { count: "exact", head: true });
  let rowQ   = sync
    .from("email_sends")
    .select("id, brand_id, branch_id, recipient_email, status, subject, sent_at, sg_message_id, failure_reason")
    .order("sent_at", { ascending: false });

  if (fromTs)                   { countQ = countQ.gte("sent_at", fromTs);  rowQ = rowQ.gte("sent_at", fromTs); }
  if (toTs)                     { countQ = countQ.lte("sent_at", toTs);    rowQ = rowQ.lte("sent_at", toTs); }
  if (filters.brandId)          { countQ = countQ.eq("brand_id", Number(filters.brandId));   rowQ = rowQ.eq("brand_id", Number(filters.brandId)); }
  if (filters.branchId)         { countQ = countQ.eq("branch_id", Number(filters.branchId)); rowQ = rowQ.eq("branch_id", Number(filters.branchId)); }
  if (filters.email)            { countQ = countQ.ilike("recipient_email", `%${filters.email}%`); rowQ = rowQ.ilike("recipient_email", `%${filters.email}%`); }
  if (filters.statuses.length)  { countQ = countQ.in("status", filters.statuses);  rowQ = rowQ.in("status", filters.statuses); }

  const from = (page - 1) * PAGE_SIZE;
  const [countRes, rowRes] = await Promise.all([
    countQ,
    rowQ.range(from, from + PAGE_SIZE - 1),
  ]);

  if (countRes.error) console.error("[sends] count:", countRes.error.message);
  if (rowRes.error)   console.error("[sends] rows:", rowRes.error.message);

  const sends = (rowRes.data ?? []) as SendRow[];
  const total = countRes.count ?? 0;

  // ── Brand / branch / event lookups for table ─────────────────────────────
  const brandIds  = [...new Set(sends.map((s) => s.brand_id).filter((id): id is number => id !== null))];
  const branchIds = [...new Set(sends.map((s) => s.branch_id).filter((id): id is number => id !== null))];
  const sendIds   = sends.map((s) => s.id);

  const [bNamesRes, brNamesRes, eventsRes] = await Promise.all([
    brandIds.length  > 0 ? supabase.from("brands").select("id, name").in("id", brandIds)   : Promise.resolve({ data: [] as { id: number; name: string }[] }),
    branchIds.length > 0 ? supabase.from("branches").select("id, name").in("id", branchIds) : Promise.resolve({ data: [] as { id: number; name: string | null }[] }),
    sendIds.length   > 0
      ? sync.from("email_events").select("id, send_id, event_type, event_at, reason").in("send_id", sendIds).order("event_at", { ascending: true })
      : Promise.resolve({ data: [] as EventRow[] }),
  ]);

  const brandMap  = Object.fromEntries((bNamesRes.data  ?? []).map((b) => [b.id, b.name]));
  const branchMap = Object.fromEntries((brNamesRes.data ?? []).map((b) => [b.id, b.name ?? `Branch ${b.id}`]));

  const eventMap: Record<string, EventRow[]> = {};
  for (const e of (eventsRes.data ?? []) as EventRow[]) {
    if (e.send_id) {
      if (!eventMap[e.send_id]) eventMap[e.send_id] = [];
      eventMap[e.send_id].push(e);
    }
  }

  // ── Active filter summary ─────────────────────────────────────────────────
  const filterSummary = buildSummary(filters, brands);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sends</h1>
        <p className="text-sm text-muted-foreground">
          Per-recipient send history, status, and event timeline.
        </p>
      </div>

      {/* Filter bar */}
      <FilterBar brands={brands} branches={branches} />

      {/* Result summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filterSummary && (
            <span className="mr-1 font-medium text-foreground">{filterSummary} ·</span>
          )}
          {total.toLocaleString()} send{total !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-4">
          {rowRes.error ? (
            <p className="py-6 text-sm text-destructive">{rowRes.error.message}</p>
          ) : sends.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No sends match your filters. Try adjusting the date range or clearing a filter.
            </div>
          ) : (
            <ActivityTable
              sends={sends}
              brandMap={brandMap}
              branchMap={branchMap}
              eventMap={eventMap}
            />
          )}
        </CardContent>
      </Card>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} label="sends" />
    </div>
  );
}

function buildSummary(
  filters: ReturnType<typeof parseFilters>,
  brands: { id: number; name: string }[],
): string {
  const parts: string[] = [];
  const brandName = filters.brandId
    ? (brands.find((b) => String(b.id) === filters.brandId)?.name ?? `Brand ${filters.brandId}`)
    : null;

  if (brandName) parts.push(brandName);
  if (filters.email) parts.push(`"${filters.email}"`);
  if (filters.statuses.length) parts.push(filters.statuses.join(", "));

  const dateLabel =
    filters.preset !== "custom"
      ? { today: "today", yesterday: "yesterday", "7d": "last 7 days", "30d": "last 30 days", "90d": "last 90 days" }[filters.preset]
      : filters.from && filters.to
      ? `${filters.from} → ${filters.to}`
      : null;
  if (dateLabel) parts.push(dateLabel);

  return parts.join(" · ");
}
