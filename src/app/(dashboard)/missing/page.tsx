import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Missing Deliveries — RIME Email Routing" };

export default function MissingDeliveriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Missing deliveries
        </h1>
        <p className="text-sm text-muted-foreground">
          Recipients we expected to email but haven't successfully delivered to
          today.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Not yet available</CardTitle>
              <CardDescription>
                Missing-delivery tracking activates when the SendGrid webhook
                is deployed.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Once events flow into <code className="font-mono">sync.email_events</code>,
          the <code className="font-mono">sync.v_missing_deliveries</code> view
          will surface anything that didn't deliver.
        </CardContent>
      </Card>
    </div>
  );
}
