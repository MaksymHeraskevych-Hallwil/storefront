"use server";

import { revalidatePath } from "next/cache";
import { ApiError, serverFetch } from "@/lib/api";

export type SupportActionState = { error?: string } | undefined;

export async function addTicketMessage(
  ticketId: string,
  _prevState: SupportActionState,
  formData: FormData
): Promise<SupportActionState> {
  const body = String(formData.get("body") ?? "").trim();
  const close = formData.get("close") === "on";

  if (!body) {
    return { error: "Повідомлення не може бути порожнім" };
  }

  try {
    await serverFetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, close }),
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/support/${ticketId}`);
  revalidatePath("/support");
  return undefined;
}

export async function updateTicketStatus(
  ticketId: string,
  nextStatus: string,
  _prevState: SupportActionState,
  _formData: FormData
): Promise<SupportActionState> {
  try {
    await serverFetch(`/api/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/support/${ticketId}`);
  revalidatePath("/support");
  return undefined;
}
