import {
  CalendarCheck,
  Receipt,
  ArrowLeftRight,
  ShoppingCart,
  StickyNote,
  ListTodo,
  Utensils,
  Heart,
  Users,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Kelola Agenda & Reminder",
    description: "Atur jadwal keluarga dan pengingat aktivitas penting.",
    color: "bg-[#e8f5e9]",
    iconColor: "text-[#40916c]",
  },
  {
    icon: Receipt,
    title: "Kelola Tagihan & Laporan",
    description: "Pantau tagihan rumah tangga dan laporan pengeluaran.",
    color: "bg-[#e3f0ff]",
    iconColor: "text-[#4a90d9]",
  },
  {
    icon: ArrowLeftRight,
    title: "Kelola Hutang Piutang",
    description: "Catat hutang piutang keluarga dengan lebih rapi.",
    color: "bg-[#fef3e2]",
    iconColor: "text-[#e09f3e]",
  },
  {
    icon: ShoppingCart,
    title: "Kelola Stok Belanja",
    description: "Pantau stok kebutuhan rumah sebelum belanja.",
    color: "bg-[#fce4ec]",
    iconColor: "text-[#ce84ad]",
  },
  {
    icon: StickyNote,
    title: "Kelola Catatan Rumah",
    description: "Simpan catatan penting keluarga dalam satu tempat.",
    color: "bg-[#fff8e7]",
    iconColor: "text-[#c9a83a]",
  },
  {
    icon: ListTodo,
    title: "Kelola Tugas Harian",
    description: "Bagi tugas rumah dan lihat progres aktivitas harian.",
    color: "bg-[#e8f5e9]",
    iconColor: "text-[#52b788]",
  },
  {
    icon: Utensils,
    title: "Kelola Resep",
    description: "Simpan resep favorit agar mudah ditemukan.",
    color: "bg-[#f5eaf0]",
    iconColor: "text-[#b76e8e]",
  },
  {
    icon: Heart,
    title: "Kelola Wishlist",
    description: "Catat kebutuhan dan rencana pembelian keluarga.",
    color: "bg-[#ffeaea]",
    iconColor: "text-[#e07070]",
  },
  {
    icon: Users,
    title: "View Aktivitas Keluarga",
    description: "Lihat aktivitas anggota keluarga dalam satu dashboard.",
    color: "bg-[#e3f0ff]",
    iconColor: "text-[#6a9fd8]",
  },
  {
    icon: ShieldCheck,
    title: "Manajemen Akun",
    description: "Atur anggota keluarga dan keamanan akun.",
    color: "bg-[#e8f5e9]",
    iconColor: "text-[#2d6a4f]",
  },
];

export function FeaturesSection() {
  return (
    <section id="fitur" className="relative py-12 sm:py-16 lg:py-20 bg-white">
      {/* Subtle top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#fef9ef] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block rounded-full border border-[#b5c99a] bg-[#e8f5e9]/50 px-4 py-1 text-sm font-medium text-[#4a6b5d] mb-4">
            Fitur Lengkap
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2d4a22] tracking-tight">
            Semua yang Dibutuhkan
            <span className="block text-[#52b788]">Untuk Rumah Tangga Modern</span>
          </h2>
          <p className="mt-4 text-lg text-[#6b7d6a]">
            Dari agenda hingga wishlist, semua fitur dirancang untuk memudahkan kolaborasi keluarga.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-white border border-[#e8ede6] p-5 sm:p-6 shadow-sm hover:shadow-card hover:border-[#b5c99a] hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-4 transition-transform duration-300 group-hover:scale-110`}
              >
                <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
              </div>
              <h3 className="font-heading text-base font-semibold text-[#2d4a22] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#6b7d6a] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}