import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BarChart } from "@/components/bar-chart";
import { serverFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type TopProduct = {
  productId: string;
  title: string;
  quantitySold: number;
  revenue: number;
};

type SeriesPoint = {
  date: string;
  revenue: number;
  orders: number;
  newCustomers: number;
};

type AnalyticsSummary = {
  revenue: number;
  orderCount: number;
  newCustomers: number;
  topProducts: TopProduct[];
  days: number | null;
  series: SeriesPoint[];
};

const PERIODS: { label: string; days: number | null }[] = [
  { label: "7 днів", days: 7 },
  { label: "30 днів", days: 30 },
  { label: "90 днів", days: 90 },
  { label: "Весь час", days: null },
];

const currency = new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH" });
const dayLabel = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = params.days ? Number(params.days) : null;

  const query = days ? `?days=${days}` : "";
  const { revenue, orderCount, newCustomers, topProducts, series } = await serverFetch<AnalyticsSummary>(
    `/api/analytics/summary${query}`
  );

  const seriesPeriod = days ? `за останні ${days} днів` : "за останні 90 днів";
  const points = (pick: (p: SeriesPoint) => number) =>
    series.map((p) => ({ label: dayLabel.format(new Date(p.date)), value: pick(p) }));

  const maxQuantity = Math.max(1, ...topProducts.map((p) => p.quantitySold));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Аналітика</h1>
        <p className="text-sm text-muted-foreground">
          Виручка й продажі {days ? `за останні ${days} днів` : "за весь час"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {PERIODS.map((period) => {
          const isActive = period.days === days;
          return (
            <Link
              key={period.label}
              href={period.days ? `/analytics?days=${period.days}` : "/analytics"}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm",
                isActive
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "text-foreground/80 hover:bg-muted/60"
              )}
            >
              {period.label}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-muted-foreground">Виручка</h2>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currency.format(revenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Сума позицій оплачених і виконаних замовлень
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-muted-foreground">Замовлень</h2>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{orderCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Усі статуси за обраний період</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-muted-foreground">Нових клієнтів</h2>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{newCustomers}</p>
            <p className="mt-1 text-xs text-muted-foreground">Зареєстровані за обраний період</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Продажі по днях</h2>
          <p className="text-xs text-muted-foreground">Виручка, {seriesPeriod}</p>
        </CardHeader>
        <CardContent>
          <BarChart
            data={points((p) => p.revenue)}
            kind="currency"
            caption={`Виручка по днях, ${seriesPeriod}`}
            valueHeader="Виручка"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Замовлення по днях</h2>
            <p className="text-xs text-muted-foreground">Кількість, {seriesPeriod}</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={points((p) => p.orders)}
              kind="count"
              caption={`Замовлення по днях, ${seriesPeriod}`}
              valueHeader="Замовлень"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Нові клієнти по днях</h2>
            <p className="text-xs text-muted-foreground">Кількість, {seriesPeriod}</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={points((p) => p.newCustomers)}
              kind="count"
              caption={`Нові клієнти по днях, ${seriesPeriod}`}
              valueHeader="Клієнтів"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Топ товарів за кількістю продажів</h2>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Немає оплачених замовлень за цей період
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {topProducts.map((product) => (
                <div key={product.productId} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{product.title}</span>
                    <span className="text-muted-foreground">
                      {product.quantitySold} шт · {currency.format(product.revenue)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(product.quantitySold / maxQuantity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
