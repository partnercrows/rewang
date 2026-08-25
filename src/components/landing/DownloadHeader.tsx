import { getWaAccessUrl } from "@/lib/whatsapp";

export function DownloadHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e8ede6] bg-[#fef9ef]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-bold text-[#2d4a22]"
        >
          <img
            src="/rewang.png"
            alt="Logo Rewang"
            width={32}
            height={32}
            draggable={false}
            className="h-8 w-8 rounded-lg object-cover ring-1 ring-[#e8ede6]"
          />
          Rewang
        </a>
        <a
          href={getWaAccessUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-gradient-to-r from-[#52b788] to-[#40916c] px-4 py-2 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          Dapatkan Akses Awal
        </a>
      </div>
    </header>
  );
}
