import { ArrowRight } from "lucide-react";
import { getWaAccessUrl } from "@/lib/whatsapp";

export function ClosingCTA() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(160deg, #52b788 0%, #40916c 45%, #2d6a4f 100%)" }}
      />
      <div
        className="absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Rumah lebih teratur, hidup lebih ringan.
        </h2>
        <p className="mt-4 text-lg text-white/85">
          Mulai kelola kebutuhan rumah tangga dengan Rewang.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3">
          <a
            href={getWaAccessUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#2d6a4f] shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            Dapatkan Akses Awal
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
          <p className="text-sm font-medium text-white/80">Gratis untuk pengguna awal</p>
        </div>

        <p className="mt-8 text-xs text-white/60">Segera hadir juga di Google Play Store</p>
      </div>
    </section>
  );
}
