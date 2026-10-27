const levels = [
  {
    level: "LEVEL 1 · PERUNGGU",
    title: "Langkah Awal",
    nodeBg: "#D9A06B",
    nodeColor: "#3A2208",
    levelColor: "#8C5A2B",
    border: "linear-gradient(135deg,#7A4A22,#D9A06B,#8C5A2B)",
    bg: "#FFFFFF",
    done: true,
  },
  {
    level: "LEVEL 2 · PERAK",
    title: "Makin Rajin",
    nodeBg: "#E4E9EE",
    nodeColor: "#3D4752",
    levelColor: "#5A6672",
    border: "linear-gradient(135deg,#7E8A96,#F4F7FA,#8E99A4)",
    bg: "#FFFFFF",
    done: true,
  },
  {
    level: "LEVEL 3 · EMAS",
    title: "Andalan Rumah",
    nodeBg: "#FFD27A",
    nodeColor: "#2B1A00",
    levelColor: "#8A6200",
    border: "linear-gradient(135deg,#9C6F00,#FFE27A,#B8860B)",
    bg: "#FFFDF4",
    current: true,
    progress: 64,
  },
  {
    level: "LEVEL 4 · PLATINUM",
    title: "Master Rewang",
    nodeBg: "#2E4A44",
    nodeColor: "#CFE3DC",
    levelColor: "#2A7385",
    border: "linear-gradient(135deg,#4AA3BB,#E8FBFF,#7A6FD1)",
    bg: "#F6FDFF",
    locked: true,
  },
  {
    level: "LEVEL 5 · LEGENDA",
    title: "Legenda Rewang",
    nodeBg: "#2E4A44",
    nodeColor: "#CFE3DC",
    levelColor: "#C9BFF0",
    border: "linear-gradient(90deg,#FF6B6B,#F2C94C,#5FD18B,#5FB3C9,#9B6BFF,#FF6B6B)",
    bg: "radial-gradient(circle at 50% 55%, #7B5BD6 0, #3A2378 45%, #140C33 100%)",
    locked: true,
    dark: true,
  },
];

const tracks = [
  { label: "Kas rapi", color: "#5FD18B" },
  { label: "Pelunasan hutang", color: "#F2A24A" },
  { label: "Hari beruntun", color: "#FFD27A" },
];

export function Achievements() {
  return (
    <section
      className="relative overflow-hidden py-[clamp(56px,8vw,110px)] text-white"
      style={{
        background:
          "radial-gradient(circle at 85% 10%, rgba(255,210,122,.16) 0, rgba(255,210,122,0) 40%), linear-gradient(160deg, #17362F, #24574A)",
      }}
    >
      <div className="mx-auto max-w-[1160px] px-4 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="max-w-[640px]">
            <span className="text-[13px] font-extrabold tracking-[0.1em] text-[#F2C94C]">
              KOLEKSI PENCAPAIAN
            </span>
            <h2 className="font-heading mt-2.5 text-[clamp(32px,4.2vw,52px)] font-extrabold leading-[1.05] tracking-tight">
              Dari gubuk kecil sampai <span className="text-[#FFD27A]">rumah legenda</span>
            </h2>
            <p className="mt-3.5 text-lg leading-relaxed text-[#CFE3DC]">
              Setiap tugas rumah yang beres memajukan Anda satu langkah. Naik level, rumah di kartu
              ikut tumbuh, sampai jadi rumah yang ikut ke mana pun keluarga pergi.
            </p>
          </div>
          <a
            href="#"
            className="inline-flex min-h-[54px] items-center gap-2.5 rounded-2xl bg-[#F7F4EC] px-6 text-base font-bold text-[#17362F]"
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
              <path d="M4 20l1.4-4.2A8 8 0 1 1 8.4 18.6z" />
            </svg>
            Bagikan kartu ke WhatsApp
          </a>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-6 list-none p-0 min-[621px]:grid-cols-2 min-[961px]:grid-cols-5">
          {levels.map((lvl, i) => (
            <li key={lvl.title} className="relative flex flex-col items-center gap-3.5 text-center">
              <span
                className={`relative z-[2] flex h-[60px] w-[60px] items-center justify-center rounded-full border-[5px] border-[#0E2A24] font-heading text-xl font-extrabold shadow-[0_8px_18px_rgba(0,0,0,0.35)] ${lvl.current ? "lp-node-now" : ""}`}
                style={{ background: lvl.nodeBg, color: lvl.nodeColor }}
              >
                {lvl.current ? (
                  <>
                    {i + 1}
                    <span className="absolute bottom-full left-1/2 mb-3.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#FFD27A] px-2.5 py-1 text-xs font-extrabold text-[#2B1A00] shadow-[0_6px_14px_rgba(0,0,0,0.3)]">
                      Anda di sini
                    </span>
                  </>
                ) : lvl.done ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                )}
              </span>

              <div
                className="w-full max-w-[210px] overflow-hidden rounded-[18px] border-4 border-transparent"
                style={{
                  background: `linear-gradient(#FFFFFF,#FFFFFF) padding-box, ${lvl.border} border-box`,
                }}
              >
                <div
                  className="relative h-[120px]"
                  style={{
                    background: lvl.dark ? lvl.bg : "linear-gradient(180deg,#D7EAF7,#EAF4EC)",
                  }}
                >
                  <div className="absolute inset-1.5 flex items-center justify-center">
                    <svg viewBox="0 0 80 80" className="h-full w-full">
                      <path
                        d={`M${40 - 10 - i * 3} ${50 - i * 2} L40 ${20 - i * 3} L${40 + 10 + i * 3} ${50 - i * 2} Z`}
                        fill={lvl.dark ? "#C9BFF0" : lvl.nodeBg}
                      />
                      <rect
                        x={40 - 10 - i * 3}
                        y={50 - i * 2}
                        width={20 + i * 6}
                        height={22 + i * 2}
                        fill={lvl.dark ? "#3A2378" : "#FFFFFF"}
                        stroke={lvl.dark ? "#C9BFF0" : lvl.nodeBg}
                        strokeWidth={2}
                      />
                    </svg>
                  </div>
                </div>
                <div
                  className="px-3 pb-3 pt-2.5"
                  style={{
                    color: lvl.dark ? "#FFFFFF" : "#14211E",
                    background: lvl.dark ? lvl.bg : lvl.bg,
                  }}
                >
                  <div
                    className="text-xs font-extrabold tracking-[0.08em]"
                    style={{ color: lvl.levelColor }}
                  >
                    {lvl.level}
                  </div>
                  <div className="font-heading mt-0.5 text-[17px] font-bold">{lvl.title}</div>
                  {lvl.progress != null && (
                    <div className="mt-2 h-1.5 rounded-full bg-[#F3E7C2]">
                      <div
                        className="h-full rounded-full bg-[#B8860B]"
                        style={{ width: `${lvl.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap items-center gap-2.5">
          <span className="mr-1 text-[15px] text-[#CFE3DC]">Jalur lain yang bisa ditempuh:</span>
          {tracks.map((t) => (
            <span
              key={t.label}
              className="inline-flex items-center gap-2 rounded-[14px] border border-white/15 bg-white/10 px-3.5 py-2.5 text-[15px] font-semibold text-white"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
