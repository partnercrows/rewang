export function ClosingCTA() {
  return (
    <section className="pb-[clamp(48px,7vw,96px)]">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] bg-[#17362F] p-[clamp(28px,5vw,56px)] text-white">
          <div className="flex flex-1 basis-[340px] items-center gap-[18px]">
            <img
              src="/rewang.png"
              alt="Logo Rewang"
              width={80}
              height={80}
              draggable={false}
              className="h-20 w-20 rounded-[22px]"
            />
            <h2 className="font-heading text-[clamp(26px,3vw,38px)] font-bold leading-[1.15]">
              Mulai rapikan urusan rumah hari ini
            </h2>
          </div>
          <a
            href="#"
            className="inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl bg-[#F2C94C] px-6 text-base font-bold text-[#17362F]"
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
        </div>
      </div>
    </section>
  );
}
