import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function MissingLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-48 rounded-md" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            <div className="flex gap-6 border-b pb-2">
              {[120, 180, 80, 70, 60, 60].map((w, i) => (
                <Skeleton key={i} className="h-3" style={{ width: w }} />
              ))}
            </div>
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex gap-6">
                {[120, 180, 80, 70, 60, 60].map((w, j) => (
                  <Skeleton
                    key={j}
                    className="h-3"
                    style={{ width: w, opacity: 1 - i * 0.04 }}
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
