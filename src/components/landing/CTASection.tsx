import { MessageCircle, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

function getWaUrl() {
  const base = "https://wa.me/6281294097650";
  const text = "Halo Admin Rewang %F0%9F%91%8B%0A%0ASaya tertarik dengan Rewang App dan ingin informasi lebih lanjut mengenai paket langganan yang tersedia.%0A%0ATerima kasih %F0%9F%98%8A";
  return `${base}?text=${text}`;
}

export function CTASection() {
  return (
    <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #52b788 0%, #40916c 40%, #2d6a4f 100%)",
        }}
      />

      {/* Floating shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10 animate-[float_8s_ease-in-out_infinite]"
          style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10 animate-[float_10s_ease-in-out_infinite_2s]"
          style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-8">
          <Sparkles className="h-8 w-8 text-white" />
        </div>

        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Mulai Kelola Rumah Tangga
          <span className="block text-[#c5e0d5]">Lebih Rapi Bersama Rewang</span>
        </h2>

        <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
          Bergabung dengan ribuan keluarga yang sudah merasakan kemudahan mengatur rumah tangga
          dengan Rewang. Satu aplikasi untuk semua kebutuhan keluarga.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
          <a
            href={getWaUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#2d6a4f] shadow-2xl shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            Hubungi via WhatsApp untuk Berlangganan
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/70 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#c5e0d5]" />
            <span>Setup 2 menit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#c5e0d5]" />
            <span>Gratis uji coba</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#c5e0d5]" />
            <span>Dukungan prioritas</span>
          </div>
        </div>
      </div>
    </section>
  );
}