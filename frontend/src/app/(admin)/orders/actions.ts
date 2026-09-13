"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverFetch } from "@/lib/api";

export type OrderActionState = { error?: string } | undefined;

export async function updateOrderStatus(
  orderId: string,
  nextStatus: string,
  _prevState: OrderActionState,
  _formData: FormData
): Promise<OrderActionState> {
  try {
    await serverFetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return undefined;
}
