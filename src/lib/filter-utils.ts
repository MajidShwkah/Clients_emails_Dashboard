import { format, subDays } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DatePreset = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

export type FilterValues = {
  preset:   DatePreset;
  from:     string; // YYYY-MM-DD
  to:       string; // YYYY-MM-DD
  brandId:  string;
  branchId: string;
  email:    string;
  statuses: string[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

export function presetDates(preset: Exclude<DatePreset, "custom">): { from: string; to: string } {
  const today = new Date();
  switch (preset) {
    case "today":     return { from: fmt(today),             to: fmt(today) };
    case "yesterday": return { from: fmt(subDays(today, 1)), to: fmt(subDays(today, 1)) };
    case "7d":        return { from: fmt(subDays(today, 7)),  to: fmt(today) };
    case "30d":       return { from: fmt(subDays(today, 30)), to: fmt(today) };
    case "90d":       return { from: fmt(subDays(today, 90)), to: fmt(today) };
  }
}

/** Parse URL searchParams into a FilterValues object. */
export function parseFilters(sp: URLSearchParams | Record<string, string | undefined>): FilterValues {
  const get = (k: string) =>
    sp instanceof URLSearchParams ? (sp.get(k) ?? "") : (sp[k] ?? "");

  const preset  = (get("preset") as DatePreset) || "7d";
  const defaults = preset !== "custom" ? presetDates(preset) : { from: "", to: "" };

  return {
    preset,
    from:     get("from")   || defaults.from,
    to:       get("to")     || defaults.to,
    brandId:  get("brand"),
    branchId: get("branch"),
    email:    get("email"),
    statuses: get("status") ? get("status").split(",").filter(Boolean) : [],
  };
}

/** Convert FilterValues → URLSearchParams, omitting defaults. */
export function filtersToParams(f: FilterValues): URLSearchParams {
  const p = new URLSearchParams();
  if (f.preset !== "7d")   p.set("preset",  f.preset);
  if (f.from)              p.set("from",    f.from);
  if (f.to)                p.set("to",      f.to);
  if (f.brandId)           p.set("brand",   f.brandId);
  if (f.branchId)          p.set("branch",  f.branchId);
  if (f.email)             p.set("email",   f.email);
  if (f.statuses.length)   p.set("status",  f.statuses.join(","));
  return p;
}
