import { redirect } from "next/navigation";
import { Box } from "lucide-react";
import { serverFetch, ApiError } from "@/lib/api";
import { NavLinks } from "./nav-links";
import { LogoutButton } from "./logout-button";

type Me = {
  user: { id: string; email: string; name: string; role: "ADMIN" | "STAFF" };
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user: Me["user"];

  try {
    const data = await serverFetch<Me>("/api/auth/me");
    user = data.user;
  } catch (error) {
    // Прострочений/відсутній токен побачимо тільки тут — proxy.ts
    // перевіряв лише наявність куки, не її валідність.
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-5 border-r bg-background p-3">
        <div className="flex items-center gap-2 px-2 py-1">
          <Box className="size-5" strokeWidth={1.8} />
          <span className="text-base font-bold tracking-tight">StoreFront</span>
        </div>

        <NavLinks />

        <div className="mt-auto flex items-center gap-2.5 border-t px-2 pt-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}
