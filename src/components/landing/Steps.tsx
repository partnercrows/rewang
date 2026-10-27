export function Steps() {
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="max-w-[640px]">
            <span className="text-[13px] font-extrabold tracking-[0.1em] text-[#22604F]">
              CARA MULAI
            </span>
            <h2 className="font-heading mt-2.5 text-[clamp(32px,4.2vw,52px)] font-extrabold leading-[1.05] tracking-tight">
              Tiga langkah, <span className="text-[#2F7A68]">rumah langsung rapi.</span>
            </h2>
          </div>
          <p className="max-w-[360px] text-lg leading-relaxed text-[#45514C]">
            Tanpa daftar akun baru, tanpa formulir panjang.
          </p>
        </div>

        <ol className="relative mt-11 grid grid-cols-1 gap-5 list-none p-0 min-[861px]:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute hidden border-t-[3px] border-dashed border-[#B9D3CA] min-[861px]:block"
            style={{ left: "16%", right: "16%", top: "31px" }}
          />

          <li className="relative flex flex-col items-start gap-4">
            <span className="flex h-16 w-16 -rotate-[4deg] items-center justify-center rounded-[20px] bg-[#F2A24A] text-[28px] font-extrabold text-[#2B1A00] shadow-[0_0_0_8px_#F8F5EC]">
              1
            </span>
            <div className="flex w-full flex-1 flex-col gap-4 rounded-[26px] bg-white p-6 shadow-[0_1px_2px_rgba(20,33,30,0.05),0_10px_30px_rgba(20,33,30,0.06)]">
              <div>
                <h3 className="font-heading text-[22px] font-bold">Unduh &amp; masuk</h3>
                <p className="mt-1.5 leading-relaxed text-[#45514C]">
                  Pasang dari Google Play dan masuk dengan akun Google Anda.
                </p>
              </div>
              <div className="mt-auto flex min-h-[96px] items-center justify-center rounded-[18px] bg-[#F8F5EC] p-4">
                <div className="flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-[#DAD3C3] bg-white px-4 py-3 text-[15px] font-bold shadow-[0_6px_14px_rgba(20,33,30,0.08)]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-[#22604F]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6" />
                  </svg>
                  Lanjut dengan akun Google
                </div>
              </div>
            </div>
          </li>

          <li className="relative flex flex-col items-start gap-4">
            <span className="flex h-16 w-16 rotate-[3deg] items-center justify-center rounded-[20px] bg-[#B48CE0] text-[28px] font-extrabold text-[#2A1240] shadow-[0_0_0_8px_#F8F5EC]">
              2
            </span>
            <div className="flex w-full flex-1 flex-col gap-4 rounded-[26px] bg-white p-6 shadow-[0_1px_2px_rgba(20,33,30,0.05),0_10px_30px_rgba(20,33,30,0.06)]">
              <div>
                <h3 className="font-heading text-[22px] font-bold">Ajak keluarga</h3>
                <p className="mt-1.5 leading-relaxed text-[#45514C]">
                  Undang pasangan lewat email Google-nya. Data tersinkron di kedua HP.
                </p>
              </div>
              <div className="mt-auto flex min-h-[96px] items-center justify-center gap-3.5 rounded-[18px] bg-[#F8F5EC] p-4">
                <div className="flex flex-col items-center gap-2.5 text-xs">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B48CE0] text-[17px] font-extrabold text-[#2A1240]">
                    R
                  </span>
                  Rina
                </div>
                <div className="flex flex-col items-center gap-1 text-[#2F7A68]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[26px] w-[26px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 9h13l-3-3M20 15H7l3 3" />
                  </svg>
                  <span className="text-[11px] font-bold">tersinkron</span>
                </div>
                <div className="flex flex-col items-center gap-2.5 text-xs">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F2A24A] text-[17px] font-extrabold text-[#2B1A00]">
                    B
                  </span>
                  Budi
                </div>
              </div>
            </div>
          </li>

          <li className="relative flex flex-col items-start gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#2F7A68] text-[28px] font-extrabold text-white shadow-[0_0_0_8px_#F8F5EC]">
              3
            </span>
            <div className="flex w-full flex-1 flex-col gap-4 rounded-[26px] bg-white p-6 shadow-[0_1px_2px_rgba(20,33,30,0.05),0_10px_30px_rgba(20,33,30,0.06)]">
              <div>
                <h3 className="font-heading text-[22px] font-bold">Catat &amp; tenang</h3>
                <p className="mt-1.5 leading-relaxed text-[#45514C]">
                  Catat stok, tagihan, dan agenda. Rewang mengingatkan sebelum ada yang terlewat.
                </p>
              </div>
              <div className="mt-auto flex min-h-[96px] items-center justify-center rounded-[18px] bg-[#F8F5EC] p-4">
                <div className="flex w-full items-start gap-2.5 rounded-[14px] bg-white px-3 py-2.5 shadow-[0_6px_14px_rgba(20,33,30,0.08)]">
                  <img src="/rewang.png" alt="" className="h-8 w-8 flex-shrink-0 rounded-[9px]" />
                  <span className="flex-1 text-[13px] leading-[18px] text-[#14211E]">
                    <span className="flex justify-between gap-2">
                      <b>Rewang</b>
                      <span className="text-[#5E6863]">sekarang</span>
                    </span>
                    Gas LPG hampir habis. Masukkan ke daftar belanja?
                  </span>
                </div>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
