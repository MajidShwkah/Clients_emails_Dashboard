import Link from "next/link";
import { Building2, ChevronRight, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BrandsSearch } from "@/components/brands/brands-search";
import { Pagination } from "@/components/brands/pagination";
import type { Brand } from "@/lib/types/db";

type BrandRow = Pick<
  Brand,
  "id" | "name" | "business_action_email" | "is_client" | "is_locked"
>;

export const metadata = { title: "Brands — RIME Email Routing" };

const PAGE_SIZE = 25;

export default async function BrandsPage(props: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await props.searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const includeNonClients = sp.include_non_clients === "1";

  const supabase = await createClient();

  let query = supabase
    .from("brands")
    .select("id, name, business_action_email, is_client, is_locked", {
      count: "exact",
    })
    .eq("is_archived", false)
    .order("name", { ascending: true });

  if (!includeNonClients) {
    query = query.eq("is_client", true);
  }
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await query.range(from, to);
  const brands = (data ?? []) as unknown as BrandRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
          <p className="text-sm text-muted-foreground">
            {count ?? 0} {includeNonClients ? "total" : "active client"} brand
            {(count ?? 0) === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href={
            includeNonClients
              ? `/brands?${q ? `q=${encodeURIComponent(q)}` : ""}`
              : `/brands?include_non_clients=1${q ? `&q=${encodeURIComponent(q)}` : ""}`
          }
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
        >
          {includeNonClients ? "Show clients only" : "Include non-clients"}
        </Link>
      </div>

      <BrandsSearch initial={q} />

      <Card>
        <CardContent className="p-0">
          {error ? (
            <p className="p-6 text-sm text-destructive">
              Could not load brands. {error.message}
            </p>
          ) : !brands || brands.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No brands match your filters.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Default email</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((b) => (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer hover:bg-muted/40"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {b.id}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/brands/${b.id}`}
                        className="font-medium hover:underline"
                      >
                        {b.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.business_action_email ?? (
                        <span className="italic">— not set —</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {b.is_client ? (
                          <Badge variant="secondary">Client</Badge>
                        ) : (
                          <Badge variant="outline">Non-client</Badge>
                        )}
                        {b.is_locked ? (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/brands/${b.id}`}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Open ${b.name}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} />
    </div>
  );
}
