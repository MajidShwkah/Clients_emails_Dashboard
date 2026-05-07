import { Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Sends — RIME Email Routing" };

export default function SendsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sends</h1>
        <p className="text-sm text-muted-foreground">
          Per-recipient send history, status, and SendGrid events.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Not yet available</CardTitle>
              <CardDescription>
                Send tracking will appear here once the new edge function is
                deployed.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Until then, the <code className="font-mono">sync.email_sends</code>{" "}
          and <code className="font-mono">sync.email_events</code> tables remain
          empty. No action is required from you.
        </CardContent>
      </Card>
    </div>
  );
}
