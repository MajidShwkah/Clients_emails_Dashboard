"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  recipientSchema,
  globalRecipientSchema,
  type RecipientInput,
  type GlobalRecipientInput,
} from "@/lib/validation/recipient";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

function friendlyDbError(message: string): string {
  if (message.includes("duplicate key") || message.includes("23505")) {
    return "This email is already configured for that scope.";
  }
  if (message.includes("permission denied") || message.includes("42501")) {
    return "You don't have permission for that action.";
  }
  return "Something went wrong. Please try again.";
}

export async function upsertRecipient(
  raw: RecipientInput,
): Promise<ActionResult> {
  const parsed = recipientSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: String(first.path[0]) };
  }
  const v = parsed.data;
  const supabase = await createClient();

  const payload = {
    brand_id: v.brand_id,
    branch_id: v.branch_id,
    email: v.email,
    notes: v.notes,
    active: v.active,
  };

  const result = v.id
    ? await supabase
        .schema("sync")
        .from("email_recipients")
        .update(payload)
        .eq("id", v.id)
    : await supabase.schema("sync").from("email_recipients").insert(payload);

  if (result.error) {
    return { ok: false, error: friendlyDbError(result.error.message) };
  }

  revalidatePath(`/brands/${v.brand_id}`);
  revalidatePath("/brands");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setRecipientActive(
  id: string,
  brand_id: number,
  active: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("sync")
    .from("email_recipients")
    .update({ active })
    .eq("id", id);

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  revalidatePath(`/brands/${brand_id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function upsertGlobalRecipient(
  raw: GlobalRecipientInput,
): Promise<ActionResult> {
  const parsed = globalRecipientSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: String(first.path[0]) };
  }
  const v = parsed.data;
  const supabase = await createClient();

  const payload = {
    email: v.email,
    notes: v.notes,
    active: v.active,
  };

  const result = v.id
    ? await supabase
        .schema("sync")
        .from("global_recipients")
        .update(payload)
        .eq("id", v.id)
    : await supabase.schema("sync").from("global_recipients").insert(payload);

  if (result.error) {
    return { ok: false, error: friendlyDbError(result.error.message) };
  }

  revalidatePath("/globals");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setGlobalRecipientActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("sync")
    .from("global_recipients")
    .update({ active })
    .eq("id", id);

  if (error) {
    return { ok: false, error: friendlyDbError(error.message) };
  }

  revalidatePath("/globals");
  revalidatePath("/dashboard");
  return { ok: true };
}
