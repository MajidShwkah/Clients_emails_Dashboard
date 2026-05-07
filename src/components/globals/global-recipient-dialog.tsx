"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  globalRecipientSchema,
  type GlobalRecipientInput,
} from "@/lib/validation/recipient";
import { upsertGlobalRecipient } from "@/lib/recipient-actions";
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

type Props = {
  trigger: React.ReactNode;
  initial?: {
    id: string;
    email: string;
    notes: string | null;
    active: boolean;
  };
};

export function GlobalRecipientDialog({ trigger, initial }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GlobalRecipientInput>({
    resolver: zodResolver(globalRecipientSchema),
    defaultValues: {
      id: initial?.id,
      email: initial?.email ?? "",
      notes: initial?.notes ?? null,
      active: initial?.active ?? true,
    },
  });

  const activeValue = watch("active");

  function onSubmit(values: GlobalRecipientInput) {
    const cleaned = {
      ...values,
      notes: values.notes && values.notes.trim().length > 0 ? values.notes : null,
    };
    startTransition(async () => {
      const result = await upsertGlobalRecipient(cleaned);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Global recipient updated." : "Global recipient added.");
      setOpen(false);
      if (!isEdit) reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v && !isEdit) reset();
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit global recipient" : "Add global recipient"}
          </DialogTitle>
          <DialogDescription>
            Notified for every email RIME sends, regardless of brand or branch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} />

          <div className="space-y-2">
            <Label htmlFor="g-email">Email</Label>
            <Input
              id="g-email"
              type="email"
              placeholder="name@getrime.com"
              autoFocus
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="g-notes">Notes (optional)</Label>
            <Textarea
              id="g-notes"
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
              <Label htmlFor="g-active" className="text-sm">
                Active
              </Label>
              <p className="text-xs text-muted-foreground">
                Inactive recipients are kept but not notified.
              </p>
            </div>
            <Switch
              id="g-active"
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
