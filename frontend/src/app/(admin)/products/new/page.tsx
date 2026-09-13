"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createProduct } from "../actions";

export default function NewProductPage() {
  const [state, action, pending] = useActionState(createProduct, undefined);

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/products"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Товари
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-lg font-bold">Новий товар</h1>
      </div>

      <form action={action}>
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Назва</Label>
              <Input id="title" name="title" required autoFocus />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Опис</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vendor">Постачальник</Label>
              <Input id="vendor" name="vendor" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Статус</Label>
              <select
                id="status"
                name="status"
                defaultValue="DRAFT"
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="DRAFT">Чернетка</option>
                <option value="ACTIVE">Активний</option>
              </select>
            </div>

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Створюємо…" : "Створити товар"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                nativeButton={false}
                render={<Link href="/products">Скасувати</Link>}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
