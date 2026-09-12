import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-5">
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

      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Форма створення товару ще не готова — наступний крок після Етапу 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
