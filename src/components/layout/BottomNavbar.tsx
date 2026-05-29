import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ShoppingBasket, Wallet, Activity, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";

const tabs: Array<{ to: string; labelKey: string; icon: typeof Home; exact?: boolean }> = [
  { to: "/app", labelKey: "Beranda", icon: Home, exact: true },
  { to: "/app/belanja", labelKey: "Belanja", icon: ShoppingBasket },
  { to: "/app/keuangan", labelKey: "Keuangan", icon: Wallet },
  { to: "/app/feed", labelKey: "Feed", icon: Activity },
  { to: "/app/akun", labelKey: "Akun", icon: User },
];

export function BottomNavbar() {
  const { location } = useRouterState();
  const { T } = useLang();
  const path = location.pathname;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto px-2 pb-3 pt-2 bg-card/95 backdrop-blur border-t border-border shadow-card">
        <ul className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = t.exact ? path === t.to : path.startsWith(t.to);
            const Icon = t.icon;
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all",
                    active
                      ? "text-primary font-bold scale-105"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "relative transition-all duration-200",
                      active && "-mt-1",
                    )}
                  >
                    {active && (
                      <div className="absolute -inset-1 rounded-full bg-primary/15" />
                    )}
                    <Icon
                      className={cn(
                        "h-5 w-5 relative transition-all",
                        active && "stroke-[2.75] scale-110",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] transition-all",
                      active && "font-extrabold text-[11px]",
                    )}
                  >
                    {T(t.labelKey)}
                  </span>
                  {active && (
                    <div className="h-1 w-6 rounded-full bg-primary mt-0.5" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
