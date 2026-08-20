import { ArrowRight, Lock, ShieldCheck, FolderLock } from "lucide-react";
import { getWaAccessUrl } from "@/lib/whatsapp";
import { PhoneMockup } from "./PhoneMockup";

export function DownloadHero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24">
      <div className="absolute inset-0 bg-[#fef9ef]" />
      <div
        className="absolute -top-24 -right-32 h-96 w-96 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, #d9ead9 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/2 -left-32 h-80 w-80 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, #fce4b8 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <h1 className="font-heading text-[2.15rem] leading-[1.12] font-extrabold tracking-tight text-[#2d4a22] sm:text-5xl lg:text-[3.4rem]">
              Biar Urusan Rumah,
              <span className="block text-[#40916c]">Nggak Jadi Beban Pikiran.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-[#5a6b58] lg:mx-0">
              Rewang membantu Anda mengatur belanja, tagihan, utang-piutang, dan tugas rumah dalam
              satu tempat.
            </p>

            <div className="mt-8 flex flex-col items-center gap-2.5 lg:items-start">
              <a
                href={getWaAccessUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#52b788] to-[#2d6a4f] px-8 py-4 text-base font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Dapatkan Akses Awal
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <p className="text-xs text-[#9db5a6]">
                Chat singkat lewat WhatsApp, tanpa formulir ribet
              </p>
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-[#5a6b58] lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#52b788]" />
                Aman
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FolderLock className="h-4 w-4 text-[#52b788]" />
                Data tersimpan di Google Drive pribadi
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-[#52b788]" />
                Privat
              </span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[280px] sm:max-w-[300px] lg:max-w-[320px]">
            <PhoneMockup
              src="/images/app/dashboard.jpeg"
              alt="Dashboard Rewang menampilkan stok, tagihan, hutang, dan agenda keluarga"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
