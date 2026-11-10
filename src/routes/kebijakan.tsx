import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

// Satu sumber kebenaran: Kebijakan Privasi ada di halaman statis /privacy-policy.html (yang juga
// ditautkan dari aplikasi Android dan Play Console). Rute lama /kebijakan, yang masih ditautkan dari
// footer, halaman masuk, dan daftar, hanya mengalihkan ke sana supaya tidak ada dua versi teks.
export const Route = createFileRoute("/kebijakan")({
  head: () => ({ meta: [{ title: "Kebijakan Privasi — Rewang" }] }),
  component: KebijakanPage,
});

function KebijakanPage() {
  useEffect(() => {
    window.location.replace("/privacy-policy.html");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fef9ef] font-body px-4">
      <div className="max-w-sm text-center">
        <img src="/rewang.png" alt="Rewang" className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
        <p className="text-[#2d4a22] font-semibold">Membuka Kebijakan Privasi...</p>
        <p className="mt-2 text-sm text-[#6b7d6a]">
          Kalau tidak otomatis terbuka,{" "}
          <a href="/privacy-policy.html" className="underline text-[#2d6a4f] font-medium">
            ketuk di sini
          </a>
          .
        </p>
      </div>
    </div>
  );
}
