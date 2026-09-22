import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ApiError, serverFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ReplyForm } from "./reply-form";
import { StatusForm } from "./status-form";

type TicketStatus = "OPEN" | "PENDING_CUSTOMER" | "CLOSED";
type AuthorType = "CUSTOMER" | "STAFF";

type TicketDetail = {
  ticket: {
    id: string;
    subject: string;
    status: TicketStatus;
    createdAt: string;
    customer: { id: string; email: string; name: string | null; phone: string | null };
    messages: { id: string; authorType: AuthorType; body: string; createdAt: string }[];
  };
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

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let ticket: TicketDetail["ticket"];
  try {
    const data = await serverFetch<TicketDetail>(`/api/tickets/${id}`);
    ticket = data.ticket;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/support"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Підтримка
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-lg font-bold">{ticket.subject}</h1>
        <Badge variant={STATUS_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
        <span className="text-xs text-muted-foreground">
          {dateFormatter.format(new Date(ticket.createdAt))}
        </span>
      </div>

      <div className="flex items-start gap-5">
        <div className="flex flex-1 flex-col gap-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Листування</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border p-3 text-sm",
                    message.authorType === "STAFF"
                      ? "ml-8 border-primary/20 bg-primary/5"
                      : "mr-8 bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {message.authorType === "STAFF" ? "Персонал" : ticket.customer.name ?? "Клієнт"}
                    </span>
                    <span>{dateFormatter.format(new Date(message.createdAt))}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Відповісти</h2>
            </CardHeader>
            <CardContent>
              <ReplyForm key={ticket.messages.length} ticketId={ticket.id} />
            </CardContent>
          </Card>
        </div>

        <div className="flex w-80 shrink-0 flex-col gap-5">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Статус</h2>
            </CardHeader>
            <CardContent>
              <StatusForm key={ticket.status} ticketId={ticket.id} currentStatus={ticket.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold">Клієнт</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{ticket.customer.name ?? "—"}</span>
              <span className="text-muted-foreground">{ticket.customer.email}</span>
              {ticket.customer.phone && (
                <span className="text-muted-foreground">{ticket.customer.phone}</span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
