import { Smartphone, NotebookPen, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Smartphone,
    title: "Buka Rewang",
    text: "Mulai gunakan aplikasi di HP Anda.",
  },
  {
    number: "02",
    icon: NotebookPen,
    title: "Catat kebutuhan rumah",
    text: "Belanja, tagihan, utang, dan tugas rumah.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Semua lebih teratur",
    text: "Lebih sedikit yang perlu diingat.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-3xl font-bold tracking-tight text-[#2d4a22] sm:text-4xl">
          Mulai dalam tiga langkah
        </h2>

        <div className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f5e9]">
                <step.icon className="h-7 w-7 text-[#40916c]" />
              </div>
              <span className="mt-4 block font-heading text-sm font-bold tracking-wide text-[#b5c99a]">
                {step.number}
              </span>
              <h3 className="mt-1 font-heading text-lg font-semibold text-[#2d4a22]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b7d6a]">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
