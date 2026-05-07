import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Status = "default" | "good" | "warning" | "critical" | "empty";

const valueColors: Record<Status, string> = {
  default: "text-foreground",
  good: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
  empty: "text-muted-foreground",
};

const iconBg: Record<Status, string> = {
  default: "bg-muted text-muted-foreground",
  good: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  critical: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  empty: "bg-muted text-muted-foreground",
};

export function MetricCard({
  title,
  primary,
  breakdown,
  note,
  icon: Icon,
  status = "default",
}: {
  title: string;
  primary: string | number;
  breakdown?: string;
  note?: string;
  icon: LucideIcon;
  status?: Status;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <span className={cn("rounded-md p-1.5", iconBg[status])}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className={cn("mt-3 text-3xl font-bold tabular-nums leading-none", valueColors[status])}>
          {primary}
        </p>
        {breakdown && (
          <p className="mt-1.5 text-xs text-muted-foreground">{breakdown}</p>
        )}
        {note && (
          <p className="mt-3 border-t border-border pt-2.5 text-xs text-muted-foreground">
            {note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
