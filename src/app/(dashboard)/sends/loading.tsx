import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function SendsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-4 border-b pb-0">
        {[40, 60, 60, 56, 40].map((w, i) => (
          <Skeleton key={i} className="mb-2 h-4" style={{ width: w }} />
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex gap-6 border-b pb-2">
              {[60, 100, 80, 120, 60, 140].map((w, i) => (
                <Skeleton key={i} className="h-3" style={{ width: w }} />
              ))}
            </div>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex gap-6">
                {[60, 100, 80, 120, 60, 140].map((w, j) => (
                  <Skeleton
                    key={j}
                    className="h-3"
                    style={{ width: w, opacity: 1 - i * 0.06 }}
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
