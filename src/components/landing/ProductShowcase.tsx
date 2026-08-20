import { PhoneMockup } from "./PhoneMockup";

const screens = [
  {
    label: "Beranda",
    caption: "Belanja, tagihan, utang & piutang sekilas",
    image: "/images/app/dashboard.jpeg",
  },
  { label: "Belanja", caption: "Stok kebutuhan rumah", image: "/images/banner/3.png" },
  { label: "Tagihan", caption: "Jatuh tempo & pengingat", image: "/images/banner/2.png" },
  { label: "Tugas Rumah", caption: "Siapa kerjakan apa", image: "/images/app/tugas.jpeg" },
];

export function ProductShowcase() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-[#2d4a22] sm:text-4xl">
            Aplikasinya, benar-benar seperti ini.
          </h2>
          <p className="mt-3 text-base text-[#6b7d6a]">
            Bukan sekadar mockup — ini tampilan asli Rewang di HP.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4 lg:gap-6">
          {screens.map((screen) => (
            <div key={screen.label} className="flex flex-col items-center">
              <div className="w-full max-w-[200px]">
                <PhoneMockup src={screen.image} alt={`Tampilan ${screen.label} di Rewang`} />
              </div>
              <p className="mt-4 font-heading text-sm font-semibold text-[#2d4a22]">
                {screen.label}
              </p>
              <p className="text-xs text-[#9db5a6]">{screen.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
