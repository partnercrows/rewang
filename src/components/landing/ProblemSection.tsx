import { ShoppingBag, ReceiptText, HandCoins, ListChecks } from "lucide-react";

const problems = [
  {
    icon: ShoppingBag,
    title: "Lupa apa yang harus dibeli",
    text: "Sering ke toko tapi tetap ada yang tertinggal.",
  },
  {
    icon: ReceiptText,
    title: "Lupa tagihan yang belum dibayar",
    text: "Takut kena denda karena telat bayar.",
  },
  {
    icon: HandCoins,
    title: "Bingung siapa masih punya utang",
    text: "Sulit mencatat dan mengingat semuanya.",
  },
  {
    icon: ListChecks,
    title: "Pekerjaan rumah berantakan",
    text: "Tidak tahu siapa yang sudah atau belum mengerjakan.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-3xl font-bold tracking-tight text-[#2d4a22] sm:text-4xl">
          Pernah mengalami ini?
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="rounded-2xl border border-[#e8ede6] bg-[#fef9ef]/60 p-6 transition-colors hover:border-[#b5c99a]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#fef3e2]">
                <problem.icon className="h-5 w-5 text-[#c9791f]" />
              </div>
              <h3 className="font-heading text-base font-semibold text-[#2d4a22]">
                {problem.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b7d6a]">{problem.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center font-heading text-xl font-semibold text-[#40916c] sm:text-2xl">
          Rewang membantu semuanya lebih teratur.
        </p>
      </div>
    </section>
  );
}
