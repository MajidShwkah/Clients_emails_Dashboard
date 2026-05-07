import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Severity = "critical" | "warning";

function AlertCard({
  title,
  severity,
}: {
  title: string;
  severity: Severity;
}) {
  const styles: Record<Severity, { card: string; icon: string }> = {
    critical: {
      card: "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20",
      icon: "text-red-500",
    },
    warning: {
      card: "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20",
      icon: "text-amber-500",
    },
  };

  return (
    <div className={cn("rounded-md border p-3", styles[severity].card)}>
      <div className="flex items-start gap-2">
        <AlertTriangle
          className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", styles[severity].icon)}
        />
        <p className="text-xs font-medium leading-snug">{title}</p>
      </div>
    </div>
  );
}

export function AlertsPanel({
  hasEmailData,
  bouncedCount,
  failedCount,
}: {
  hasEmailData: boolean;
  bouncedCount: number;
  failedCount: number;
}) {
  const alerts: { title: string; severity: Severity }[] = [];

  if (bouncedCount > 0) {
    alerts.push({
      title: `${bouncedCount} bounced send${bouncedCount !== 1 ? "s" : ""} in the last 7 days`,
      severity: "critical",
    });
  }
  if (failedCount > 0) {
    alerts.push({
      title: `${failedCount} failed send${failedCount !== 1 ? "s" : ""} in the last 7 days`,
      severity: "critical",
    });
  }

  const allClear = alerts.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          Attention Required
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {allClear ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <div>
              <p className="text-sm font-medium">All systems healthy</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {hasEmailData ? "No issues detected" : "No tracking data yet"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <AlertCard key={a.title} {...a} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
