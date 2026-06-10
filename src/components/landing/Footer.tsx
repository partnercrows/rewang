import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-[#fef9ef] border-t border-[#e8ede6]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-[#9db5a6] flex items-center gap-1.5">
            &copy; 2026 Rewang. Dibuat dengan
            <Heart className="h-3.5 w-3.5 text-[#e07070] fill-current" />
            untuk keluarga Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
