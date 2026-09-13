import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ApiError, serverFetch } from "@/lib/api";
import { ProductEditForm } from "./product-edit-form";
import { VariantsManager } from "./variants-manager";
import { CustomFieldsManager } from "./custom-fields-manager";

type ProductDetail = {
  product: {
    id: string;
    title: string;
    description: string | null;
    vendor: string | null;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    updatedAt: string;
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
          {/* key: без нього форма з defaultValue-полями не перемалює
              значення після успішного збереження — React лишає старий
              інстанс, defaultValue застосовується лише при монтуванні. */}
          <ProductEditForm key={product.updatedAt} product={product} />

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Варіанти</h2>
            </CardHeader>
            <CardContent>
              <VariantsManager productId={product.id} variants={product.variants} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Кастомні поля</h2>
            </CardHeader>
            <CardContent>
              <CustomFieldsManager productId={product.id} fields={product.customFields} />
            </CardContent>
          </Card>
        </div>

        <div className="flex w-72 shrink-0 flex-col gap-5">
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
