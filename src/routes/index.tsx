import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/landing/Footer";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Rewang Mobile - Atur Rumah Tangga Lebih Mudah" }] }),
  component: DownloadPage,
});

const WHATSAPP_LINK =
  "https://wa.me/6281294097650?text=" +
  encodeURIComponent("Halo, saya mau tanya soal aplikasi Rewang Mobile.");

function DownloadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fef9ef] font-body">
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center">
        <img
          src="/logo-splash.png"
          alt="Rewang - Atur rumah tangga lebih mudah"
          className="w-full max-w-xs sm:max-w-sm mb-8"
        />

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#2d4a22] max-w-lg">
          Rewang kini hadir sebagai aplikasi mobile
        </h1>
        <p className="mt-3 text-[#6b7d6a] max-w-md leading-relaxed">
          Stok belanja, tagihan, hutang-piutang, dan tugas rumah tangga - langsung dari HP Anda,
          tersinkron aman ke Google Drive pribadi.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#7d9b76] to-[#52b788] px-6 py-3 text-white font-semibold shadow-soft transition-transform hover:scale-105"
          >
            <MessageCircle className="h-5 w-5" />
            Hubungi via WhatsApp untuk Akses Awal
          </a>
          <p className="text-sm text-[#9db5a6]">Segera hadir di Google Play Store</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
