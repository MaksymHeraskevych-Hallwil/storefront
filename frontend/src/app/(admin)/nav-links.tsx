"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Receipt, Headset, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/products", label: "Товари", icon: Package, ready: true },
  { href: "/orders", label: "Замовлення", icon: Receipt, ready: true },
  { href: "/support", label: "Підтримка", icon: Headset, ready: false, stage: "Етап 5" },
  { href: "/analytics", label: "Аналітика", icon: BarChart3, ready: false, stage: "Етап 6" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive = item.ready && pathname.startsWith(item.href);
        const Icon = item.icon;

        if (!item.ready) {
          return (
            <div
              key={item.href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground"
            >
              <Icon className="size-4.5" strokeWidth={1.8} />
              <span className="flex-1">{item.label}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.stage}
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm",
              isActive ? "bg-muted font-semibold text-foreground" : "text-foreground/80 hover:bg-muted/60"
            )}
          >
            <Icon className="size-4.5" strokeWidth={1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
