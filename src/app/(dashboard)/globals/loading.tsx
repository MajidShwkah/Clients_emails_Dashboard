import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            <div className="flex gap-6 border-b pb-2">
              {[200, 80, 60, 40].map((w, i) => (
                <Skeleton key={i} className="h-3" style={{ width: w }} />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-6">
                {[200, 80, 60, 40].map((w, j) => (
                  <Skeleton
                    key={j}
                    className="h-3"
                    style={{ width: w, opacity: 1 - i * 0.1 }}
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
