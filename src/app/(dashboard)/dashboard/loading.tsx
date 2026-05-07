import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function MetricSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
        <Skeleton className="mt-3 h-8 w-16" />
        <Skeleton className="mt-1.5 h-3 w-40" />
        <Skeleton className="mt-3 h-3 w-32 border-t pt-2.5" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-36" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex gap-6 border-b pb-2">
            {[60, 80, 100, 120, 80, 60].map((w, i) => (
              <Skeleton key={i} className="h-3" style={{ width: w }} />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-6">
              {[60, 80, 100, 120, 80, 60].map((w, j) => (
                <Skeleton
                  key={j}
                  className="h-3"
                  style={{ width: w, opacity: 1 - i * 0.08 }}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      <div className="grid gap-4 items-start 2xl:grid-cols-[1fr_300px]">
        <TableSkeleton rows={8} />
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col items-center gap-3 py-8">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
