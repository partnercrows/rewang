import { HandCoins, ListChecks, ReceiptText, ShoppingBag } from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";

const features = [
  {
    icon: ShoppingBag,
    title: "Belanja & Stok",
    text: "Catat kebutuhan, tandai yang sudah dibeli. Nggak ada lagi yang tertinggal.",
  },
  {
    icon: ReceiptText,
    title: "Tagihan",
    text: "Pantau jatuh tempo, tahu mana yang belum dibayar sebelum kena denda.",
  },
  {
    icon: HandCoins,
    title: "Utang-Piutang",
    text: "Simpan transaksi dan lihat siapa yang masih punya utang.",
  },
  {
    icon: ListChecks,
    title: "Tugas Rumah",
    text: "Atur siapa mengerjakan apa, lengkap dengan pengulangan.",
  },
];

const screens = [
  { label: "Belanja", image: "/images/banner/3.png" },
  { label: "Tagihan", image: "/images/banner/2.png" },
  { label: "Tugas Rumah", image: "/images/app/tugas.jpeg" },
];

export function FeatureGrid() {
  return (
    <section id="fitur" className="bg-white py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#2d4a22] sm:text-3xl lg:text-4xl">
            Satu aplikasi untuk semua kebutuhan rumah.
          </h2>
          <p className="mt-2.5 text-sm text-[#6b7d6a] sm:text-base">
            Semua yang biasanya cuma diingat-ingat, sekarang tercatat.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4 lg:gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-[#e8ede6] bg-[#fef9ef]/70 p-4 transition-colors hover:border-[#b5c99a] sm:p-5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#fef3e2]">
                <feature.icon className="h-5 w-5 text-[#c9791f]" />
              </div>
              <h3 className="font-heading text-base font-semibold text-[#2d4a22]">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#6b7d6a]">{feature.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-8 lg:mt-12">
          {screens.map((screen) => (
            <div key={screen.label} className="flex flex-col items-center">
              <div className="w-full max-w-[132px] sm:max-w-[165px]">
                <PhoneMockup
                  src={screen.image}
                  alt={`Tampilan ${screen.label} di Rewang`}
                  aspectClass="aspect-[9/17]"
                />
              </div>
              <p className="mt-2.5 font-heading text-xs font-semibold text-[#2d4a22] sm:text-sm">
                {screen.label}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-[#9db5a6] sm:text-sm">
          Tampilan asli aplikasi Rewang di HP - bukan sekadar mockup.
        </p>
      </div>
    </section>
  );
}
