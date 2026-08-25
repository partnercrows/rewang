import { ArrowRight, FolderLock } from "lucide-react";
import { getWaAccessUrl } from "@/lib/whatsapp";

export function ClosingCTA() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-14 lg:py-16">
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(160deg, #52b788 0%, #40916c 45%, #2d6a4f 100%)" }}
      />
      <div
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <img
          src="/rewang.png"
          alt="Logo Rewang"
          width={56}
          height={56}
          draggable={false}
          className="mx-auto mb-4 h-14 w-14 rounded-2xl object-cover shadow-lg ring-1 ring-white/25"
        />

        <h2 className="font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
          Rumah lebih teratur, hidup lebih ringan.
        </h2>

        <div className="mt-6 flex flex-col items-center gap-2.5">
          <a
            href={getWaAccessUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-base font-semibold text-[#2d6a4f] shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            Dapatkan Akses Awal
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
          <p className="text-sm font-medium text-white/80">Gratis untuk pengguna awal</p>
        </div>

        <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-white/70">
          <FolderLock className="h-3.5 w-3.5" />
          Data tersimpan di Google Drive pribadi Anda &middot; Segera hadir di Google Play Store
        </p>
      </div>
    </section>
  );
}
