import Link from "next/link";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { serverFetch } from "@/lib/api";

type Product = {
  id: string;
  title: string;
  vendor: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  createdAt: string;
  _count: { variants: number };
  images: { url: string }[];
};

type ProductListResponse = {
  data: Product[];
  meta: { page: number; limit: number; total: number };
};

const STATUS_LABEL: Record<Product["status"], string> = {
  DRAFT: "Чернетка",
  ACTIVE: "Активний",
  ARCHIVED: "Архівовано",
};

const dateFormatter = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long" });

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const search = params.search ?? "";
  const status = params.status ?? "";

  const query = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) query.set("search", search);
  if (status) query.set("status", status);

  const { data: products, meta } = await serverFetch<ProductListResponse>(
    `/api/products?${query.toString()}`
  );

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const pageLink = (p: number) => {
    const q = new URLSearchParams(query);
    q.set("page", String(p));
    return `/products?${q.toString()}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Товари</h1>
          <p className="text-sm text-muted-foreground">{meta.total} товарів</p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/products/new">
              <Plus className="size-4" />
              Додати товар
            </Link>
          }
        />
      </div>

      <form method="GET" className="flex items-center gap-2.5 rounded-lg border bg-card p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={search}
            placeholder="Пошук за назвою"
            className="pl-9"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Усі статуси</option>
          <option value="DRAFT">Чернетка</option>
          <option value="ACTIVE">Активний</option>
          <option value="ARCHIVED">Архівовано</option>
        </select>
        <Button type="submit" variant="outline">
          Застосувати
        </Button>
      </form>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Варіанти</TableHead>
              <TableHead>Створено</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Нічого не знайдено
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Link href={`/products/${product.id}`} className="flex items-center gap-3 hover:underline">
                    <span className="size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                      {product.images[0] && (
                        // Звичайний <img>: URL веде у зовнішнє сховище (див. images-manager.tsx).
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0].url} alt="" className="size-full object-cover" />
                      )}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium">{product.title}</span>
                      {product.vendor && (
                        <span className="text-xs text-muted-foreground">{product.vendor}</span>
                      )}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
                    {STATUS_LABEL[product.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{product._count.variants}</TableCell>
                <TableCell className="text-muted-foreground">
                  {dateFormatter.format(new Date(product.createdAt))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Сторінка {meta.page} з {totalPages}
        </span>
        <div className="flex gap-2">
          <PaginationLink href={pageLink(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="size-4" />
            Попередня
          </PaginationLink>
          <PaginationLink href={pageLink(page + 1)} disabled={page >= totalPages}>
            Наступна
            <ChevronRight className="size-4" />
          </PaginationLink>
        </div>
      </div>
    </div>
  );
}

// <a> не має нативного "disabled" — рендеримо або справжнє посилання,
// або статичний елемент того ж вигляду замість нього.
function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const className = cn(buttonVariants({ variant: "outline", size: "sm" }));

  if (disabled) {
    return (
      <span aria-disabled className={cn(className, "pointer-events-none opacity-50")}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
