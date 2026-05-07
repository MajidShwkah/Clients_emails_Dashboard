"use client";

import React, { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronRight, Copy, Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SendRow = {
  id: string;
  brand_id: number | null;
  branch_id: number | null;
  recipient_email: string;
  status: string;
  subject: string | null;
  sent_at: string;
  sg_message_id: string | null;
  failure_reason: string | null;
};

export type EventRow = {
  id: number;
  send_id: string | null;
  event_type: string;
  event_at: string;
  reason: string | null;
};

type GroupBy = "none" | "brand" | "date" | "status";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  delivered: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", label: "Delivered" },
  opened:    { bg: "bg-blue-100 dark:bg-blue-900/30",       text: "text-blue-700 dark:text-blue-400",       dot: "bg-blue-500",    label: "Opened" },
  clicked:   { bg: "bg-purple-100 dark:bg-purple-900/30",   text: "text-purple-700 dark:text-purple-400",   dot: "bg-purple-500",  label: "Clicked" },
  bounced:   { bg: "bg-red-100 dark:bg-red-900/30",         text: "text-red-700 dark:text-red-400",         dot: "bg-red-500",     label: "Bounced" },
  failed:    { bg: "bg-red-100 dark:bg-red-900/30",         text: "text-red-700 dark:text-red-400",         dot: "bg-red-500",     label: "Failed" },
  processed: { bg: "bg-amber-100 dark:bg-amber-900/30",     text: "text-amber-700 dark:text-amber-400",     dot: "bg-amber-500",   label: "Processed" },
  queued:    { bg: "bg-amber-100 dark:bg-amber-900/30",     text: "text-amber-700 dark:text-amber-400",     dot: "bg-amber-400",   label: "Queued" },
  pending:   { bg: "bg-muted",                              text: "text-muted-foreground",                  dot: "bg-muted-foreground/50", label: "Pending" },
};

function getStatus(status: string) {
  return STATUS_STYLES[status] ?? {
    bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground/50", label: status,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = getStatus(status);
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium", s.bg, s.text)}>
      {s.label}
    </span>
  );
}

function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn("rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground", className)}
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ── Email Journey Drawer ───────────────────────────────────────────────────────

function JourneyDrawer({
  send,
  brandMap,
  branchMap,
  events,
  onClose,
}: {
  send: SendRow | null;
  brandMap: Record<number, string>;
  branchMap: Record<number, string>;
  events: EventRow[];
  onClose: () => void;
}) {
  const s = getStatus(send?.status ?? "");

  return (
    <Sheet open={send !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md"
        showCloseButton
      >
        {send && (
          <>
            {/* Header */}
            <SheetHeader className="border-b border-border px-5 pb-4 pt-5">
              <div className="flex items-center gap-2">
                <StatusBadge status={send.status} />
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {format(new Date(send.sent_at), "MMM d, yyyy · HH:mm:ss")}
                </span>
              </div>
              <SheetTitle className="mt-1 break-all text-base font-semibold">
                {send.recipient_email}
              </SheetTitle>
              {send.subject && (
                <SheetDescription className="text-sm">
                  {send.subject}
                </SheetDescription>
              )}
            </SheetHeader>

            <div className="flex flex-col gap-0 divide-y divide-border">

              {/* Send metadata */}
              <section className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4">
                <MetaField label="Brand">
                  {send.brand_id
                    ? (brandMap[send.brand_id] ?? `Brand ${send.brand_id}`)
                    : "—"}
                </MetaField>
                <MetaField label="Branch">
                  {send.branch_id
                    ? (branchMap[send.branch_id] ?? `Branch ${send.branch_id}`)
                    : "—"}
                </MetaField>
                <MetaField label="Send ID" mono copyValue={send.id}>
                  <span className="truncate">{send.id}</span>
                </MetaField>
                <MetaField label="Sent">
                  {formatDistanceToNow(new Date(send.sent_at), { addSuffix: true })}
                </MetaField>
              </section>

              {/* Message ID */}
              {send.sg_message_id && (
                <section className="px-5 py-4">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    SendGrid Message ID
                  </p>
                  <div className="flex items-start gap-1.5">
                    <span className="break-all font-mono text-xs leading-5 text-foreground">
                      {send.sg_message_id}
                    </span>
                    <CopyButton value={send.sg_message_id} className="mt-0.5 shrink-0" />
                  </div>
                </section>
              )}

              {/* Failure reason */}
              {send.failure_reason && (
                <section className="px-5 py-4">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-500">
                    Failure Reason
                  </p>
                  <p className="rounded-md bg-red-50 px-3 py-2 text-xs leading-5 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                    {send.failure_reason}
                  </p>
                </section>
              )}

              {/* Event timeline */}
              <section className="px-5 py-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Event Timeline
                </p>
                {events.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No events recorded.</p>
                ) : (
                  <ol className="relative">
                    {events.map((e, i) => {
                      const es = getStatus(e.event_type);
                      return (
                        <li key={e.id} className="flex gap-3 pb-4 last:pb-0">
                          <div className="flex flex-col items-center">
                            <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", es.dot)} />
                            {i < events.length - 1 && (
                              <span className="mt-1 w-px flex-1 bg-border" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-sm font-medium capitalize">
                                {e.event_type}
                              </span>
                              <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground">
                                {format(new Date(e.event_at), "MMM d · HH:mm:ss")}
                              </span>
                            </div>
                            {e.reason && (
                              <p className="mt-0.5 text-xs text-red-500">{e.reason}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>

            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MetaField({
  label,
  mono,
  copyValue,
  children,
}: {
  label: string;
  mono?: boolean;
  copyValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className={cn("flex items-center gap-1 text-sm", mono && "font-mono text-xs")}>
        <span className="truncate">{children}</span>
        {copyValue && <CopyButton value={copyValue} />}
      </div>
    </div>
  );
}

// ── CSV export ─────────────────────────────────────────────────────────────────

function exportCsv(
  sends: SendRow[],
  brandMap: Record<number, string>,
  branchMap: Record<number, string>,
) {
  const HEADERS = ["Time", "Brand", "Branch", "Recipient", "Status", "Subject", "Message ID", "Failure Reason"];
  const rows = sends.map((s) => [
    s.sent_at,
    s.brand_id  ? (brandMap[s.brand_id]   ?? `Brand ${s.brand_id}`)   : "",
    s.branch_id ? (branchMap[s.branch_id] ?? `Branch ${s.branch_id}`) : "",
    s.recipient_email,
    s.status,
    s.subject         ?? "",
    s.sg_message_id   ?? "",
    s.failure_reason  ?? "",
  ]);
  const csv = [HEADERS, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `sends-${new Date().toISOString().substring(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── ActivityTable ──────────────────────────────────────────────────────────────

export function ActivityTable({
  sends,
  brandMap,
  branchMap,
  eventMap,
}: {
  sends: SendRow[];
  brandMap: Record<number, string>;
  branchMap: Record<number, string>;
  eventMap: Record<string, EventRow[]>;
}) {
  const [selected, setSelected] = useState<SendRow | null>(null);
  const [groupBy, setGroupBy]   = useState<GroupBy>("none");

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ key: "", rows: sends }];

    const map = new Map<string, SendRow[]>();
    for (const s of sends) {
      let key: string;
      if (groupBy === "brand") {
        key = s.brand_id ? (brandMap[s.brand_id] ?? `Brand ${s.brand_id}`) : "No brand";
      } else if (groupBy === "date") {
        key = s.sent_at.substring(0, 10);
      } else {
        key = s.status;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([key, rows]) => ({ key, rows }));
  }, [sends, groupBy, brandMap]);

  function formatGroupKey(key: string): string {
    if (groupBy === "date") {
      try { return format(new Date(key + "T12:00:00"), "MMMM d, yyyy"); }
      catch { return key; }
    }
    if (groupBy === "status") return getStatus(key).label;
    return key;
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Group by</span>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 gap-1.5 text-xs text-muted-foreground"
          onClick={() => exportCsv(sends, brandMap, branchMap)}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-5 pb-2" />
              <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">Time</th>
              <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">Brand</th>
              <th className="hidden pb-2 pr-4 text-left text-xs font-medium text-muted-foreground md:table-cell">Branch</th>
              <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">Recipient</th>
              <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="hidden pb-2 text-left text-xs font-medium text-muted-foreground lg:table-cell">Subject</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(({ key, rows }) => (
              <React.Fragment key={key || "__ungrouped"}>
                {groupBy !== "none" && (
                  <tr>
                    <td colSpan={7} className="pb-1 pt-4 first:pt-1">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="shrink-0">{formatGroupKey(key)}</span>
                        <span className="flex-1 border-t border-border" />
                        <span className="shrink-0">{rows.length}</span>
                      </div>
                    </td>
                  </tr>
                )}
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className="cursor-pointer border-b border-border transition-colors hover:bg-muted/40"
                    onClick={() => setSelected(s)}
                  >
                    <td className="py-2.5 pr-2 text-muted-foreground/40">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-xs whitespace-nowrap text-muted-foreground">
                      {formatDistanceToNow(new Date(s.sent_at), { addSuffix: true })}
                    </td>
                    <td className="py-2.5 pr-4 font-medium">
                      {s.brand_id ? (brandMap[s.brand_id] ?? `Brand ${s.brand_id}`) : "—"}
                    </td>
                    <td className="hidden py-2.5 pr-4 text-muted-foreground md:table-cell">
                      {s.branch_id ? (branchMap[s.branch_id] ?? `Branch ${s.branch_id}`) : "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="block max-w-[160px] truncate" title={s.recipient_email}>
                        {s.recipient_email}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="hidden py-2.5 lg:table-cell">
                      <span className="block max-w-[220px] truncate text-muted-foreground" title={s.subject ?? ""}>
                        {s.subject ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Email Journey Drawer */}
      <JourneyDrawer
        send={selected}
        brandMap={brandMap}
        branchMap={branchMap}
        events={selected ? (eventMap[selected.id] ?? []) : []}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
