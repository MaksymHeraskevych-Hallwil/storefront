"use client";

import { useActionState, useState, useTransition } from "react";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import { addVariant, deleteVariant } from "../actions";

type Variant = { id: string; sku: string; price: string; inventoryQty: number };


export function VariantsManager({ productId, variants }: { productId: string; variants: Variant[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const boundAdd = addVariant.bind(null, productId);
  const [state, action, pending] = useActionState(boundAdd, undefined);
  const [isDeleting, startDelete] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ще немає варіантів</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Ціна</TableHead>
              <TableHead>Залишок</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                <TableCell>{formatMoney(Number(variant.price))}</TableCell>
                <TableCell className={variant.inventoryQty === 0 ? "text-destructive" : undefined}>
                  {variant.inventoryQty} шт
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => startDelete(() => deleteVariant(productId, variant.id))}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
                    title="Видалити варіант"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {isAdding ? (
        <form
          key={variants.length}
          action={action}
          className="flex items-end gap-2 rounded-md border p-3"
        >
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">SKU</label>
            <Input name="sku" required className="h-8" />
          </div>
          <div className="flex w-28 flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Ціна</label>
            <Input name="price" type="number" step="0.01" min="0.01" required className="h-8" />
          </div>
          <div className="flex w-28 flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Залишок</label>
            <Input name="inventoryQty" type="number" step="1" min="0" defaultValue={0} className="h-8" />
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Додаємо…" : "Додати"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsAdding(false)}>
            Скасувати
          </Button>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)} className="self-start">
          <Plus className="size-4" />
          Додати варіант
        </Button>
      )}
    </div>
  );
}
