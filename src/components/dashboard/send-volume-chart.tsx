"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type DayVolume = { date: string; count: number };

export function SendVolumeChart({ data, title }: { data: DayVolume[]; title: string }) {
  const isEmpty = data.every((d) => d.count === 0);

  // Show a tick every N days so labels don't overlap
  const interval = data.length <= 1 ? 0
    : data.length <= 7  ? 1
    : data.length <= 14 ? 2
    : data.length <= 31 ? 4
    : 13;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSendVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                interval={interval}
                tickFormatter={(v) => {
                  try { return format(parseISO(v as string), "MMM d"); }
                  catch { return v as string; }
                }}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
                labelFormatter={(v) => {
                  try { return format(parseISO(v as string), "MMM d, yyyy"); }
                  catch { return v as string; }
                }}
                formatter={(v) => [v, "Sends"]}
                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gradSendVolume)"
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="max-w-[220px] text-center text-sm text-muted-foreground">
                No sends in this period
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
