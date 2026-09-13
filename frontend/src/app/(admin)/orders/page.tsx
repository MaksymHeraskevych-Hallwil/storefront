import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { serverFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";

type Order = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  createdAt: string;
  total: number;
  customer: { id: string; email: string; name: string | null };
};

type OrderListResponse = {
  data: Order[];
  meta: { page: number; limit: number; total: number };
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Очікує оплати",
  PAID: "Оплачено",
  FULFILLED: "Виконано",
  CANCELLED: "Скасовано",
  REFUNDED: "Повернено",
};

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  FULFILLED: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

const currency = new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH" });
const dateFormatter = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long" });

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const status = params.status ?? "";

  const query = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) query.set("status", status);

  const { data: orders, meta } = await serverFetch<OrderListResponse>(
    `/api/orders?${query.toString()}`
  );

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const pageLink = (p: number) => {
    const q = new URLSearchParams(query);
    q.set("page", String(p));
    return `/orders?${q.toString()}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Замовлення</h1>
        <p className="text-sm text-muted-foreground">{meta.total} замовлень</p>
      </div>

      <form method="GET" className="flex items-center gap-2.5 rounded-lg border bg-card p-3">
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Усі статуси</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Застосувати
        </Button>
      </form>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Замовлення</TableHead>
              <TableHead>Клієнт</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Сума</TableHead>
              <TableHead>Створено</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Нічого не знайдено
                </TableCell>
              </TableRow>
            )}
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                    #{order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{order.customer.name ?? order.customer.email}</span>
                    <span className="text-xs text-muted-foreground">{order.customer.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                </TableCell>
                <TableCell>{currency.format(order.total)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {dateFormatter.format(new Date(order.createdAt))}
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
