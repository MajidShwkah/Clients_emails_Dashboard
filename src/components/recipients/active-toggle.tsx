"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  setRecipientActive,
  setGlobalRecipientActive,
} from "@/lib/recipient-actions";

type Props = {
  id: string;
  active: boolean;
} & ({ scope: "recipient"; brandId: number } | { scope: "global" });

export function ActiveToggle(props: Props) {
  const [optimistic, setOptimistic] = useState(props.active);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setOptimistic(next);
    startTransition(async () => {
      const result =
        props.scope === "recipient"
          ? await setRecipientActive(props.id, props.brandId, next)
          : await setGlobalRecipientActive(props.id, next);

      if (!result.ok) {
        setOptimistic(!next);
        toast.error(result.error);
        return;
      }
      toast.success(next ? "Activated." : "Deactivated.");
    });
  }

  return (
    <Switch
      checked={optimistic}
      onCheckedChange={handleChange}
      disabled={pending}
      aria-label={optimistic ? "Deactivate recipient" : "Activate recipient"}
    />
  );
}
