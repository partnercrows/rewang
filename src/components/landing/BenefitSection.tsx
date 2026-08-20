import { LayoutDashboard } from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";

const benefits = [
  {
    tag: "Belanja",
    title: "Nggak perlu lagi mengandalkan ingatan.",
    text: "Catat kebutuhan belanja dan tandai barang yang sudah dibeli — semua anggota keluarga lihat daftar yang sama.",
    image: "/images/banner/3.png",
    alt: "Tampilan Belanja & Stok di aplikasi Rewang",
  },
  {
    tag: "Tagihan",
    title: "Tahu apa yang sudah dan belum dibayar.",
    text: "Pantau tagihan rumah tangga lengkap dengan jatuh tempo, supaya tidak ada yang terlewat.",
    image: "/images/banner/2.png",
    alt: "Tampilan tambah tagihan di aplikasi Rewang",
  },
  {
    tag: "Utang-Piutang",
    title: "Catat tanpa harus mengingat semuanya.",
    text: "Simpan transaksi dan lihat siapa yang masih memiliki utang, langsung dari layar utama.",
    image: "/images/app/dashboard.jpeg",
    alt: "Ringkasan hutang dan piutang di dashboard Rewang",
    crop: true,
  },
  {
    tag: "Tugas Rumah",
    title: "Rumah lebih teratur, tugas lebih jelas.",
    text: "Atur dan pantau pekerjaan rumah tangga, lengkap dengan pengulangan dan siapa penanggung jawabnya.",
    image: "/images/app/tugas.jpeg",
    alt: "Tampilan daftar Tugas di aplikasi Rewang",
  },
];

export function BenefitSection() {
  return (
    <section id="fitur" className="bg-[#fef9ef] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-3xl font-bold tracking-tight text-[#2d4a22] sm:text-4xl">
          Satu aplikasi untuk semua kebutuhan rumah.
        </h2>

        <div className="mt-14 flex flex-col gap-16 sm:mt-16 sm:gap-20 lg:gap-24">
          {benefits.map((benefit, i) => (
            <div
              key={benefit.tag}
              className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
                i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="text-center lg:text-left">
                <span className="inline-block rounded-full bg-[#e8f5e9] px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#2d6a4f]">
                  {benefit.tag}
                </span>
                <h3 className="mt-4 font-heading text-2xl font-bold leading-snug text-[#2d4a22] sm:text-3xl">
                  {benefit.title}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-[#6b7d6a] lg:mx-0">
                  {benefit.text}
                </p>
              </div>

              <div className="mx-auto w-full max-w-[240px] sm:max-w-[260px]">
                {benefit.crop ? (
                  <div className="rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9db5a6]">
                      <LayoutDashboard className="h-3 w-3" />
                      Ringkasan di Beranda
                    </div>
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={benefit.image}
                        alt={benefit.alt}
                        className="aspect-[4/3] w-full object-cover"
                        style={{ objectPosition: "center 12%" }}
                        draggable={false}
                      />
                    </div>
                  </div>
                ) : (
                  <PhoneMockup src={benefit.image} alt={benefit.alt} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
