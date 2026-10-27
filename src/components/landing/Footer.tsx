import { getWaAccessUrl } from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="border-t border-[#EDE7DA] py-7 pb-10">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-4 text-[15px] text-[#45514C] sm:px-10">
        <div className="flex items-center gap-2.5">
          <img
            src="/rewang.png"
            alt="Logo Rewang"
            width={32}
            height={32}
            draggable={false}
            className="h-8 w-8 rounded-[9px]"
          />
          <b className="font-heading text-[#14211E]">Rewang</b> · © 2026
        </div>
        <div className="flex flex-wrap gap-x-[22px] gap-y-2">
          <a href="/kebijakan" className="hover:text-[#22604F]">
            Kebijakan Privasi
          </a>
          <a
            href={getWaAccessUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#22604F]"
          >
            Hubungi kami via WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
