"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Receipt, Headset, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/products", label: "Товари", icon: Package },
  { href: "/orders", label: "Замовлення", icon: Receipt },
  { href: "/support", label: "Підтримка", icon: Headset },
  { href: "/analytics", label: "Аналітика", icon: BarChart3 },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

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
