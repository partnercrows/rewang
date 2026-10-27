const checks = [
  "Semua catatan tersimpan di Google Sheets milik Anda sendiri.",
  "Rewang tidak menyimpan data rumah tangga Anda di server kami.",
  "Tetap bisa dipakai tanpa internet, lalu tersinkron saat online.",
];

export function Privacy() {
  return (
    <section id="privasi" className="pb-[clamp(48px,7vw,96px)]">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-10">
        <div className="relative grid grid-cols-1 items-center gap-[clamp(28px,4vw,56px)] overflow-hidden rounded-[36px] bg-[#DDEDE7] p-[clamp(24px,4.5vw,56px)] min-[861px]:grid-cols-2">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-[360px] w-[360px] rounded-full"
            style={{
              right: "-120px",
              bottom: "-160px",
              background: "radial-gradient(circle, rgba(47,122,104,.18) 0, rgba(47,122,104,0) 70%)",
            }}
          />

          <div className="relative">
            <span className="inline-flex items-center gap-2 text-[13px] font-extrabold tracking-[0.1em] text-[#22604F]">
              <svg
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              PRIVASI
            </span>
            <h2 className="font-heading mt-2.5 text-[clamp(32px,4vw,48px)] font-extrabold leading-[1.05] tracking-tight text-[#17362F]">
              Data Anda, <span className="text-[#2F7A68]">di Drive Anda.</span>
            </h2>
            <div className="mt-5 flex flex-col gap-2.5">
              {checks.map((c) => (
                <div key={c} className="flex items-start gap-2.5 text-base leading-relaxed">
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2F7A68]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                  {c}
                </div>
              ))}
            </div>
            <a href="/kebijakan" className="mt-[18px] inline-block font-bold text-[#22604F]">
              Baca Kebijakan Privasi →
            </a>
          </div>

          <div
            role="img"
            aria-label="Alur data: HP Anda tersambung langsung ke Google Sheets di Drive Anda, tanpa lewat server Rewang"
            className="relative rounded-[28px] bg-white p-[clamp(20px,3vw,32px)] shadow-[0_16px_40px_rgba(20,33,30,0.10)]"
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-shrink-0 flex-col items-center gap-2.5 text-center text-sm font-bold text-[#17362F]">
                <span className="flex h-[84px] w-[84px] items-center justify-center rounded-[24px] bg-[#17362F] text-white shadow-[0_12px_26px_rgba(20,33,30,0.14)]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[38px] w-[38px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                    <path d="M11 18.5h2" />
                  </svg>
                </span>
                HP Anda
              </div>
              <div className="mb-[24px] flex min-w-[40px] flex-1 flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-[#22604F]">langsung</span>
                <div
                  className="h-1 w-full rounded-full"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg, #2F7A68 0 10px, transparent 10px 16px)",
                  }}
                />
              </div>
              <div className="flex flex-shrink-0 flex-col items-center gap-2.5 text-center text-sm font-bold text-[#17362F]">
                <span className="flex h-[84px] w-[84px] items-center justify-center rounded-[24px] bg-[#DDEDE7] text-[#17362F] shadow-[0_12px_26px_rgba(20,33,30,0.14)]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[38px] w-[38px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="4" y="3" width="16" height="18" rx="2.5" />
                    <path d="M4 9h16M4 15h16M10 3v18" />
                  </svg>
                </span>
                Sheets di
                <br />
                Drive Anda
              </div>
            </div>

            <div className="mt-[22px] flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-[#D3CBBB] bg-[#FBF9F4] px-3.5 py-3">
              <span className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-[#EEE9DD] text-[#5E6863]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="16" height="7" rx="2" />
                  <rect x="4" y="13" width="16" height="7" rx="2" />
                  <path d="M8 7.5h.01M8 16.5h.01" />
                </svg>
                <span className="absolute -right-1.5 -top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-[#A9342D] text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3.4}
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </span>
              </span>
              <span className="text-sm leading-tight text-[#45514C]">
                <b className="text-[#14211E] line-through">Server Rewang</b>
                <br />
                Tidak ikut menyimpan catatan rumah Anda
              </span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDEDE7] px-2.5 py-1.5 text-[13px] font-semibold text-[#17362F]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[15px] w-[15px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01" />
                  <path d="M3 3l18 18" />
                </svg>
                Jalan tanpa internet
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBEBD6] px-2.5 py-1.5 text-[13px] font-semibold text-[#8A4A06]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[15px] w-[15px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
                </svg>
                Sinkron saat online
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
