import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, serverFetch } from "@/lib/api";
import { OrderStatusActions } from "./status-actions";

type OrderStatus = "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";

type OrderDetail = {
  order: {
    id: string;
    orderNumber: number;
    status: OrderStatus;
    createdAt: string;
    total: number;
    allowedTransitions: OrderStatus[];
    customer: { id: string; email: string; name: string | null; phone: string | null };
    items: {
      id: string;
      quantity: number;
      price: string;
      variant: { id: string; sku: string; product: { title: string } };
    }[];
  };
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
const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let order: OrderDetail["order"];
  try {
    const data = await serverFetch<OrderDetail>(`/api/orders/${id}`);
    order = data.order;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/orders"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Замовлення
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-lg font-bold">#{order.orderNumber}</h1>
        <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
        <span className="text-xs text-muted-foreground">
          {dateFormatter.format(new Date(order.createdAt))}
        </span>
      </div>

      <div className="flex items-start gap-5">
        <div className="flex flex-1 flex-col gap-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Позиції</h2>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>К-сть</TableHead>
                    <TableHead>Ціна</TableHead>
                    <TableHead>Сума</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.variant.product.title}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.variant.sku}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{currency.format(Number(item.price))}</TableCell>
                      <TableCell>{currency.format(Number(item.price) * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      Разом
                    </TableCell>
                    <TableCell className="font-semibold">{currency.format(order.total)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="flex w-80 shrink-0 flex-col gap-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Статус</h2>
            </CardHeader>
            <CardContent>
              <OrderStatusActions orderId={order.id} allowedTransitions={order.allowedTransitions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Клієнт</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{order.customer.name ?? "—"}</span>
              <span className="text-muted-foreground">{order.customer.email}</span>
              {order.customer.phone && (
                <span className="text-muted-foreground">{order.customer.phone}</span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
