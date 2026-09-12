import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, serverFetch } from "@/lib/api";

type ProductDetail = {
  product: {
    id: string;
    title: string;
    description: string | null;
    vendor: string | null;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    variants: { id: string; sku: string; price: string; inventoryQty: number }[];
    images: { id: string; url: string }[];
    customFields: { id: string; key: string; value: string }[];
  };
};

const STATUS_LABEL: Record<ProductDetail["product"]["status"], string> = {
  DRAFT: "Чернетка",
  ACTIVE: "Активний",
  ARCHIVED: "Архівовано",
};

const currency = new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH" });

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product: ProductDetail["product"];
  try {
    const data = await serverFetch<ProductDetail>(`/api/products/${id}`);
    product = data.product;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

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
        <h1 className="text-lg font-bold">{product.title}</h1>
        <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
          {STATUS_LABEL[product.status]}
        </Badge>
      </div>

      <div className="flex items-start gap-5">
        <div className="flex flex-1 flex-col gap-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Основне</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Field label="Назва" value={product.title} />
              <Field label="Опис" value={product.description ?? "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Варіанти</h2>
            </CardHeader>
            <CardContent>
              {product.variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ще немає варіантів</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Ціна</TableHead>
                      <TableHead>Залишок</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants.map((variant) => (
                      <TableRow key={variant.id}>
                        <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                        <TableCell>{currency.format(Number(variant.price))}</TableCell>
                        <TableCell
                          className={variant.inventoryQty === 0 ? "text-destructive" : undefined}
                        >
                          {variant.inventoryQty} шт
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Кастомні поля</h2>
            </CardHeader>
            <CardContent>
              {product.customFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ще немає кастомних полів</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {product.customFields.map((field) => (
                    <div key={field.id} className="flex gap-3 text-sm">
                      <span className="w-40 shrink-0 truncate font-mono text-xs text-muted-foreground">
                        {field.key}
                      </span>
                      <span>{field.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex w-72 shrink-0 flex-col gap-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Статус</h2>
            </CardHeader>
            <CardContent>
              <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
                {STATUS_LABEL[product.status]}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Постачальник</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{product.vendor ?? "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-sm font-semibold">Зображення</h2>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Етап 7
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Завантаження зображень ще не готове</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
