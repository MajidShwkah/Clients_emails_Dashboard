import type { Database } from "@/lib/supabase/types";

export type Brand = Database["public"]["Tables"]["brands"]["Row"];
export type Branch = Database["public"]["Tables"]["branches"]["Row"];

export type EmailRecipient = Database["sync"]["Tables"]["email_recipients"]["Row"];
export type EmailRecipientInsert = Database["sync"]["Tables"]["email_recipients"]["Insert"];
export type EmailRecipientUpdate = Database["sync"]["Tables"]["email_recipients"]["Update"];

export type GlobalRecipient = Database["sync"]["Tables"]["global_recipients"]["Row"];
export type GlobalRecipientInsert = Database["sync"]["Tables"]["global_recipients"]["Insert"];
export type GlobalRecipientUpdate = Database["sync"]["Tables"]["global_recipients"]["Update"];

export type EmailSend = Database["sync"]["Tables"]["email_sends"]["Row"];
export type EmailEvent = Database["sync"]["Tables"]["email_events"]["Row"];
export type EmailAuditLog = Database["sync"]["Tables"]["email_audit_log"]["Row"];

export type ExpectedRecipient = Database["sync"]["Views"]["v_expected_recipients"]["Row"];
export type MissingDelivery = Database["sync"]["Views"]["v_missing_deliveries"]["Row"];

export type RecipientSource = "default" | "brand_extra" | "branch_extra" | "global";

export type SendStatus =
  | "queued"
  | "processed"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "dropped"
  | "deferred"
  | "spam"
  | "failed"
  | "unsubscribed";

export type BranchWithBrandId = Omit<Branch, "brand"> & { brandId: number };

export function mapBranch(branch: Branch): BranchWithBrandId {
  const { brand, ...rest } = branch;
  return { ...rest, brandId: brand };
}
