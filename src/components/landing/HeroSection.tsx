import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  Users,
  MessageCircle,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const slides = [
  {
    id: 1,
    title: "Dashboard",
    subtitle: "Semua dalam satu layar",
    image: "/images/banner/1.png",
  },
  {
    id: 2,
    title: "Agenda & Tugas",
    subtitle: "Atur jadwal keluarga",
    image: "/images/banner/2.png",
  },
  {
    id: 3,
    title: "Belanja & Keuangan",
    subtitle: "Pantau pengeluaran",
    image: "/images/banner/3.png",
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProgrammaticScroll = useRef(false);

  const goToSlide = useCallback((index: number) => {
    const el = sliderRef.current;
    if (!el) return;
    isProgrammaticScroll.current = true;
    const slideWidth = el.children[0]?.clientWidth ?? el.clientWidth;
    el.scrollTo({ left: index * slideWidth, behavior: "smooth" });
    // Reset the flag after the smooth scroll completes
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 500);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Sync scroll position with currentSlide
  useEffect(() => {
    goToSlide(currentSlide);
  }, [currentSlide, goToSlide]);

  // Auto-play
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Handle manual scroll
  const handleScroll = () => {
    // Ignore scroll events triggered programmatically
    if (isProgrammaticScroll.current) return;

    const el = sliderRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const slideWidth = el.children[0]?.clientWidth ?? el.clientWidth;
    const newIndex = Math.round(scrollLeft / slideWidth);
    if (newIndex !== currentSlide) {
      setCurrentSlide(newIndex);
    }
    // Reset auto-play on manual scroll
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
  };

  return (
    <section
      id="hero"
      className="relative flex items-center overflow-hidden pt-16 pb-12 sm:pb-16 lg:pb-20"
      style={{
        background:
          "linear-gradient(160deg, #fef9ef 0%, #e8f4f8 25%, #e8f5e9 50%, #f0f7f4 75%, #fef9ef 100%)",
      }}
    >
      {/* Floating abstract shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-25 animate-[float_8s_ease-in-out_infinite]"
          style={{ background: "radial-gradient(circle, #b5c99a 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 -right-20 w-96 h-96 rounded-full opacity-20 animate-[float_10s_ease-in-out_infinite_1s]"
          style={{ background: "radial-gradient(circle, #a8d8ea 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-20 left-1/3 w-64 h-64 rounded-full opacity-20 animate-[float_7s_ease-in-out_infinite_2s]"
          style={{ background: "radial-gradient(circle, #fce4b8 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full opacity-15 animate-[float_9s_ease-in-out_infinite_0.5s]"
          style={{ background: "radial-gradient(circle, #c5e0d5 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b5c99a] bg-white/70 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-[#4a6b5d] shadow-soft mb-6">
              <Sparkles className="h-4 w-4 text-[#7d9b76]" />
              Aplikasi Kolaborasi Rumah Tangga
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#2d4a22] leading-tight tracking-tight">
              Kelola Rumah Tangga & Aktivitas Keluarga
              <span className="block text-[#52b788]">Dalam Satu Aplikasi</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-[#6b7d6a] leading-relaxed max-w-xl mx-auto lg:mx-0">
              Rewang membantu keluarga mengatur agenda, tagihan, stok belanja, tugas harian, dan
              aktivitas keluarga agar lebih rapi dan terorganisir.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#52b788] to-[#40916c] px-8 py-4 text-base font-semibold text-white shadow-soft hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Mulai Sekarang
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="https://wa.me/6281311474713"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-2xl border-2 border-[#b5c99a] bg-white/80 backdrop-blur-sm px-8 py-4 text-base font-semibold text-[#4a6b5d] hover:bg-[#e8f5e9] hover:border-[#7d9b76] shadow-soft transition-all duration-300"
              >
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
                Hubungi via WhatsApp
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-6 justify-center lg:justify-start text-sm text-[#6b7d6a]">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#7d9b76]" />
                <span>Ribuan keluarga</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-[#7d9b76]" />
                <span>Agenda terorganisir</span>
              </div>
            </div>
          </div>

          {/* Right: App slider */}
          <div className="flex flex-col items-center">
            {/* Slider heading */}
            <p className="text-sm font-semibold text-[#52b788] mb-1">Lihat Langsung Tampilannya</p>
            <p className="text-xs text-[#9db5a6] mb-4">Didesain khusus untuk HP</p>

            {/* Slider container */}
            <div className="relative w-full max-w-sm">
              {/* Slides */}
              <div
                ref={sliderRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth rounded-3xl"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {slides.map((slide) => (
                  <div
                    key={slide.id}
                    className="flex-shrink-0 w-full snap-center px-2 py-4 flex flex-col items-center"
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full max-w-[260px] sm:max-w-[280px] rounded-2xl shadow-lg border-2 border-[#e8ede6]"
                    />
                    <p className="mt-3 text-sm font-semibold text-[#2d4a22]">{slide.title}</p>
                    <p className="text-xs text-[#9db5a6]">{slide.subtitle}</p>
                  </div>
                ))}
              </div>

              {/* Prev / Next buttons */}
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 h-9 w-9 rounded-full bg-white/90 shadow-md border border-[#e8ede6] flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-[#4a6b5d]" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 h-9 w-9 rounded-full bg-white/90 shadow-md border border-[#e8ede6] flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-[#4a6b5d]" />
              </button>

              {/* Dots */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentSlide
                        ? "w-6 h-2 bg-[#52b788]"
                        : "w-2 h-2 bg-[#d4e5e0] hover:bg-[#b5c99a]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS keyframes for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}