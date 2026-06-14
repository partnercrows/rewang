import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  Check,
  Zap,
  Star,
  ShieldAlert,
  ArrowRight,
  Clock,
  AlertTriangle,
  LogOut,
} from "lucide-react";

export const Route = createFileRoute("/aktivasi")({
  component: AktivasiPage,
});

const plans = [
  {
    name: "Starter",
    price: "15.000",
    period: "bulan",
    description: "Cocok untuk pasangan muda atau keluarga kecil.",
    popular: false,
    gradient: "from-white to-[#fef9ef]",
    border: "border-[#e8ede6]",
    buttonStyle:
      "border-2 border-[#b5c99a] text-[#4a6b5d] hover:bg-[#e8f5e9] hover:border-[#7d9b76]",
    features: [
      "Agenda dan reminder keluarga",
      "Catatan rumah bersama",
      "Tugas harian (max 5/hari)",
      "Stok belanja dasar",
      "Resep favorit (max 10)",
      "1 anggota keluarga",
    ],
  },
  {
    name: "Family",
    price: "35.000",
    period: "bulan",
    description: "Untuk keluarga yang ingin semua fitur lengkap.",
    popular: true,
    gradient: "from-[#e8f5e9] to-[#d4edda]",
    border: "border-[#52b788]",
    buttonStyle:
      "bg-gradient-to-r from-[#52b788] to-[#40916c] text-white shadow-soft hover:shadow-lg hover:-translate-y-0.5",
    features: [
      "Semua fitur Starter",
      "Tagihan dan laporan pengeluaran",
      "Hutang piutang keluarga",
      "Tugas harian unlimited",
      "Resep unlimited",
      "Wishlist keluarga",
      "Dashboard aktivitas keluarga",
      "Hingga 6 anggota keluarga",
      "Akses penuh semua fitur",
    ],
  },
];

function getWaUrl(planName?: string) {
  const base = "https://wa.me/6281311474713";
  const text = planName
    ? `Halo Admin Rewang %F0%9F%91%8B%0A%0ASaya ingin berlangganan Paket ${planName} untuk penggunaan Rewang App.%0A%0AMohon informasi mengenai proses pembayaran dan aktivasi akun.%0A%0ATerima kasih %F0%9F%98%8A`
    : "Halo Admin Rewang %F0%9F%91%8B%0A%0ASaya tertarik dengan Rewang App dan ingin informasi lebih lanjut mengenai paket langganan yang tersedia.%0A%0ATerima kasih %F0%9F%98%8A";
  return `${base}?text=${text}`;
}

function AktivasiPage() {
  const { session, profile, loading, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    // Redirect to landing page after logout
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (profile?.is_active && profile?.subscription_tier !== "none") {
    return <Navigate to="/app" replace />;
  }

  const tier = (profile?.subscription_tier as string) || "none";
  const expiresAt = profile?.subscription_expires_at;
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  let statusBadge: {
    icon: React.ReactNode;
    text: string;
    color: string;
  };
  if (!profile?.is_active) {
    statusBadge = {
      icon: <ShieldAlert className="h-5 w-5" />,
      text: "Akun Belum Diaktivasi",
      color: "bg-red-100 text-red-700 border-red-200",
    };
  } else if (isExpired) {
    statusBadge = {
      icon: <Clock className="h-5 w-5" />,
      text: `Langganan Berakhir: ${new Date(expiresAt!).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
      color: "bg-amber-100 text-amber-700 border-amber-200",
    };
  } else {
    statusBadge = {
      icon: <AlertTriangle className="h-5 w-5" />,
      text: "Pilih Paket Langganan",
      color: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }

  return (
    <div className="min-h-screen bg-[#fef9ef] font-body">
      <div className="sticky top-0 z-10 border-b border-[#e8ede6] bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <span className="text-sm text-[#9db5a6]">{profile?.email}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#e8ede6] bg-white px-4 py-2 text-sm font-medium text-[#4a6b5d] hover:bg-[#e8f5e9] hover:border-[#52b788] transition-all"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <section className="relative py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium mb-6 ${statusBadge.color}`}
            >
              {statusBadge.icon}
              {statusBadge.text}
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2d4a22] tracking-tight">
              Aktifkan Akses
              <span className="block text-[#52b788]">Rewang App</span>
            </h1>
            <p className="mt-4 text-lg text-[#6b7d6a] leading-relaxed">
              Pilih paket langganan yang sesuai dengan kebutuhan keluarga Anda.
              Setelah berlangganan, admin akan mengaktifkan akun Anda.
            </p>
          </div>
        </div>
      </section>

      {tier !== "none" && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mb-6">
          <div className="rounded-xl border-2 border-[#b5c99a] bg-white p-4 text-center">
            <p className="text-sm text-[#4a6b5d]">
              Paket Anda saat ini:{" "}
              <span className="font-semibold capitalize">{tier}</span>
              {expiresAt && !isExpired && (
                <span>
                  {" "}
                  — Aktif hingga{" "}
                  {new Date(expiresAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      <section className="relative py-6 sm:py-10 lg:py-14">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #fef9ef 0%, #ffffff 30%, #e8f4f8 70%, #ffffff 100%)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b5c99a] bg-white/70 px-4 py-1 text-sm font-medium text-[#4a6b5d] mb-4">
              <Zap className="h-4 w-4 text-[#e09f3e]" />
              Harga Terjangkau
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2d4a22] tracking-tight">
              Pilih Paket yang
              <span className="block text-[#52b788]">Sesuai Kebutuhan</span>
            </h2>
            <p className="mt-4 text-lg text-[#6b7d6a]">
              Mulai dengan paket yang sesuai, upgrade kapan saja seiring
              kebutuhan keluarga.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl bg-gradient-to-b ${plan.gradient} ${plan.border} border-2 p-8 sm:p-10 shadow-soft hover:shadow-card transition-all duration-300 ${
                  plan.popular ? "scale-[1.02] lg:scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#52b788] to-[#40916c] px-5 py-1.5 text-xs font-bold text-white shadow-lg">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      PALING POPULER
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="font-heading text-xl font-bold text-[#2d4a22]">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-[#6b7d6a] mt-1">
                    {plan.description}
                  </p>
                  <div className="mt-6 flex items-baseline justify-center gap-1">
                    <span className="text-sm text-[#6b7d6a]">Rp</span>
                    <span className="font-heading text-5xl font-extrabold text-[#2d4a22]">
                      {plan.price}
                    </span>
                    <span className="text-sm text-[#6b7d6a]">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <Check
                          className={`h-5 w-5 ${
                            plan.popular ? "text-[#40916c]" : "text-[#7d9b76]"
                          }`}
                        />
                      </div>
                      <span className="text-sm text-[#4a6b5d] leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={getWaUrl(plan.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full text-center rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all duration-300 ${plan.buttonStyle}`}
                >
                  Berlangganan {plan.name}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 space-y-3">
            <p className="text-sm text-[#9db5a6]">
              Butuh bantuan memilih?{" "}
              <a
                href={getWaUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#52b788] font-semibold hover:underline"
              >
                Hubungi kami via WhatsApp
              </a>
            </p>
            <p className="text-xs text-[#b5c5ae]">
              Setelah berlangganan, admin akan mengaktifkan akun Anda dalam
              1x24 jam.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
