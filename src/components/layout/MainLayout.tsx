import type { ReactNode } from "react";
import { BottomNavbar } from "./BottomNavbar";

export function MainLayout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/40">
      <div className="mx-auto w-full max-w-md min-h-screen bg-background shadow-card relative">
        {title && (
          <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border px-5 py-4">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          </header>
        )}
        <main className="pb-28 px-5 pt-4">{children}</main>
        <BottomNavbar />
      </div>
    </div>
  );
}
