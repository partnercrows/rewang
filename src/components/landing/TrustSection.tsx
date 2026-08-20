import {
  Smartphone,
  ArrowRight,
  HardDriveDownload,
  ShieldCheck,
  Lock,
  FolderLock,
  Ban,
} from "lucide-react";

const trustPoints = [
  { icon: Lock, label: "Privat" },
  { icon: ShieldCheck, label: "Aman" },
  { icon: FolderLock, label: "Google Drive pribadi" },
  { icon: Ban, label: "Tidak bergantung penyimpanan publik" },
];

export function TrustSection() {
  return (
    <section className="bg-[#f4f8f0] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-[#2d4a22] sm:text-4xl">
              Data rumah tangga tetap milik Anda.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[#5a6b58] lg:mx-0">
              Rewang membantu menyimpan dan menyinkronkan data Anda ke Google Drive pribadi. Data
              rumah tangga tetap berada di bawah kendali Anda.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:inline-grid">
              {trustPoints.map((point) => (
                <div
                  key={point.label}
                  className="flex items-center gap-2 text-left text-sm text-[#3f5a3f]"
                >
                  <point.icon className="h-4 w-4 shrink-0 text-[#40916c]" />
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-soft sm:h-20 sm:w-20">
                <Smartphone className="h-7 w-7 text-[#40916c] sm:h-8 sm:w-8" />
              </div>
              <span className="text-xs font-medium text-[#5a6b58]">HP Anda</span>
            </div>

            <ArrowRight className="h-5 w-5 shrink-0 text-[#b5c99a]" />

            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7d9b76] to-[#52b788] shadow-soft sm:h-20 sm:w-20">
                <span className="font-heading text-lg font-bold text-white sm:text-xl">R</span>
              </div>
              <span className="text-xs font-medium text-[#5a6b58]">Rewang</span>
            </div>

            <ArrowRight className="h-5 w-5 shrink-0 text-[#b5c99a]" />

            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-soft sm:h-20 sm:w-20">
                <HardDriveDownload className="h-7 w-7 text-[#4a90d9] sm:h-8 sm:w-8" />
              </div>
              <span className="text-xs font-medium text-[#5a6b58] text-center">
                Google Drive
                <br />
                pribadi
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
