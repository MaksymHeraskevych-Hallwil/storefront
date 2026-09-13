"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, serverFetch } from "@/lib/api";

export type ActionState = { error?: string } | undefined;

// Порожні поля з форми ("") не мають перетворюватись на порожній рядок
// у базі — краще взагалі не передавати їх, як і очікує zod-схема
// на бекенді (optional, а не nullable).
function cleanBody(entries: Record<string, FormDataEntryValue | null>) {
  const body: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value === "string" && value.trim() !== "") {
      body[key] = value;
    }
  }
  return body;
}

export async function createProduct(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const body = cleanBody({
    title: formData.get("title"),
    description: formData.get("description"),
    vendor: formData.get("vendor"),
    status: formData.get("status"),
  });

  let productId: string;
  try {
    const data = await serverFetch<{ product: { id: string } }>("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    productId = data.product.id;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }

  revalidatePath("/products");
  redirect(`/products/${productId}`);
}

export async function updateProduct(
  productId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const body = cleanBody({
    title: formData.get("title"),
    description: formData.get("description"),
    vendor: formData.get("vendor"),
    status: formData.get("status"),
  });

  try {
    await serverFetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
  return { error: undefined };
}

export async function addVariant(
  productId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const body = cleanBody({
    sku: formData.get("sku"),
    price: formData.get("price"),
    inventoryQty: formData.get("inventoryQty"),
  });

  try {
    await serverFetch(`/api/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/products/${productId}`);
  return undefined;
}

export async function deleteVariant(productId: string, variantId: string) {
  await serverFetch(`/api/products/${productId}/variants/${variantId}`, { method: "DELETE" });
  revalidatePath(`/products/${productId}`);
}

export async function addCustomField(
  productId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const body = cleanBody({
    key: formData.get("key"),
    value: formData.get("value"),
  });

  try {
    await serverFetch(`/api/products/${productId}/custom-fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }

  revalidatePath(`/products/${productId}`);
  return undefined;
}

export async function deleteCustomField(productId: string, fieldId: string) {
  await serverFetch(`/api/products/${productId}/custom-fields/${fieldId}`, { method: "DELETE" });
  revalidatePath(`/products/${productId}`);
}
