"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      title="Вийти"
      className="ml-auto shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <LogOut className="size-4" strokeWidth={1.8} />
    </button>
  );
}
