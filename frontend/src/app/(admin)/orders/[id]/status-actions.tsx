"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateOrderStatus } from "../actions";

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Очікує оплати",
  PAID: "Оплачено",
  FULFILLED: "Виконано",
  CANCELLED: "Скасовано",
  REFUNDED: "Повернено",
};

// Ознака дії, а не просто нового стану — той самий напис на кнопці,
// що адмін реально "робить", а не куди переходить статус.
const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  PAID: "Позначити оплаченим",
  FULFILLED: "Позначити виконаним",
  CANCELLED: "Скасувати замовлення",
  REFUNDED: "Оформити повернення",
};

function TransitionButton({
  orderId,
  targetStatus,
}: {
  orderId: string;
  targetStatus: OrderStatus;
}) {
  const bound = updateOrderStatus.bind(null, orderId, targetStatus);
  const [state, action, pending] = useActionState(bound, undefined);
  const isDestructive = targetStatus === "CANCELLED" || targetStatus === "REFUNDED";

  return (
    <form action={action} className="contents">
      <Button type="submit" variant={isDestructive ? "outline" : "default"} disabled={pending}>
        {pending ? "Оновлюємо…" : ACTION_LABEL[targetStatus]}
      </Button>
      {state?.error && (
        <Alert variant="destructive" className="basis-full">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}

export function OrderStatusActions({
  orderId,
  allowedTransitions,
}: {
  orderId: string;
  allowedTransitions: OrderStatus[];
}) {
  if (allowedTransitions.length === 0) {
    return <p className="text-sm text-muted-foreground">Це кінцевий статус — далі йти нікуди.</p>;
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      {allowedTransitions.map((status) => (
        <TransitionButton key={status} orderId={orderId} targetStatus={status} />
      ))}
      <p className="w-full text-xs text-muted-foreground">
        Дозволені переходи: {allowedTransitions.map((s) => STATUS_LABEL[s]).join(", ")}
      </p>
    </div>
  );
}
