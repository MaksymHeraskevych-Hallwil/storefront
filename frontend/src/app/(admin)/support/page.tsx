import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
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

type TicketStatus = "OPEN" | "PENDING_CUSTOMER" | "CLOSED";

type Ticket = {
  id: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  customer: { id: string; email: string; name: string | null };
  _count: { messages: number };
};

type TicketListResponse = {
  data: Ticket[];
  meta: { page: number; limit: number; total: number };
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Відкрито",
  PENDING_CUSTOMER: "Очікує клієнта",
  CLOSED: "Закрито",
};

const STATUS_VARIANT: Record<TicketStatus, "default" | "secondary" | "destructive"> = {
  OPEN: "default",
  PENDING_CUSTOMER: "secondary",
  CLOSED: "destructive",
};

const dateFormatter = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long" });

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const status = params.status ?? "";

  const query = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) query.set("status", status);

  const { data: tickets, meta } = await serverFetch<TicketListResponse>(
    `/api/tickets?${query.toString()}`
  );

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const pageLink = (p: number) => {
    const q = new URLSearchParams(query);
    q.set("page", String(p));
    return `/support?${q.toString()}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Підтримка клієнтів</h1>
        <p className="text-sm text-muted-foreground">{meta.total} звернень</p>
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
              <TableHead>Тема</TableHead>
              <TableHead>Клієнт</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Повідомлень</TableHead>
              <TableHead>Створено</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Нічого не знайдено
                </TableCell>
              </TableRow>
            )}
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <Link href={`/support/${ticket.id}`} className="font-medium hover:underline">
                    {ticket.subject}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{ticket.customer.name ?? ticket.customer.email}</span>
                    <span className="text-xs text-muted-foreground">{ticket.customer.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageSquare className="size-3.5" />
                    {ticket._count.messages}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {dateFormatter.format(new Date(ticket.createdAt))}
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
