const chips = [
  {
    className: "left-0 top-[70px] lp-float-1",
    iconBg: "#F2A24A",
    iconColor: "#2B1A00",
    title: "Beras tinggal 1 kg",
    subtitle: "Masuk daftar belanja",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-[17px] w-[17px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 10h14l-1.5 9h-11z" />
        <path d="M9 10l3-6 3 6" />
      </svg>
    ),
  },
  {
    className: "right-0 top-[230px] lp-float-2",
    iconBg: "#5FD18B",
    iconColor: "#0E2A24",
    title: "Listrik PLN lunas",
    subtitle: "Rp 250.000 · oleh Budi",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-[17px] w-[17px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12.5l4.5 4.5L19 7" />
      </svg>
    ),
  },
  {
    className: "left-[10px] top-[420px] lp-float-3",
    iconBg: "#B48CE0",
    iconColor: "#2A1240",
    title: "Rina tambah tugas",
    subtitle: "Bayar SPP Kakak · Jumat",
    icon: <span className="text-sm font-extrabold">R</span>,
  },
  {
    className: "right-[10px] top-[520px] lp-float-1 [animation-delay:-2s]",
    iconBg: "linear-gradient(135deg, #9C6F00, #FFE27A)",
    iconColor: "#2B1A00",
    title: "Kartu Emas terbuka!",
    subtitle: "30 hari kas rapi",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-[17px] w-[17px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
        <path d="M12 13v4M8 20h8" />
      </svg>
    ),
  },
];

export function Hero() {
  return (
    <div
      className="relative overflow-hidden text-white"
      style={{
        background: "linear-gradient(180deg, #0B231E 0%, #143E34 45%, #22604F 78%, #C98F4E 100%)",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span
          className="absolute h-[620px] w-[620px] rounded-full"
          style={{
            right: "-120px",
            top: "-80px",
            background:
              "radial-gradient(circle, rgba(255,214,140,.38) 0%, rgba(255,214,140,0) 65%)",
          }}
        />
        <span
          className="lp-glow absolute h-[90px] w-[90px] rounded-full"
          style={{
            right: "18%",
            top: "120px",
            background: "radial-gradient(circle at 40% 40%, #FFF3D6, #F5C977)",
            boxShadow: "0 0 80px rgba(245,201,119,.6)",
          }}
        />
        <span
          className="lp-twinkle absolute h-[3px] w-[3px] rounded-full bg-white"
          style={{ left: "8%", top: "140px" }}
        />
        <span
          className="lp-twinkle absolute h-[2px] w-[2px] rounded-full bg-white [animation-delay:-1s]"
          style={{ left: "22%", top: "96px" }}
        />
        <span
          className="lp-twinkle absolute h-[3px] w-[3px] rounded-full bg-white [animation-delay:-2s]"
          style={{ left: "40%", top: "160px" }}
        />
        <span
          className="lp-twinkle absolute h-[2px] w-[2px] rounded-full bg-white [animation-delay:-0.6s]"
          style={{ left: "55%", top: "90px" }}
        />
        <span
          className="lp-twinkle absolute h-[2px] w-[2px] rounded-full bg-white [animation-delay:-1.8s]"
          style={{ left: "66%", top: "210px" }}
        />
        <svg
          viewBox="0 0 1440 260"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 right-0 h-[260px] w-full"
        >
          <path
            d="M0 120 C 240 60, 480 90, 720 120 S 1200 80, 1440 70 L1440 260 L0 260 Z"
            fill="#1F5A4B"
          />
          <path
            d="M0 170 C 300 130, 640 160, 960 150 S 1340 140, 1440 150 L1440 260 L0 260 Z"
            fill="#17463B"
          />
          <path d="M0 220 C 360 190, 1080 250, 1440 210 L1440 260 L0 260 Z" fill="#F8F5EC" />
        </svg>
      </div>

      <header className="relative z-10">
        <div className="mx-auto flex min-h-[76px] max-w-[1160px] flex-wrap items-center gap-x-6 gap-y-3 px-4 sm:px-10">
          <a href="/" className="flex items-center gap-2.5 text-white">
            <img
              src="/rewang.png"
              alt="Logo Rewang"
              width={40}
              height={40}
              draggable={false}
              className="h-10 w-10 rounded-xl object-cover"
            />
            <span className="font-heading text-[22px] font-extrabold">Rewang</span>
          </a>
          <nav
            aria-label="Navigasi situs"
            className="flex flex-1 flex-wrap gap-x-5 gap-y-1 text-[15px] font-semibold"
          >
            <a href="#fitur" className="text-[#D4E8E1] hover:text-white">
              Fitur
            </a>
            <a href="#privasi" className="text-[#D4E8E1] hover:text-white">
              Privasi
            </a>
            <a href="#tanya" className="text-[#D4E8E1] hover:text-white">
              Tanya jawab
            </a>
          </nav>
          <a
            href="#unduh"
            className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-[#F7F4EC] px-[18px] text-[15px] font-bold text-[#17362F]"
          >
            Unduh gratis
          </a>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex max-w-[1160px] flex-wrap items-center gap-12 px-4 pt-7 pb-[clamp(120px,14vw,190px)] sm:px-10 sm:pt-12">
        <div className="min-w-0 flex-1 basis-[440px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-bold text-[#FFE7B8]">
            <span className="h-2 w-2 rounded-full bg-[#5FD18B]" />
            Untuk keluarga Indonesia
          </span>

          <h1 className="font-heading mt-4 text-[clamp(40px,5.8vw,70px)] font-extrabold leading-[1.02] tracking-tight">
            Rumah yang{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #FFD27A, #F2A24A)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              ingat semuanya
            </span>
            ,<br />
            biar kepala Anda lega.
          </h1>

          <p className="mt-5 max-w-[560px] text-[clamp(17px,1.6vw,20px)] leading-relaxed text-[#D4E8E1]">
            Beras mau habis, listrik jatuh tempo besok, setoran kolektif minggu ini. Rewang yang
            mengingat, Anda dan pasangan tinggal beres-beres bareng.
          </p>

          <div id="unduh" className="mt-7 flex flex-wrap gap-3">
            <a
              href="#"
              className="group inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl px-6 text-base font-bold text-[#2B1A00] shadow-[0_12px_30px_rgba(242,162,74,0.4)]"
              style={{ background: "linear-gradient(135deg, #FFD27A, #F2A24A)" }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[22px] w-[22px]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
              </svg>
              Segera di Google Play
            </a>
            <a
              href="#fitur"
              className="inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-white/40 px-6 text-base font-bold text-white"
            >
              Lihat cara kerjanya
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5 text-[15px] text-[#D4E8E1]">
            {["Gratis untuk mulai", "Tanpa iklan", "Data di Drive Anda"].map((label) => (
              <span key={label} className="flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px] text-[#5FD18B]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.5l4.5 4.5L19 7" />
                </svg>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[640px] flex-1 basis-[420px] justify-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 164 180"
            className="absolute bottom-[-40px] left-1/2 w-[420px] max-w-full -translate-x-1/2 opacity-90"
          >
            <rect x="108" y="10" width="18" height="40" rx="3" fill="#7A3E1F" />
            <rect x="14" y="74" width="136" height="98" rx="6" fill="#2A6B5A" />
            <path d="M0 82 L82 18 L164 82 Z" fill="#8E3B1C" />
            <rect className="lp-glow" x="24" y="96" width="30" height="28" rx="5" fill="#FFD27A" />
            <rect
              className="lp-glow [animation-delay:-1.2s]"
              x="110"
              y="96"
              width="30"
              height="28"
              rx="5"
              fill="#FFD27A"
            />
          </svg>

          {chips.map((chip) => (
            <div
              key={chip.title}
              className={`absolute z-[3] flex items-center gap-2.5 rounded-[18px] border border-white/30 py-2.5 pl-2.5 pr-4 text-white shadow-[0_14px_30px_rgba(5,20,16,0.35)] backdrop-blur-md max-[560px]:static max-[560px]:my-1.5 ${chip.className}`}
              style={{ background: "rgba(255,255,255,.14)" }}
            >
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px] text-white"
                style={{ background: chip.iconBg, color: chip.iconColor }}
              >
                {chip.icon}
              </span>
              <span>
                <b className="block text-sm leading-[18px]">{chip.title}</b>
                <small className="block text-[12.5px] leading-4 text-[#D4E8E1]">
                  {chip.subtitle}
                </small>
              </span>
            </div>
          ))}

          <div
            role="img"
            aria-label="Tampilan Beranda aplikasi Rewang"
            className="relative z-[2] h-[600px] w-[300px] max-w-full rounded-[46px] bg-[#0B1A16] p-2.5 shadow-[0_40px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.08)]"
          >
            <div className="flex h-full w-full flex-col overflow-hidden rounded-[38px] bg-[#F7F4EC] px-3.5 pb-3 pt-[22px]">
              <div className="text-[11px] text-[#5E6863]">
                Selasa, 13 Okt · <b className="text-[#8A4A06]">12 hari beruntun</b>
              </div>
              <div className="font-heading mt-0.5 text-xl font-bold">Selamat pagi, Rina</div>
              <div
                className="mt-2.5 rounded-[18px] p-3 text-white"
                style={{
                  background:
                    "linear-gradient(168deg, rgba(255,255,255,0) 44%, rgba(255,255,255,0.2) 44.4%, rgba(255,255,255,0.05) 100%), linear-gradient(135deg, #3A8975, #79BBA8)",
                }}
              >
                <div className="text-[10px] text-[#E3F2ED]">Saldo tercatat</div>
                <div className="font-heading text-2xl font-bold">Rp 815.304</div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <div className="rounded-[9px] bg-white/15 px-1.5 py-1.5 text-[9px] text-[#E3F2ED]">
                    Belum bayar
                    <div className="text-[11px] font-bold text-white">3 tagihan</div>
                  </div>
                  <div className="rounded-[9px] bg-white/15 px-1.5 py-1.5 text-[9px] text-[#E3F2ED]">
                    Hutang
                    <div className="text-[11px] font-bold text-white">Rp 52,5 jt</div>
                  </div>
                  <div className="rounded-[9px] bg-white/15 px-1.5 py-1.5 text-[9px] text-[#E3F2ED]">
                    Aset
                    <div className="text-[11px] font-bold text-white">Rp 62 jt</div>
                  </div>
                </div>
              </div>
              <div className="font-heading mt-3 text-sm font-semibold">
                Perlu perhatian · <span className="text-[#C2560C]">3</span>
              </div>
              <div className="mt-1.5 rounded-[14px] bg-white px-2.5">
                <div className="flex items-center gap-2 border-b border-[#EEE9DD] py-2.5 text-[11px]">
                  <span className="h-[26px] w-[26px] rounded-lg bg-[#FBEBD6]" />
                  <div className="flex-1">
                    <b>Listrik PLN</b>
                    <div className="text-[#8A4A06]">Jatuh tempo besok</div>
                  </div>
                  <span className="rounded-full bg-[#2F7A68] px-2 py-1 font-bold text-white">
                    Lunasi
                  </span>
                </div>
                <div className="flex items-center gap-2 border-b border-[#EEE9DD] py-2.5 text-[11px]">
                  <span className="h-[26px] w-[26px] rounded-lg bg-[#F8E2DF]" />
                  <div className="flex-1">
                    <b>8 barang perlu dibeli</b>
                    <div className="text-[#5E6863]">Gas LPG, Beras, +6</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 py-2.5 text-[11px]">
                  <span className="h-[26px] w-[26px] rounded-lg bg-[#F0E4F6]" />
                  <div className="flex-1">
                    <b>Setor kolektif</b>
                    <div className="text-[#5E6863]">Hari ini 19.30</div>
                  </div>
                </div>
              </div>
              <div className="flex-1" />
              <div
                className="flex gap-0.5 rounded-[20px] p-1"
                style={{ background: "linear-gradient(135deg, #17362F, #24574A)" }}
              >
                <div className="h-9 flex-1 rounded-2xl bg-[#F7F4EC]" />
                <div className="flex-1" />
                <div className="flex-1" />
                <div className="flex-1" />
                <div className="flex-1" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
