import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Mail, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RecipientFormDialog } from "@/components/recipients/recipient-form-dialog";
import { RecipientsTable } from "@/components/recipients/recipients-table";
import { BranchExtrasSection } from "@/components/brands/branch-extras-section";
import type { Brand, Branch, EmailRecipient } from "@/lib/types/db";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  return { title: `Brand ${id} — RIME Email Routing` };
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const brandId = Number(id);
  if (!Number.isInteger(brandId) || brandId <= 0) notFound();

  const supabase = await createClient();

  const [brandRes, branchesRes, recipientsRes] = await Promise.all([
    supabase
      .from("brands")
      .select("id, name, business_action_email, is_client, is_locked")
      .eq("id", brandId)
      .maybeSingle(),
    supabase
      .from("branches")
      .select("*")
      .eq("brand", brandId)
      .eq("is_archived", false)
      .order("name", { ascending: true }),
    supabase
      .schema("sync")
      .from("email_recipients")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false }),
  ]);

  if (brandRes.error || !brandRes.data) notFound();
  const brand = brandRes.data as unknown as Brand;
  const branches = (branchesRes.data ?? []) as unknown as Branch[];
  const recipients = (recipientsRes.data ?? []) as unknown as EmailRecipient[];

  const brandWide = recipients.filter((r) => r.branch_id === null);
  const byBranch = new Map<number, EmailRecipient[]>();
  for (const r of recipients) {
    if (r.branch_id !== null) {
      const arr = byBranch.get(r.branch_id) ?? [];
      arr.push(r);
      byBranch.set(r.branch_id, arr);
    }
  }

  const branchOptions = branches.map((b) => ({
    id: b.id,
    name: b.name ?? `Branch #${b.id}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/brands"
          className="inline-flex items-center hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Brands
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{brand.name}</CardTitle>
              <Badge variant="outline" className="font-mono">
                #{brand.id}
              </Badge>
              {brand.is_client ? (
                <Badge variant="secondary">Client</Badge>
              ) : (
                <Badge variant="outline">Non-client</Badge>
              )}
            </div>
            <CardDescription>
              {branches.length} active branch
              {branches.length === 1 ? "" : "es"} · {recipients.length} total
              recipient row{recipients.length === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <TooltipProvider>
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {brand.business_action_email ?? "— not set —"}
                  </span>
                  <Tooltip>
                    <TooltipTrigger
                      render={<Badge variant="outline" className="cursor-help" />}
                    >
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Default
                    </TooltipTrigger>
                    <TooltipContent>
                      Always notified — managed elsewhere, read-only here.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground">
                  brands.business_action_email
                </p>
              </div>
            </div>
          </TooltipProvider>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Brand-wide extras</CardTitle>
            <CardDescription>
              Notified for every branch of this brand.
            </CardDescription>
          </div>
          <RecipientFormDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add brand-wide
              </Button>
            }
            brandId={brandId}
            lockedBranchId={null}
          />
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <RecipientsTable
            rows={brandWide}
            brandId={brandId}
            lockedBranchId={null}
            emptyLabel="No brand-wide extras configured."
          />
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Branch-specific extras</h2>
            <p className="text-sm text-muted-foreground">
              Notified only for the selected branch.
            </p>
          </div>
          {branchOptions.length > 0 ? (
            <RecipientFormDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add for any branch…
                </Button>
              }
              brandId={brandId}
              branches={branchOptions}
            />
          ) : null}
        </div>
        <BranchExtrasSection
          brandId={brandId}
          branches={branches}
          recipientsByBranch={byBranch}
        />
      </div>
    </div>
  );
}
