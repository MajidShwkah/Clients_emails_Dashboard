"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  recipientSchema,
  type RecipientInput,
} from "@/lib/validation/recipient";
import { upsertRecipient } from "@/lib/recipient-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type BranchOption = { id: number; name: string };

type Props = {
  trigger: React.ReactNode;
  brandId: number;
  /** When provided, branch_id is locked to this value (or null for brand-wide). */
  lockedBranchId?: number | null;
  /** Branches the user can pick from (only used when not locked). */
  branches?: BranchOption[];
  initial?: {
    id: string;
    email: string;
    branch_id: number | null;
    notes: string | null;
    active: boolean;
  };
};

export function RecipientFormDialog({
  trigger,
  brandId,
  lockedBranchId,
  branches,
  initial,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const isEdit = !!initial;
  const isLocked = lockedBranchId !== undefined;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecipientInput>({
    resolver: zodResolver(recipientSchema),
    defaultValues: {
      id: initial?.id,
      brand_id: brandId,
      branch_id: isLocked
        ? (lockedBranchId ?? null)
        : (initial?.branch_id ?? null),
      email: initial?.email ?? "",
      notes: initial?.notes ?? null,
      active: initial?.active ?? true,
    },
  });

  const branchValue = watch("branch_id");
  const activeValue = watch("active");

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next && !isEdit) reset();
  }

  function onSubmit(values: RecipientInput) {
    const cleaned = {
      ...values,
      notes: values.notes && values.notes.trim().length > 0 ? values.notes : null,
    };
    startTransition(async () => {
      const result = await upsertRecipient(cleaned);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Recipient updated." : "Recipient added.");
      setOpen(false);
      if (!isEdit) reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit recipient" : "Add recipient"}
          </DialogTitle>
          <DialogDescription>
            {isLocked
              ? lockedBranchId === null
                ? "This recipient will be notified for every branch of this brand."
                : "This recipient will be notified only for the selected branch."
              : "Pick a branch or apply brand-wide."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} />
          <input type="hidden" {...register("brand_id")} />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              autoFocus
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          {!isLocked && branches ? (
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select
                value={branchValue === null ? "brand-wide" : String(branchValue)}
                onValueChange={(v) =>
                  setValue("branch_id", v === "brand-wide" ? null : Number(v), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose scope…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand-wide">
                    Brand-wide (all branches)
                  </SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Why this recipient?"
              {...register("notes")}
            />
            {errors.notes ? (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="active" className="text-sm">
                Active
              </Label>
              <p className="text-xs text-muted-foreground">
                Inactive recipients are kept in history but not notified.
              </p>
            </div>
            <Switch
              id="active"
              checked={activeValue}
              onCheckedChange={(v) =>
                setValue("active", v, { shouldValidate: true })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Add recipient"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
