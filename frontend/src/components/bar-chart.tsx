"use client";

import { useState } from "react";

export type BarPoint = { label: string; value: number };

// Сторінка (Server Component) не може передати в клієнтський компонент
// функцію-форматер, тому передає лише серіалізований "kind".
type Props = {
  data: BarPoint[];
  kind: "currency" | "count";
  caption: string;
  valueHeader: string;
};

// Навмисно без Intl: Node у контейнері й браузер по-різному форматують UAH
// ("грн" проти "₴", "1 тис." проти "1,0 тис."), і це ламало гідратацію.
function formatNumber(n: number) {
  const [int, frac] = n.toFixed(2).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "").split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return frac ? `${grouped},${frac}` : grouped;
}

function formatCurrency(v: number) {
  if (v >= 1000) return `${formatNumber(Math.round(v / 100) / 10)} тис. ₴`;
  return `${formatNumber(v)} ₴`;
}

function niceMax(max: number, integer: boolean) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  const result = nice * pow;
  if (!integer) return result;
  // Середня позначка осі теж має бути цілою — тож верх > 4 робимо парним.
  const whole = Math.max(1, Math.ceil(result));
  return whole > 4 && whole % 2 === 1 ? whole + 1 : whole;
}

export function BarChart({ data, kind, caption, valueHeader }: Props) {
  // Підписи осі Y для кількостей мають бути цілими — 0,5 замовлення не буває.
  const integer = kind === "count";
  const format = (v: number) =>
    v === 0 ? "0" : kind === "count" ? formatNumber(v) : formatCurrency(v);
  // Осі — компактно, підказка й таблиця — точне значення.
  const formatExact = (v: number) => (kind === "count" ? formatNumber(v) : `${formatNumber(v)} ₴`);
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(0, ...data.map((p) => p.value));
  if (max === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Немає даних за цей період
      </p>
    );
  }

  const top = niceMax(max, integer);
  const ticks = integer && top <= 4 ? Array.from({ length: top + 1 }, (_, i) => i) : [0, top / 2, top];
  const labelEvery = Math.ceil(data.length / 4);
  const hoveredPoint = hovered === null ? null : data[hovered];
  const hoveredPct = hovered === null ? 0 : ((hovered + 0.5) / data.length) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 pt-3">
        <div className="relative h-40 w-14 shrink-0 text-right text-xs text-muted-foreground">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ bottom: `${(tick / top) * 100}%` }}
            >
              {format(tick)}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          <div className="relative h-40" role="img" aria-label={caption}>
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 border-t border-border"
                style={{ bottom: `${(tick / top) * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 flex" onMouseLeave={() => setHovered(null)}>
              {data.map((point, i) => (
                <div
                  key={point.label}
                  className="flex h-full flex-1 items-end justify-center"
                  onMouseEnter={() => setHovered(i)}
                >
                  {point.value > 0 && (
                    <div
                      className="w-full max-w-6 rounded-t-[4px] bg-primary"
                      style={{
                        height: `${(point.value / top) * 100}%`,
                        minHeight: 2,
                        opacity: hovered === null || hovered === i ? 1 : 0.55,
                        marginInline: 1,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {hoveredPoint && (
              <div
                className="pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
                style={{
                  left: `${hoveredPct}%`,
                  transform: `translateX(${hoveredPct < 15 ? "0" : hoveredPct > 85 ? "-100%" : "-50%"})`,
                }}
              >
                <div className="text-muted-foreground">{hoveredPoint.label}</div>
                <div className="font-semibold">{formatExact(hoveredPoint.value)}</div>
              </div>
            )}
          </div>

          <div className="relative mt-1.5 flex h-4 text-xs text-muted-foreground">
            {data.map((point, i) => (
              <div key={point.label} className="relative flex-1">
                {i % labelEvery === 0 && (
                  <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    {point.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">Показати як таблицю</summary>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border">
          <table className="w-full text-left">
            <caption className="sr-only">{caption}</caption>
            <thead className="sticky top-0 bg-card">
              <tr>
                <th className="px-3 py-1.5 font-medium">День</th>
                <th className="px-3 py-1.5 font-medium">{valueHeader}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.label} className="border-t">
                  <td className="px-3 py-1">{point.label}</td>
                  <td className="px-3 py-1 text-foreground">{formatExact(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
