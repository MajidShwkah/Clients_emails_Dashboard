"use client";

import { useState } from "react";
import { format } from "date-fns";
import { History, Loader2, MailX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SendEntry = {
  id: string;
  status: string;
  subject: string | null;
  sent_at: string;
  failure_reason: string | null;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  delivered: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", label: "Delivered" },
  opened:    { bg: "bg-blue-100 dark:bg-blue-900/30",       text: "text-blue-700 dark:text-blue-400",       dot: "bg-blue-500",   label: "Opened" },
  clicked:   { bg: "bg-purple-100 dark:bg-purple-900/30",   text: "text-purple-700 dark:text-purple-400",   dot: "bg-purple-500", label: "Clicked" },
  bounced:   { bg: "bg-red-100 dark:bg-red-900/30",         text: "text-red-700 dark:text-red-400",         dot: "bg-red-500",    label: "Bounced" },
  failed:    { bg: "bg-red-100 dark:bg-red-900/30",         text: "text-red-700 dark:text-red-400",         dot: "bg-red-500",    label: "Failed" },
  processed: { bg: "bg-amber-100 dark:bg-amber-900/30",     text: "text-amber-700 dark:text-amber-400",     dot: "bg-amber-500",  label: "Processed" },
  dropped:   { bg: "bg-red-100 dark:bg-red-900/30",         text: "text-red-700 dark:text-red-400",         dot: "bg-red-400",    label: "Dropped" },
  spam:      { bg: "bg-orange-100 dark:bg-orange-900/30",   text: "text-orange-700 dark:text-orange-400",   dot: "bg-orange-500", label: "Spam" },
};

function getStatus(status: string) {
  return STATUS_STYLES[status] ?? {
    bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground/40", label: status,
  };
}

export function RecipientHistoryDrawer({
  email,
  brandId,
  brandName,
  fromDate,
  toDate,
}: {
  email: string;
  brandId: number | null;
  brandName: string;
  fromDate: string;
  toDate: string;
}) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [sends,   setSends]   = useState<SendEntry[] | null>(null);

  async function load() {
    if (sends !== null) { setOpen(true); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase
        .schema("sync")
        .from("email_sends")
        .select("id, status, subject, sent_at, failure_reason")
        .ilike("recipient_email", email)
        .gte("sent_at", `${fromDate}T00:00:00.000Z`)
        .lte("sent_at", `${toDate}T23:59:59.999Z`)
        .order("sent_at", { ascending: false })
        .limit(100);
      if (brandId) q = q.eq("brand_id", brandId);
      const { data } = await q;
      setSends((data ?? []) as SendEntry[]);
    } finally {
      setLoading(false);
      setOpen(true);
    }
  }

  return (
    <>
      <button
        onClick={load}
        disabled={loading}
        title="View send history"
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <History className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">History</span>
      </button>

      <Sheet open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border px-5 pb-4 pt-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
                {brandName}
              </span>
              <span>·</span>
              <span>{fromDate === toDate ? fromDate : `${fromDate} → ${toDate}`}</span>
            </div>
            <SheetTitle className="mt-1 break-all text-base font-semibold">
              {email}
            </SheetTitle>
            <SheetDescription className="text-sm">
              Send history within the selected date range
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {sends === null || loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : sends.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <MailX className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-sm">No sends found</p>
                <p className="text-xs text-muted-foreground">
                  No send records for this recipient in the selected date range.
                </p>
              </div>
            ) : (
              <ol className="relative border-l border-border pl-6 space-y-0">
                {sends.map((s, i) => {
                  const st = getStatus(s.status);
                  return (
                    <li key={s.id} className={cn("pb-6", i === sends.length - 1 && "pb-0")}>
                      {/* Timeline dot */}
                      <span className={cn(
                        "absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                        st.dot,
                      )} />

                      <div className="flex flex-col gap-1">
                        {/* Date + status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {format(new Date(s.sent_at), "MMM d, yyyy · HH:mm")}
                          </span>
                          <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium", st.bg, st.text)}>
                            {st.label}
                          </span>
                        </div>

                        {/* Subject */}
                        {s.subject && (
                          <p className="text-sm text-foreground leading-snug">{s.subject}</p>
                        )}

                        {/* Failure reason */}
                        {s.failure_reason && (
                          <p className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                            {s.failure_reason}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
