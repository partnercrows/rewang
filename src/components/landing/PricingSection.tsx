import { Check, Zap, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";

function getWaUrl(planName?: string) {
  const base = "https://wa.me/6281294097650";
  const text = planName
    ? `Halo Admin Rewang %F0%9F%91%8B%0A%0ASaya ingin berlangganan Paket ${planName} untuk penggunaan Rewang App.%0A%0AMohon informasi mengenai proses pembayaran dan aktivasi akun.%0A%0ATerima kasih %F0%9F%98%8A`
    : "Halo Admin Rewang %F0%9F%91%8B%0A%0ASaya tertarik dengan Rewang App dan ingin informasi lebih lanjut mengenai paket langganan yang tersedia.%0A%0ATerima kasih %F0%9F%98%8A";
  return `${base}?text=${text}`;
}

const plans = [
  {
    name: "Starter",
    price: "15.000",
    period: "bulan",
    description: "Cocok untuk pasangan muda atau keluarga kecil.",
    popular: false,
    gradient: "from-white to-[#fef9ef]",
    border: "border-[#e8ede6]",
    buttonStyle: "border-2 border-[#b5c99a] text-[#4a6b5d] hover:bg-[#e8f5e9] hover:border-[#7d9b76]",
    features: [
      "Agenda & reminder keluarga",
      "Catatan rumah bersama",
      "Tugas harian (max 5/hari)",
      "Stok belanja dasar",
      "Resep favorit (max 10)",
      "1 anggota keluarga",
    ],
  },
  {
    name: "Family",
    price: "35.000",
    period: "bulan",
    description: "Untuk keluarga yang ingin semua fitur lengkap.",
    popular: true,
    gradient: "from-[#e8f5e9] to-[#d4edda]",
    border: "border-[#52b788]",
    buttonStyle:
      "bg-gradient-to-r from-[#52b788] to-[#40916c] text-white shadow-soft hover:shadow-lg hover:-translate-y-0.5",
    features: [
      "Semua fitur Starter",
      "Tagihan & laporan pengeluaran",
      "Hutang piutang keluarga",
      "Tugas harian unlimited",
      "Resep unlimited",
      "Wishlist keluarga",
      "Dashboard aktivitas keluarga",
      "Hingga 6 anggota keluarga",
      "Akses penuh semua fitur",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="harga" className="relative py-12 sm:py-16 lg:py-20">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #ffffff 0%, #fef9ef 30%, #e8f4f8 70%, #ffffff 100%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b5c99a] bg-white/70 px-4 py-1 text-sm font-medium text-[#4a6b5d] mb-4">
            <Zap className="h-4 w-4 text-[#e09f3e]" />
            Harga Terjangkau
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2d4a22] tracking-tight">
            Pilih Paket yang
            <span className="block text-[#52b788]">Sesuai Kebutuhan</span>
          </h2>
          <p className="mt-4 text-lg text-[#6b7d6a]">
            Mulai dengan paket yang sesuai, upgrade kapan saja seiring kebutuhan keluarga.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl bg-gradient-to-b ${plan.gradient} ${plan.border} border-2 p-8 sm:p-10 shadow-soft hover:shadow-card transition-all duration-300 ${
                plan.popular ? "scale-[1.02] lg:scale-105" : ""
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#52b788] to-[#40916c] px-5 py-1.5 text-xs font-bold text-white shadow-lg">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    PALING POPULER
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="font-heading text-xl font-bold text-[#2d4a22]">{plan.name}</h3>
                <p className="text-sm text-[#6b7d6a] mt-1">{plan.description}</p>
                <div className="mt-6 flex items-baseline justify-center gap-1">
                  <span className="text-sm text-[#6b7d6a]">Rp</span>
                  <span className="font-heading text-5xl font-extrabold text-[#2d4a22]">
                    {plan.price}
                  </span>
                  <span className="text-sm text-[#6b7d6a]">/{plan.period}</span>
                </div>
              </div>

              {/* Features list */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <Check
                        className={`h-5 w-5 ${
                          plan.popular ? "text-[#40916c]" : "text-[#7d9b76]"
                        }`}
                      />
                    </div>
                    <span className="text-sm text-[#4a6b5d] leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={getWaUrl(plan.name)}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full text-center rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all duration-300 ${plan.buttonStyle}`}
              >
                Berlangganan {plan.name}
              </a>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-[#9db5a6] mt-8">
          Butuh bantuan memilih?{" "}
          <a
            href={getWaUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#52b788] font-semibold hover:underline"
          >
            Hubungi kami via WhatsApp
          </a>
        </p>
      </div>
    </section>
  );
}