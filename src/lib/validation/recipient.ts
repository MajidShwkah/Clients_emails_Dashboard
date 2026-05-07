import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

const notesField = z
  .string()
  .trim()
  .max(500, "Keep notes under 500 characters")
  .nullable();

export const recipientSchema = z.object({
  id: z.string().uuid().optional(),
  brand_id: z.number().int().positive(),
  branch_id: z.number().int().positive().nullable(),
  email: emailField,
  notes: notesField,
  active: z.boolean(),
});

export type RecipientInput = z.infer<typeof recipientSchema>;

export const globalRecipientSchema = z.object({
  id: z.string().uuid().optional(),
  email: emailField,
  notes: notesField,
  active: z.boolean(),
});

export type GlobalRecipientInput = z.infer<typeof globalRecipientSchema>;

/** Normalize empty notes string from the form to null before persisting. */
export function normalizeNotes<T extends { notes: string | null }>(input: T): T {
  if (input.notes && input.notes.trim().length === 0) {
    return { ...input, notes: null };
  }
  return input;
}
