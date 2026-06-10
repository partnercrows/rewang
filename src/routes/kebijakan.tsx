import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/landing/Footer";
import { Home, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/kebijakan")({
  component: KebijakanPage,
});

function KebijakanPage() {
  return (
    <div className="min-h-screen bg-[#fef9ef] font-body">
      {/* Simple header — no "Fitur / Harga" links */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-soft border-b border-[#d4e5e0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-2 font-heading text-xl font-bold text-[#2d6a4f]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7d9b76] to-[#52b788] text-white shadow-soft">
                <Home className="h-5 w-5" />
              </div>
              Rewang
            </a>
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-xl border border-[#b5c99a] px-4 py-2 text-sm font-semibold text-[#4a6b5d] transition-all hover:bg-[#e8f5e9] hover:border-[#7d9b76]"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-28 pb-12 sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-20">
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-[#2d4a22] mb-8">
          Kebijakan Privasi
        </h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-[#2d4a22] mt-8 mb-3">
              1. Informasi yang Kami Kumpulkan
            </h2>
            <p className="text-[#6b7d6a] leading-relaxed">
              Rewang mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar dan
              menggunakan aplikasi, seperti nama, alamat email, dan data profil keluarga. Kami juga
              mengumpulkan data penggunaan aplikasi untuk meningkatkan layanan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2d4a22] mt-8 mb-3">
              2. Penggunaan Informasi
            </h2>
            <p className="text-[#6b7d6a] leading-relaxed">
              Informasi yang kami kumpulkan digunakan untuk menyediakan, memelihara, dan meningkatkan
              layanan Rewang. Ini termasuk personalisasi pengalaman pengguna, komunikasi terkait
              layanan, dan analisis penggunaan aplikasi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2d4a22] mt-8 mb-3">
              3. Penyimpanan Data
            </h2>
            <p className="text-[#6b7d6a] leading-relaxed">
              Data Anda disimpan dengan aman menggunakan layanan Supabase yang terenkripsi. Kami
              menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda
              dari akses, penggunaan, atau pengungkapan yang tidak sah.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2d4a22] mt-8 mb-3">
              4. Berbagi Data
            </h2>
            <p className="text-[#6b7d6a] leading-relaxed">
              Kami tidak menjual, memperdagangkan, atau mentransfer informasi pribadi Anda kepada
              pihak ketiga. Data Anda hanya dibagikan dalam lingkup keluarga yang Anda undang ke
              dalam aplikasi Rewang.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2d4a22] mt-8 mb-3">
              5. Hak Pengguna
            </h2>
            <p className="text-[#6b7d6a] leading-relaxed">
              Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda
              kapan saja melalui pengaturan akun di aplikasi. Jika Anda memiliki pertanyaan tentang
              kebijakan privasi ini, silakan hubungi kami melalui WhatsApp di nomor yang tertera.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#2d4a22] mt-8 mb-3">
              6. Perubahan Kebijakan
            </h2>
            <p className="text-[#6b7d6a] leading-relaxed">
              Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan
              diberitahukan melalui aplikasi atau email. Dengan terus menggunakan Rewang setelah
              perubahan, Anda menyetujui kebijakan yang diperbarui.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}