"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addTicketMessage } from "../actions";

// Ключ (messages.length батьківського Server Component) примушує форму
// перемонтуватись після успішної відповіді — інакше textarea лишила б
// стару чернетку, бо revalidatePath не скидає стан клієнтського інпуту.
export function ReplyForm({ ticketId }: { ticketId: string }) {
  const bound = addTicketMessage.bind(null, ticketId);
  const [state, action, pending] = useActionState(bound, undefined);

  return (
    <form action={action} className="flex flex-col gap-2.5">
      <Textarea
        name="body"
        placeholder="Напишіть відповідь клієнту…"
        rows={4}
        required
        maxLength={5000}
      />
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input type="checkbox" name="close" className="size-4" />
          Закрити тікет цією відповіддю
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Надсилаємо…" : "Надіслати"}
        </Button>
      </div>
    </form>
  );
}
