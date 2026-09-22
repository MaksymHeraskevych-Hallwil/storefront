"use client";

import { useActionState, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateTicketStatus } from "../actions";

type TicketStatus = "OPEN" | "PENDING_CUSTOMER" | "CLOSED";

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Відкрито",
  PENDING_CUSTOMER: "Очікує клієнта",
  CLOSED: "Закрито",
};

export function StatusForm({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: TicketStatus;
}) {
  const [selected, setSelected] = useState<TicketStatus>(currentStatus);
  const bound = updateTicketStatus.bind(null, ticketId, selected);
  const [state, action, pending] = useActionState(bound, undefined);

  return (
    <form action={action} className="flex flex-col gap-2.5">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as TicketStatus)}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" variant="outline" disabled={pending || selected === currentStatus}>
        {pending ? "Оновлюємо…" : "Змінити статус"}
      </Button>
    </form>
  );
}
