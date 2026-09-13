"use client";

import { useActionState, useState, useTransition } from "react";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addCustomField, deleteCustomField } from "../actions";

type CustomField = { id: string; key: string; value: string };

export function CustomFieldsManager({
  productId,
  fields,
}: {
  productId: string;
  fields: CustomField[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const boundAdd = addCustomField.bind(null, productId);
  const [state, action, pending] = useActionState(boundAdd, undefined);
  const [isDeleting, startDelete] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ще немає кастомних полів</p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate font-mono text-xs text-muted-foreground">
                {field.key}
              </span>
              <span className="flex-1">{field.value}</span>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => startDelete(() => deleteCustomField(productId, field.id))}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
                title="Видалити поле"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {isAdding ? (
        <form key={fields.length} action={action} className="flex items-end gap-2 rounded-md border p-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Ключ (напр. warranty_months)
            </label>
            <Input name="key" required className="h-8 font-mono text-xs" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Значення</label>
            <Input name="value" required className="h-8" />
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
          Додати поле
        </Button>
      )}
    </div>
  );
}
