"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type StatusCount = { status: string; count: number };

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  delivered:  { color: "#10b981", label: "Delivered" },
  opened:     { color: "#3b82f6", label: "Opened" },
  clicked:    { color: "#8b5cf6", label: "Clicked" },
  bounced:    { color: "#ef4444", label: "Bounced" },
  failed:     { color: "#dc2626", label: "Failed" },
  processed:  { color: "#f59e0b", label: "Processed" },
  queued:     { color: "#fbbf24", label: "Queued" },
  pending:    { color: "#6b7280", label: "Pending" },
};

export function DeliveryDonut({
  data,
  total,
  title,
}: {
  data: StatusCount[];
  total: number;
  title: string;
}) {
  const isEmpty = total === 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[300px]">
          {isEmpty ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ status: "empty", count: 1 }]}
                    dataKey="count"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={112}
                    strokeWidth={0}
                    isAnimationActive={false}
                  >
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="max-w-[130px] text-center text-xs text-muted-foreground">
                  No sends in this period
                </p>
              </div>
            </>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="status"
                    cx="40%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={112}
                    paddingAngle={2}
                    strokeWidth={0}
                    label={false}
                    labelLine={false}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_CONFIG[entry.status]?.color ?? "#6b7280"}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center total */}
              <div
                className="pointer-events-none absolute"
                style={{ left: "40%", top: "50%", transform: "translate(-50%, -50%)" }}
              >
                <div className="text-center">
                  <p className="text-2xl font-bold tabular-nums leading-none">
                    {total.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">total</p>
                </div>
              </div>

              {/* Legend */}
              <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-1.5">
                {data.map((entry) => {
                  const cfg = STATUS_CONFIG[entry.status];
                  const pct = Math.round((entry.count / total) * 100);
                  return (
                    <div key={entry.status} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: cfg?.color ?? "#6b7280" }}
                      />
                      <span className="text-[11px] text-muted-foreground">
                        {cfg?.label ?? entry.status}
                      </span>
                      <span className="ml-auto pl-2 text-[11px] tabular-nums font-medium">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
