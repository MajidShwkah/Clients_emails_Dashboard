"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  type DatePreset,
  type FilterValues,
  parseFilters,
  filtersToParams,
  presetDates,
} from "@/lib/filter-utils";

export type { DatePreset, FilterValues };
export { parseFilters, filtersToParams };

// ── Constants ────────────────────────────────────────────────────────────────

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today",     label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d",        label: "Last 7 days" },
  { value: "30d",       label: "Last 30 days" },
  { value: "90d",       label: "Last 90 days" },
  { value: "custom",    label: "Custom range" },
];

const ALL_STATUSES = [
  { value: "processed", label: "Processed" },
  { value: "delivered", label: "Delivered" },
  { value: "opened",    label: "Opened" },
  { value: "clicked",   label: "Clicked" },
  { value: "bounced",   label: "Bounced" },
  { value: "failed",    label: "Failed" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function FilterBar({
  brands,
  branches,
  defaultOpen = true,
}: {
  brands:   { id: number; name: string }[];
  branches: { id: number; name: string | null; brand: number }[];
  defaultOpen?: boolean;
}) {
  const router     = useRouter();
  const sp         = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen]   = useState(defaultOpen);
  const [local, setLocal] = useState<FilterValues>(() => parseFilters(sp));

  // Branches filtered by selected brand
  const visibleBranches = local.brandId
    ? branches.filter((b) => b.brand === Number(local.brandId))
    : branches;

  // ── Setters ────────────────────────────────────────────────────────────────

  function setPreset(preset: DatePreset) {
    if (preset !== "custom") {
      const dates = presetDates(preset);
      setLocal((p) => ({ ...p, preset, from: dates.from, to: dates.to }));
    } else {
      setLocal((p) => ({ ...p, preset }));
    }
  }

  function setBrand(id: string | null) {
    setLocal((p) => ({ ...p, brandId: !id || id === "__all" ? "" : id, branchId: "" }));
  }

  function setBranch(id: string | null) {
    setLocal((p) => ({ ...p, branchId: !id || id === "__all" ? "" : id }));
  }

  function toggleStatus(value: string) {
    setLocal((p) => ({
      ...p,
      statuses: p.statuses.includes(value)
        ? p.statuses.filter((s) => s !== value)
        : [...p.statuses, value],
    }));
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  function apply() {
    const params = filtersToParams(local);
    startTransition(() => router.push(`?${params.toString()}`));
  }

  function reset() {
    const d7 = presetDates("7d");
    const fresh: FilterValues = {
      preset: "7d", from: d7.from, to: d7.to,
      brandId: "", branchId: "", email: "", statuses: [],
    };
    setLocal(fresh);
    startTransition(() => router.push("?"));
  }

  // ── Derived display ────────────────────────────────────────────────────────

  const hasActive =
    local.preset !== "7d" || local.brandId || local.branchId ||
    local.email || local.statuses.length > 0;

  const statusLabel =
    local.statuses.length === 0 ? "All statuses"
    : local.statuses.length === 1 ? (ALL_STATUSES.find((s) => s.value === local.statuses[0])?.label ?? local.statuses[0])
    : `${local.statuses.length} selected`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">Filters</span>
          {hasActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" title="Filters active" />
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <div className="flex flex-wrap items-end gap-3">

            {/* Date preset */}
            <Field label="Date range">
              <Select value={local.preset} onValueChange={(v) => setPreset(v as DatePreset)}>
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Custom date pickers */}
            {local.preset === "custom" && (
              <>
                <Field label="From">
                  <DateInput
                    value={local.from}
                    onChange={(v) => setLocal((p) => ({ ...p, from: v }))}
                  />
                </Field>
                <Field label="To">
                  <DateInput
                    value={local.to}
                    onChange={(v) => setLocal((p) => ({ ...p, to: v }))}
                  />
                </Field>
              </>
            )}

            {/* Brand */}
            <Field label="Brand">
              <Select value={local.brandId || "__all"} onValueChange={setBrand}>
                <SelectTrigger className="h-8 w-[160px]">
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Branch — always show, but scope to brand if one is selected */}
            <Field label="Branch">
              <Select
                value={local.branchId || "__all"}
                onValueChange={setBranch}
              >
                <SelectTrigger className="h-8 w-[160px]">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All branches</SelectItem>
                  {visibleBranches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name ?? `Branch ${b.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Email */}
            <Field label="Recipient">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={local.email}
                  onChange={(e) => setLocal((p) => ({ ...p, email: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && apply()}
                  placeholder="Search email…"
                  className="h-8 w-[190px] rounded-lg border border-input bg-transparent py-1 pr-7 pl-7 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                {local.email && (
                  <button
                    onClick={() => setLocal((p) => ({ ...p, email: "" }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </Field>

            {/* Status multi-select */}
            <Field label="Status">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "flex h-8 w-[150px] items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none",
                    "hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    local.statuses.length > 0 && "border-blue-400 dark:border-blue-600",
                  )}
                >
                  <span className="flex-1 truncate text-left">
                    {statusLabel}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[150px]">
                  {ALL_STATUSES.map((s) => (
                    <DropdownMenuCheckboxItem
                      key={s.value}
                      checked={local.statuses.includes(s.value)}
                      onCheckedChange={() => toggleStatus(s.value)}
                    >
                      {s.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>

            {/* Actions — flush right */}
            <div className="ml-auto flex items-end gap-2 pb-0">
              {hasActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  disabled={pending}
                  className="h-8 text-muted-foreground"
                >
                  Reset
                </Button>
              )}
              <Button
                size="sm"
                onClick={apply}
                disabled={pending}
                className="h-8"
              >
                {pending ? "Applying…" : "Apply filters"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    />
  );
}
