function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function FeaturesBento() {
  return (
    <section id="fitur" className="bg-white py-[clamp(48px,7vw,96px)]">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="max-w-[640px]">
            <span className="text-[13px] font-extrabold tracking-[0.1em] text-[#22604F]">
              SATU APLIKASI, SEISI RUMAH
            </span>
            <h2 className="font-heading mt-2.5 text-[clamp(32px,4.2vw,52px)] font-extrabold leading-[1.05] tracking-tight">
              Dari dapur sampai dompet, <span className="text-[#2F7A68]">semua tercatat.</span>
            </h2>
          </div>
          <p className="max-w-[380px] text-lg leading-relaxed text-[#45514C]">
            Tombol besar, bahasa sederhana, dan pengingat yang bisa diatur, dibuat untuk dipakai
            setiap hari.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 min-[621px]:grid-cols-2 min-[961px]:grid-cols-6">
          {/* 1. Stok & belanja */}
          <div className="flex flex-col gap-4 rounded-[28px] bg-[#17362F] p-6 text-white transition-transform hover:-translate-y-1 min-[621px]:col-span-2 min-[961px]:col-span-3 min-[961px]:row-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F2A24A] text-[#2B1A00]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[22px] w-[22px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 10h14l-1.5 9h-11z" />
                  <path d="M9 10l3-6 3 6" />
                </svg>
              </span>
              <h3 className="font-heading text-[22px] font-bold">Stok &amp; belanja</h3>
            </div>
            <p className="max-w-[440px] text-[#CFE3DC]">
              Tahu barang yang habis atau menipis, centang saat belanja, lalu kirim daftarnya ke
              WhatsApp.
            </p>
            <div className="mt-auto rounded-[18px] bg-white p-4 text-[#14211E] shadow-[0_1px_2px_rgba(20,33,30,0.06),0_10px_24px_rgba(20,33,30,0.06)]">
              <div className="mb-1 flex items-center justify-between gap-2">
                <b className="font-heading text-base">Daftar belanja</b>
                <span className="text-[13px] text-[#5E6863]">2 dari 5 dibeli</span>
              </div>
              <div className="mb-1.5 h-1.5 rounded-full bg-[#EEE9DD]">
                <div className="h-full w-[40%] rounded-full bg-[#2F7A68]" />
              </div>
              <div className="flex items-center gap-2.5 border-b border-[#EEE9DD] py-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#2F7A68] text-white">
                  <Check className="h-[13px] w-[13px]" />
                </span>
                <span className="flex-1 text-[#5E6863] line-through">Beras 5 kg</span>
              </div>
              <div className="flex items-center gap-2.5 border-b border-[#EEE9DD] py-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#2F7A68] text-white">
                  <Check className="h-[13px] w-[13px]" />
                </span>
                <span className="flex-1 text-[#5E6863] line-through">Telur 1 kg</span>
              </div>
              <div className="flex items-center gap-2.5 border-b border-[#EEE9DD] py-2.5">
                <span className="h-5 w-5 rounded-md border-2 border-[#B9C2BE]" />
                <span className="flex-1 font-semibold">Gas LPG 3 kg</span>
                <span className="whitespace-nowrap rounded-full bg-[#F8E2DF] px-2.5 py-0.5 text-xs font-bold text-[#A9342D]">
                  Habis
                </span>
              </div>
              <div className="flex items-center gap-2.5 py-2.5">
                <span className="h-5 w-5 rounded-md border-2 border-[#B9C2BE]" />
                <span className="flex-1 font-semibold">Minyak goreng</span>
                <span className="whitespace-nowrap rounded-full bg-[#FBEBD6] px-2.5 py-0.5 text-xs font-bold text-[#8A4A06]">
                  Menipis
                </span>
              </div>
              <div className="mt-2.5 flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] bg-[#5FD18B] text-[15px] font-bold text-[#0E2A24]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 20l1.4-4.2A8 8 0 1 1 8.4 18.6z" />
                </svg>
                Kirim ke WhatsApp
              </div>
            </div>
          </div>

          {/* 2. Kas & tagihan */}
          <div className="flex flex-col gap-4 rounded-[28px] bg-[#FFF4E3] p-6 min-[961px]:col-span-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-[#22604F]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[22px] w-[22px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="6" width="18" height="14" rx="3" />
                  <path d="M3 10h18M16 15h2" />
                </svg>
              </span>
              <h3 className="font-heading text-[22px] font-bold">Kas &amp; tagihan</h3>
            </div>
            <p className="text-[#45514C]">
              Catat pemasukan dan pengeluaran, lihat tren mingguan, dan dapat pengingat sebelum
              jatuh tempo.
            </p>
            <div className="rounded-[18px] bg-white p-4 text-[#14211E] shadow-[0_1px_2px_rgba(20,33,30,0.06),0_10px_24px_rgba(20,33,30,0.06)]">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-xs text-[#5E6863]">Pengeluaran minggu ini</div>
                  <div className="font-heading text-[22px] font-bold">Rp 1.240.000</div>
                </div>
                <span className="whitespace-nowrap rounded-full bg-[#DDEDE7] px-2.5 py-0.5 text-xs font-bold text-[#17362F]">
                  −12% dari minggu lalu
                </span>
              </div>
              <div className="mt-3 flex h-[72px] items-end gap-2">
                {[45, 70, 35, 95, 55, 40, 25].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-md"
                    style={{ height: `${h}%`, background: i === 3 ? "#2F7A68" : "#CFE3DC" }}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex gap-2 text-center text-[11px] text-[#5E6863]">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                  <span
                    key={d}
                    className={`flex-1 ${d === "Kam" ? "font-bold text-[#17362F]" : ""}`}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[#FBEBD6] px-3 py-2.5">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[18px] w-[18px] text-[#8A4A06]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />
                </svg>
                <span className="flex-1 text-[13px]">
                  <b>Listrik PLN</b> jatuh tempo besok
                </span>
                <b className="text-[13px] text-[#8A4A06]">Rp 250.000</b>
              </div>
            </div>
          </div>

          {/* 3. Resep dari stok */}
          <div className="flex flex-col gap-4 rounded-[28px] bg-[#F8F5EC] p-6 min-[961px]:col-span-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#E9D9BF] text-[#8A5A1E]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[22px] w-[22px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 11h16v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" />
                  <path d="M2.5 11h19M9 7.5V5.5M15 7.5V5.5M12 7.5V4" />
                </svg>
              </span>
              <h3 className="font-heading text-[22px] font-bold">Resep dari stok</h3>
            </div>
            <p className="text-[#45514C]">
              Simpan resep favorit. Bahan yang kurang langsung masuk daftar belanja.
            </p>
            <div className="rounded-[18px] bg-white p-4 text-[#14211E] shadow-[0_1px_2px_rgba(20,33,30,0.06),0_10px_24px_rgba(20,33,30,0.06)]">
              <div className="flex items-center justify-between gap-2">
                <b className="font-heading text-base">Nasi goreng kampung</b>
                <span className="text-[13px] text-[#5E6863]">3 dari 5 bahan ada</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {["Nasi", "Telur", "Kecap"].map((i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#DDEDE7] px-2.5 py-1 text-[13px] font-semibold text-[#17362F]"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {i}
                  </span>
                ))}
                {["Bawang merah", "Cabai rawit"].map((i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FBEBD6] px-2.5 py-1 text-[13px] font-semibold text-[#8A4A06]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {i}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[#22604F]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                2 bahan masuk daftar belanja
              </div>
            </div>
          </div>

          {/* 4. Hutang & kolektif */}
          <div className="flex flex-col gap-4 rounded-[28px] bg-[#FBEDEA] p-6 min-[961px]:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-[#A9342D]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[22px] w-[22px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
                  <path d="M9 8h6M9 12h6" />
                </svg>
              </span>
              <h3 className="font-heading text-[22px] font-bold">Hutang &amp; kolektif</h3>
            </div>
            <p className="text-[#45514C]">
              Pantau cicilan sampai lunas, kelola iuran, dan ingatkan peserta lewat WhatsApp.
            </p>
            <div className="rounded-[18px] bg-white p-4 text-[#14211E] shadow-[0_1px_2px_rgba(20,33,30,0.06),0_10px_24px_rgba(20,33,30,0.06)]">
              <div className="flex justify-between gap-2 text-[13px]">
                <b>Cicilan motor</b>
                <span className="text-[#5E6863]">7 / 12 bulan</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#F3E4E1]">
                <div className="h-full w-[58%] rounded-full bg-[#A9342D]" />
              </div>
              <div className="my-3.5 h-px bg-[#EEE9DD]" />
              <div className="flex items-center justify-between gap-2">
                <div className="text-[13px]">
                  <b>Arisan RT</b>
                  <div className="text-[#5E6863]">8 dari 10 sudah setor</div>
                </div>
                <div className="flex">
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-[#B48CE0] text-[13px] font-extrabold text-[#2A1240]">
                    R
                  </span>
                  <span className="-ml-2 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-[#F2A24A] text-[13px] font-extrabold text-[#2B1A00]">
                    B
                  </span>
                  <span className="-ml-2 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-[#5FD18B] text-[13px] font-extrabold text-[#0E2A24]">
                    S
                  </span>
                  <span className="-ml-2 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white bg-[#EEE9DD] text-[11px] font-extrabold text-[#45514C]">
                    +5
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Bersama keluarga */}
          <div className="flex flex-col gap-4 rounded-[28px] bg-[#F3ECF8] p-6 min-[961px]:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-[#6B3E8F]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[22px] w-[22px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" />
                  <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.3 3.5 5" />
                </svg>
              </span>
              <h3 className="font-heading text-[22px] font-bold">Bersama keluarga</h3>
            </div>
            <p className="text-[#45514C]">
              Undang pasangan. Riwayat menunjukkan siapa mencatat apa dan kapan.
            </p>
            <div className="rounded-[18px] bg-white px-3.5 py-1.5 shadow-[0_1px_2px_rgba(20,33,30,0.06),0_10px_24px_rgba(20,33,30,0.06)]">
              {[
                {
                  a: "R",
                  bg: "#B48CE0",
                  c: "#2A1240",
                  name: "Rina",
                  text: "melunasi Listrik PLN",
                  t: "08.12",
                },
                {
                  a: "B",
                  bg: "#F2A24A",
                  c: "#2B1A00",
                  name: "Budi",
                  text: "menambah Telur ke daftar",
                  t: "Kemarin",
                },
                {
                  a: "K",
                  bg: "#5FD18B",
                  c: "#0E2A24",
                  name: "Kakak",
                  text: "selesai buang sampah",
                  t: "Kemarin",
                },
              ].map((row, i, arr) => (
                <div
                  key={row.name}
                  className={`flex items-center gap-2.5 py-2.5 ${i < arr.length - 1 ? "border-b border-[#EEE9DD]" : ""}`}
                >
                  <span
                    className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold"
                    style={{ background: row.bg, color: row.c }}
                  >
                    {row.a}
                  </span>
                  <span className="flex-1 text-[13px] leading-[18px]">
                    <b>{row.name}</b> {row.text}
                    <div className="text-[#5E6863]">{row.t}</div>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Agenda & tugas */}
          <div className="flex flex-col gap-4 rounded-[28px] bg-[#ECEFFA] p-6 min-[621px]:col-span-2 min-[961px]:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-[#3F4F8C]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[22px] w-[22px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
                  <path d="M3.5 10h17M8 3v4M16 3v4" />
                </svg>
              </span>
              <h3 className="font-heading text-[22px] font-bold">Agenda &amp; tugas</h3>
            </div>
            <p className="text-[#45514C]">
              Pengingat H-1, tugas yang bisa berulang, dan centang langsung dari Beranda.
            </p>
            <div className="rounded-[18px] bg-white p-4 text-[#14211E] shadow-[0_1px_2px_rgba(20,33,30,0.06),0_10px_24px_rgba(20,33,30,0.06)]">
              <div className="grid grid-cols-5 gap-1 text-center text-[11px] text-[#5E6863]">
                {[
                  { d: "Sen", n: 12, active: false },
                  { d: "Sel", n: 13, active: true },
                  { d: "Rab", n: 14, active: false },
                  { d: "Kam", n: 15, active: false },
                  { d: "Jum", n: 16, active: false },
                ].map((day) => (
                  <div
                    key={day.d}
                    className={`rounded-[10px] py-1.5 ${day.active ? "bg-[#3F4F8C] text-[#E3E7F6]" : ""}`}
                  >
                    {day.d}
                    <div
                      className={`text-[15px] font-bold ${day.active ? "text-white" : "text-[#14211E]"}`}
                    >
                      {day.n}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex items-center gap-2.5">
                <span className="w-1 self-stretch rounded bg-[#3F4F8C]" />
                <span className="flex-1 text-[13px] leading-[18px]">
                  <b>Imunisasi Adik</b>
                  <div className="text-[#5E6863]">Besok 09.00 · diingatkan hari ini</div>
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#2F7A68] text-white">
                  <Check className="h-[13px] w-[13px]" />
                </span>
                <span className="flex-1 text-[13px] leading-[18px]">
                  <b>Siram tanaman</b>
                  <div className="text-[#5E6863]">Setiap hari</div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
