import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function BrandsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-4 w-28" />
      </div>

      <Skeleton className="h-9 w-full max-w-xs" />

      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            <div className="flex gap-6 border-b pb-2">
              {[60, 160, 180, 80].map((w, i) => (
                <Skeleton key={i} className="h-3" style={{ width: w }} />
              ))}
            </div>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="flex gap-6">
                {[60, 160, 180, 80].map((w, j) => (
                  <Skeleton
                    key={j}
                    className="h-3"
                    style={{ width: w, opacity: 1 - i * 0.05 }}
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
