const fs = require("fs");
const path = require("path");

const aktivasiContent = `import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
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

function AktivasiPage() {
  const { session, profile, loading } = useAuth();

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
      text: \`Langganan Berakhir: \${new Date(expiresAt!).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}\`,
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
            <Link
              to="/"
              className="text-sm font-medium text-[#4a6b5d] hover:text-[#2d4a22] transition-colors"
            >
              \u2190 Kembali ke Beranda
            </Link>
            <span className="text-sm text-[#9db5a6]">{profile?.email}</span>
          </div>
        </div>
      </div>

      <section className="relative py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div
              className={\`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium mb-6 \${statusBadge.color}\`}
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
                  \u2014 Aktif hingga{" "}
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
                className={\`relative rounded-3xl bg-gradient-to-b \${plan.gradient} \${plan.border} border-2 p-8 sm:p-10 shadow-soft hover:shadow-card transition-all duration-300 \${
                  plan.popular ? "scale-[1.02] lg:scale-105" : ""
                }\`}
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
                          className={\`h-5 w-5 \${
                            plan.popular ? "text-[#40916c]" : "text-[#7d9b76]"
                          }\`}
                        />
                      </div>
                      <span className="text-sm text-[#4a6b5d] leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href="https://wa.me/6281311474713"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={\`flex items-center justify-center gap-2 w-full text-center rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all duration-300 \${plan.buttonStyle}\`}
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
                href="https://wa.me/6281311474713"
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
`;

const adminContent = `import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  Save,
  Undo2,
  User,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/admin-rewang-control")({
  component: AdminRewangControlPage,
});

interface ProfileRow {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  is_active?: boolean | null;
  subscription_tier?: string | null;
  subscription_expires_at?: string | null;
}

interface EditableUser {
  userId: string;
  is_active: boolean;
  subscription_tier: string;
  subscription_expires_at: string;
}

function AdminRewangControlPage() {
  const { session, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [touchedUsers, setTouchedUsers] = useState<Map<string, EditableUser>>(
    new Map(),
  );
  const [savingUsers, setSavingUsers] = useState<Set<string>>(new Set());

  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, avatar_url, role, is_active, subscription_tier, subscription_expires_at",
        )
        .order("email", { ascending: true });

      if (error) throw error;
      return data as ProfileRow[];
    },
    enabled: !!session && profile?.role === "admin",
  });

  const getEditableUser = useCallback(
    (user: ProfileRow): EditableUser => {
      const touched = touchedUsers.get(user.id);
      if (touched) return touched;
      return {
        userId: user.id,
        is_active: user.is_active ?? false,
        subscription_tier: user.subscription_tier ?? "none",
        subscription_expires_at: user.subscription_expires_at ?? "",
      };
    },
    [touchedUsers],
  );

  const updateUser = useCallback(
    (
      userId: string,
      patch: Partial<Omit<EditableUser, "userId">>,
    ) => {
      setTouchedUsers((prev) => {
        const next = new Map(prev);
        const base = users?.find((u) => u.id === userId);
        const current = next.get(userId) ??
          (base
            ? {
              userId,
              is_active: base.is_active ?? false,
              subscription_tier: base.subscription_tier ?? "none",
              subscription_expires_at: base.subscription_expires_at ?? "",
            }
            : {
              userId,
              is_active: false,
              subscription_tier: "none",
              subscription_expires_at: "",
            });
        next.set(userId, { ...current, ...patch });
        return next;
      });
    },
    [users],
  );

  const saveUser = useCallback(
    async (userId: string) => {
      const touched = touchedUsers.get(userId);
      if (!touched) return;

      setSavingUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: touched.is_active,
          subscription_tier: touched.subscription_tier,
          subscription_expires_at: touched.subscription_expires_at || null,
        })
        .eq("id", userId);

      if (error) {
        toast.error(\`Gagal menyimpan: \${error.message}\`);
      } else {
        toast.success("Perubahan disimpan!");
        setTouchedUsers((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      }

      setSavingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    },
    [touchedUsers, queryClient],
  );

  const resetUser = useCallback(
    (userId: string) => {
      setTouchedUsers((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    },
    [],
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const isDirty = (userId: string) => touchedUsers.has(userId);

  const filteredUsers = users?.filter(
    (u) =>
      !search ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const tierOptions = [
    { value: "none", label: "None", color: "bg-gray-100 text-gray-700" },
    { value: "starter", label: "Starter", color: "bg-amber-100 text-amber-700" },
    { value: "family", label: "Family", color: "bg-green-100 text-green-700" },
  ];

  return (
    <div className="min-h-screen bg-[#fef9ef] font-body">
      <div className="sticky top-0 z-10 border-b border-[#e8ede6] bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#e8f5e9]">
              <Shield className="h-5 w-5 text-[#40916c]" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-[#2d4a22]">
                Admin Rewang Control
              </h1>
              <p className="text-sm text-[#9db5a6]">
                Kelola subscription dan akses pengguna
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9db5a6]" />
          <input
            type="text"
            placeholder="Cari berdasarkan email atau nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-2 border-[#e8ede6] bg-white py-2.5 pl-10 pr-4 text-sm text-[#2d4a22] placeholder:text-[#b5c5ae] focus:border-[#52b788] focus:outline-none focus:ring-2 focus:ring-[#52b788]/20 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {tierOptions.map((t) => {
            const count = users?.filter(
              (u) => (u.subscription_tier ?? "none") === t.value,
            ).length ?? 0;
            return (
              <div
                key={t.value}
                className="rounded-xl bg-white border border-[#e8ede6] p-4 text-center"
              >
                <div
                  className={\`inline-block rounded-full px-3 py-1 text-xs font-medium mb-2 \${t.color}\`}
                >
                  {t.label}
                </div>
                <div className="text-2xl font-bold text-[#2d4a22]">
                  {isLoading ? "\u2026" : count}
                </div>
              </div>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#52b788]" />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600 font-medium">
              Gagal memuat data: {(error as Error).message}
            </p>
          </div>
        )}

        {users && !isLoading && (
          <div className="overflow-x-auto rounded-2xl border border-[#e8ede6] bg-white shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8ede6] bg-[#faf8f3] text-left">
                  <th className="px-4 py-3 font-medium text-[#6b7d6a]">
                    Pengguna
                  </th>
                  <th className="px-4 py-3 font-medium text-[#6b7d6a]">
                    Role
                  </th>
                  <th className="px-4 py-3 font-medium text-[#6b7d6a]">
                    Status Aktif
                  </th>
                  <th className="px-4 py-3 font-medium text-[#6b7d6a]">
                    Tier
                  </th>
                  <th className="px-4 py-3 font-medium text-[#6b7d6a]">
                    Expired
                  </th>
                  <th className="px-4 py-3 font-medium text-[#6b7d6a]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ede6]">
                {filteredUsers?.map((user) => {
                  const editable = getEditableUser(user);
                  const dirty = isDirty(user.id);
                  const saving = savingUsers.has(user.id);

                  return (
                    <tr
                      key={user.id}
                      className={\`transition-colors \${dirty ? "bg-[#f0faf2]" : ""}\`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#e8f5e9] flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.avatar_url
                              ? (
                                <img
                                  src={user.avatar_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )
                              : (
                                <User className="h-4 w-4 text-[#7d9b76]" />
                              )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#2d4a22] truncate">
                              {user.full_name || "Tanpa Nama"}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-[#9db5a6]">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">
                                {user.email || "\u2014"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={\`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium \${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}\`}
                        >
                          {user.role || "user"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            updateUser(user.id, {
                              is_active: !editable.is_active,
                            })}
                          className={\`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all \${editable.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}\`}
                        >
                          {editable.is_active
                            ? <CheckCircle className="h-3.5 w-3.5" />
                            : <XCircle className="h-3.5 w-3.5" />}
                          {editable.is_active ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={editable.subscription_tier}
                          onChange={(e) =>
                            updateUser(user.id, {
                              subscription_tier: e.target.value,
                            })}
                          className={\`rounded-lg border px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#52b788]/30 \${editable.subscription_tier === "family" ? "bg-green-100 border-green-300 text-green-700" : editable.subscription_tier === "starter" ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-gray-100 border-gray-200 text-gray-700"}\`}
                        >
                          {tierOptions.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={editable.subscription_expires_at
                            ? editable.subscription_expires_at.slice(0, 10)
                            : ""}
                          onChange={(e) =>
                            updateUser(user.id, {
                              subscription_expires_at: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : "",
                            })}
                          className={\`rounded-lg border px-2.5 py-1.5 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#52b788]/30 \${editable.subscription_expires_at ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 text-gray-400"}\`}
                        />
                      </td>

                      <td className="px-4 py-3">
                        {dirty && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => saveUser(user.id)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#52b788] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#40916c] transition-colors disabled:opacity-50"
                            >
                              {saving
                                ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                )
                                : <Save className="h-3.5 w-3.5" />}
                              Simpan
                            </button>
                            <button
                              onClick={() => resetUser(user.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#e8ede6] px-2.5 py-1.5 text-xs text-[#9db5a6] hover:bg-gray-50 transition-colors"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {(!filteredUsers || filteredUsers.length === 0) && (
              <div className="py-12 text-center">
                <p className="text-[#9db5a6]">
                  {search ? "Tidak ada hasil pencarian." : "Belum ada pengguna."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
`;

const routesDir = path.join(__dirname, "..", "src", "routes");
fs.writeFileSync(path.join(routesDir, "aktivasi.tsx"), aktivasiContent, "utf8");
fs.writeFileSync(path.join(routesDir, "admin-rewang-control.tsx"), adminContent, "utf8");
console.log("Files written successfully");