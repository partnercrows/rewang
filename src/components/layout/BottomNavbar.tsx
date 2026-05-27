import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ShoppingBasket, Wallet, Activity, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs: Array<{ to: string; label: string; icon: typeof Home; exact?: boolean }> = [
  { to: "/app", label: "Beranda", icon: Home, exact: true },
  { to: "/app/belanja", label: "Belanja", icon: ShoppingBasket },
  { to: "/app/keuangan", label: "Keuangan", icon: Wallet },
  { to: "/app/feed", label: "Feed", icon: Activity },
  { to: "/app/akun", label: "Akun", icon: User },
];

export function BottomNavbar() {
  const { location } = useRouterState();
  const path = location.pathname;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto px-3 pb-3 pt-2 bg-card/95 backdrop-blur border-t border-border shadow-card">
        <ul className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = t.exact ? path === t.to : path.startsWith(t.to);
            const Icon = t.icon;
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                  <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
                    {t.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
