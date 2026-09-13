"use client";

import { useActionState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateProduct } from "../actions";

type Product = {
  id: string;
  title: string;
  description: string | null;
  vendor: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

export function ProductEditForm({ product }: { product: Product }) {
  const boundUpdate = updateProduct.bind(null, product.id);
  const [state, action, pending] = useActionState(boundUpdate, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Основне</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state && !state.error && (
            <Alert>
              <Check />
              <AlertDescription>Збережено</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Назва</Label>
            <Input id="title" name="title" defaultValue={product.title} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Опис</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={product.description ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Статус</h2>
          </CardHeader>
          <CardContent>
            <select
              name="status"
              defaultValue={product.status}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="DRAFT">Чернетка</option>
              <option value="ACTIVE">Активний</option>
              <option value="ARCHIVED">Архівовано</option>
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Постачальник</h2>
          </CardHeader>
          <CardContent>
            <Input name="vendor" defaultValue={product.vendor ?? ""} />
          </CardContent>
        </Card>
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Зберігаємо…" : "Зберегти"}
        </Button>
      </div>
    </form>
  );
}
