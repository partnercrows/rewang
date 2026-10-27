import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getWaAccessUrl } from "@/lib/whatsapp";

const faqs = [
  {
    q: "Apakah data saya aman?",
    a: "Ya. Data Anda disimpan di Google Sheets di Google Drive milik Anda sendiri, bukan di server Rewang. Anda bisa melihat, mencadangkan, atau menghapusnya kapan saja.",
  },
  {
    q: "Bisa dipakai berdua dengan pasangan?",
    a: "Bisa. Undang lewat email Google pasangan dari menu Akun. Semua catatan tersinkron, dan riwayat aktivitas menunjukkan siapa mencatat apa.",
  },
  {
    q: "Perlu internet terus?",
    a: "Tidak. Rewang tetap bisa dipakai tanpa sinyal, lalu tersinkron otomatis begitu HP tersambung lagi.",
  },
  {
    q: "Apakah gratis?",
    a: "Ya, Rewang gratis diunduh dan dipakai: stok, belanja, resep, agenda, tugas, dan koleksi kartu. Fitur keuangan lengkap bisa Anda lihat langsung di dalam aplikasi.",
  },
  {
    q: "Ada versi iPhone?",
    a: "Saat ini Rewang tersedia untuk Android melalui Google Play.",
  },
];

export function FAQ() {
  return (
    <section id="tanya" className="py-[clamp(48px,7vw,96px)]">
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-[clamp(28px,5vw,72px)] px-4 sm:px-10 min-[861px]:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div>
          <span className="text-[13px] font-extrabold tracking-[0.1em] text-[#22604F]">
            TANYA JAWAB
          </span>
          <h2 className="font-heading mt-2.5 text-[clamp(32px,4.2vw,52px)] font-extrabold leading-[1.05] tracking-tight">
            Masih ragu? <span className="text-[#2F7A68]">Tanya saja.</span>
          </h2>
          <p className="mt-3.5 text-lg leading-relaxed text-[#45514C]">
            Pertanyaan yang paling sering kami terima dari keluarga pengguna Rewang.
          </p>
          <a
            href={getWaAccessUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex max-w-[340px] items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 text-[#14211E] shadow-[0_1px_2px_rgba(20,33,30,0.05)]"
          >
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-[#5FD18B] text-[#0E2A24]">
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
            </span>
            <span className="text-[15px] leading-5">
              <b>Belum terjawab?</b>
              <br />
              <span className="text-[#45514C]">Hubungi kami via WhatsApp</span>
            </span>
          </a>
        </div>

        <Accordion type="single" collapsible className="flex flex-col gap-3">
          {faqs.map((f) => (
            <AccordionItem
              key={f.q}
              value={f.q}
              className="rounded-[18px] border-0 bg-white px-5 shadow-[0_1px_2px_rgba(20,33,30,0.05)]"
            >
              <AccordionTrigger className="min-h-[60px] py-0 text-[17px] font-bold text-[#14211E] hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-[18px] text-base leading-relaxed text-[#45514C]">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
