"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "",             label: "All statuses" },
  { value: "never",        label: "Never sent" },
  { value: "undelivered",  label: "Undelivered" },
  { value: "partial",      label: "Partial delivery" },
];

export function MissingFilters({
  brands,
}: {
  brands: { id: number; name: string }[];
}) {
  const router = useRouter();
  const sp     = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [email,    setEmail]    = useState(sp.get("email")  ?? "");
  const [brandId,  setBrandId]  = useState(sp.get("brand")  ?? "");
  const [status,   setStatus]   = useState(sp.get("status") ?? "");

  function apply() {
    const p = new URLSearchParams();
    if (email)   p.set("email",  email);
    if (brandId) p.set("brand",  brandId);
    if (status)  p.set("status", status);
    startTransition(() => router.push(`?${p.toString()}`));
  }

  function reset() {
    setEmail(""); setBrandId(""); setStatus("");
    startTransition(() => router.push("?"));
  }

  const hasActive = email || brandId || status;

  const statusLabel = STATUS_OPTIONS.find((s) => s.value === status)?.label ?? "All statuses";

  return (
    <div className="flex flex-wrap items-end gap-3">

      {/* Email search */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Recipient email</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Search email…"
            className="h-8 w-[220px] rounded-lg border border-input bg-transparent py-1 pl-7 pr-7 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          {email && (
            <button
              onClick={() => setEmail("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Brand */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Brand</span>
        <SearchableSelect
          value={brandId}
          onChange={(v) => setBrandId(v)}
          options={brands.map((b) => ({ value: String(b.id), label: b.name }))}
          allLabel="All brands"
          width="w-[180px]"
        />
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Status</span>
        <Select value={status || "__all"} onValueChange={(v) => setStatus(!v || v === "__all" ? "" : v)}>
          <SelectTrigger className="h-8 w-[160px]">
            <span className="flex-1 truncate text-left text-sm">{statusLabel}</span>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value || "__all"} value={s.value || "__all"}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex items-end gap-2">
        {hasActive && (
          <Button variant="ghost" size="sm" onClick={reset} disabled={pending} className="h-8 text-muted-foreground">
            Reset
          </Button>
        )}
        <Button size="sm" onClick={apply} disabled={pending} className="h-8">
          {pending ? "Applying…" : "Apply"}
        </Button>
      </div>
    </div>
  );
}
