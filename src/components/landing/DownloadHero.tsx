import { ArrowRight, FolderLock, Lock, ShieldCheck } from "lucide-react";
import { getWaAccessUrl } from "@/lib/whatsapp";
import { PhoneMockup } from "./PhoneMockup";

const trust = [
  { icon: ShieldCheck, label: "Aman" },
  { icon: FolderLock, label: "Data di Google Drive pribadi" },
  { icon: Lock, label: "Privat" },
];

export function DownloadHero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-10 sm:pt-10 sm:pb-12 lg:pt-12 lg:pb-16">
      <div
        className="absolute -top-24 -right-32 h-80 w-80 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, #d9ead9 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/2 -left-32 h-72 w-72 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, #fce4b8 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <img
              src="/rewang.png"
              alt="Logo Rewang"
              width={64}
              height={64}
              draggable={false}
              className="mx-auto mb-4 h-14 w-14 rounded-2xl object-cover shadow-soft ring-1 ring-[#e8ede6] lg:mx-0 lg:h-16 lg:w-16"
            />

            <h1 className="font-heading text-[2rem] leading-[1.12] font-extrabold tracking-tight text-[#2d4a22] sm:text-[2.6rem] lg:text-[3.1rem]">
              Biar Urusan Rumah,
              <span className="block text-[#40916c]">Nggak Jadi Beban Pikiran.</span>
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#5a6b58] sm:text-lg lg:mx-0">
              Belanja, tagihan, utang-piutang, dan tugas rumah - semuanya tercatat rapi dalam satu
              aplikasi.
            </p>

            <div className="mt-6 flex flex-col items-center gap-2 lg:items-start">
              <a
                href={getWaAccessUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#52b788] to-[#2d6a4f] px-7 py-3.5 text-base font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Dapatkan Akses Awal
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <p className="text-xs text-[#9db5a6]">
                Chat singkat lewat WhatsApp, tanpa formulir ribet
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[#5a6b58] lg:justify-start">
              {trust.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                  <item.icon className="h-4 w-4 text-[#52b788]" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[200px] sm:max-w-[225px] lg:max-w-[245px]">
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
