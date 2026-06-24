import type { ReactNode } from "react";
import { BottomNavbar } from "./BottomNavbar";

export function MainLayout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="h-dvh w-full bg-gradient-to-b from-background to-secondary/40 overflow-hidden">
      <div className="mx-auto w-full max-w-md h-full bg-background shadow-card flex flex-col relative">
        {title && (
          <header className="shrink-0 z-40 bg-background/90 backdrop-blur border-b border-border px-5 py-4">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          </header>
        )}
        <main className="flex-1 overflow-y-auto pb-6 px-5 pt-4">{children}</main>
        <BottomNavbar />
      </div>
    </div>
  );
}
