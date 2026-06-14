import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useEffect } from "react";
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
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/admin-rewang-control")({
  component: AdminRewangControlPage,
  errorComponent: ({ error, reset }) => (
    <div className="flex min-h-screen items-center justify-center bg-[#fef9ef]">
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center max-w-md">
        <XCircle className="mx-auto h-8 w-8 text-red-400 mb-2" />
        <p className="text-red-600 font-medium">Halaman gagal dimuat</p>
        <p className="text-sm text-red-500 mt-1">
          {error instanceof Error ? error.message : "Ada yang salah. Coba muat ulang."}
        </p>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#52b788] px-4 py-2 text-sm font-semibold text-white hover:bg-[#40916c] transition-all"
        >
          Coba muat ulang
        </button>
      </div>
    </div>
  ),
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

type SortDirection = "asc" | "desc" | null;

// ---------------------------------------------------------------------------
// Outer page component — minimal hooks, handles auth & routing
// ---------------------------------------------------------------------------
export default function AdminRewangControlPage() {
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect non-admin users to /app
  useEffect(() => {
    if (!authLoading && (!session || profile?.role !== "admin")) {
      navigate({ to: "/app" });
    }
  }, [authLoading, session, profile, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || profile?.role !== "admin") {
    return null;
  }

  // Admin verified — render the full admin panel in a child component
  // so that hooks inside AdminPanelContent are never conditionally skipped.
  return <AdminPanelContent session={session} profile={profile} />;
}

// ---------------------------------------------------------------------------
// Inner admin panel — all heavy hooks live here, always rendered for admins
// ---------------------------------------------------------------------------
function AdminPanelContent({
  session,
  profile,
}: {
  session: { user: { id: string } };
  profile: {
    id: string;
    role?: string | null;
    email?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    is_active?: boolean | null;
    subscription_tier?: string | null;
    subscription_expires_at?: string | null;
  };
}) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [touchedUsers, setTouchedUsers] = useState<Map<string, EditableUser>>(
    new Map(),
  );
  const [savingUsers, setSavingUsers] = useState<Set<string>>(new Set());

  const [sortExpired, setSortExpired] = useState<SortDirection>(null);
  const [sortStatus, setSortStatus] = useState<SortDirection>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
        toast.error(`Gagal menyimpan: ${error.message}`);
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

  const toggleSort = (column: "expired" | "status") => {
    if (column === "expired") {
      if (sortExpired === null) setSortExpired("asc");
      else if (sortExpired === "asc") setSortExpired("desc");
      else {
        setSortExpired(null);
        setCurrentPage(1);
      }
    } else {
      if (sortStatus === null) setSortStatus("asc");
      else if (sortStatus === "asc") setSortStatus("desc");
      else {
        setSortStatus(null);
        setCurrentPage(1);
      }
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column: "expired" | "status") => {
    const sortVal = column === "expired" ? sortExpired : sortStatus;
    if (sortVal === null) return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
    if (sortVal === "asc") return <ChevronUp className="h-4 w-4" />;
    return <ChevronDown className="h-4 w-4" />;
  };

  const exportToXLSX = async () => {
    if (!users) return;

    const exportData = users.map((user) => ({
      Email: user.email || "",
      Nama: user.full_name || "Tanpa Nama",
      Role: user.role || "user",
      Status: user.is_active ? "Aktif" : "Nonaktif",
      Tier: user.subscription_tier || "none",
      Expired: user.subscription_expires_at
        ? new Date(user.subscription_expires_at).toLocaleDateString("id-ID")
        : "-",
    }));

    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");
      XLSX.writeFile(wb, `rewang-users-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Data berhasil diexport!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Gagal export data");
    }
  };

  const isDirty = (userId: string) => touchedUsers.has(userId);

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((u) => {
      const matchesSearch =
        !search ||
        (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.full_name ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && u.role === "admin") ||
        (roleFilter === "user" && u.role !== "admin");

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];

    if (sortStatus !== null) {
      sorted.sort((a, b) => {
        const aActive = a.is_active ?? false;
        const bActive = b.is_active ?? false;
        return sortStatus === "asc"
          ? (aActive === bActive ? 0 : aActive ? -1 : 1)
          : aActive === bActive ? 0 : aActive ? 1 : -1;
      });
    }

    if (sortExpired !== null) {
      sorted.sort((a, b) => {
        const aDate = a.subscription_expires_at
          ? new Date(a.subscription_expires_at).getTime()
          : 0;
        const bDate = b.subscription_expires_at
          ? new Date(b.subscription_expires_at).getTime()
          : 0;
        return sortExpired === "asc" ? aDate - bDate : bDate - aDate;
      });
    }

    return sorted;
  }, [filteredUsers, sortStatus, sortExpired]);

  const totalUsers = sortedUsers.length;
  const totalPages = Math.ceil(totalUsers / pageSize);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: "all" | "admin" | "user") => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const tierOptions = [
    { value: "none", label: "None", color: "bg-gray-100 text-gray-700" },
    { value: "starter", label: "Starter", color: "bg-amber-100 text-amber-700" },
    { value: "family", label: "Family", color: "bg-green-100 text-green-700" },
  ];

  const getTierCardStyle = (tier: string) => {
    switch (tier) {
      case "family":
        return "from-green-50 to-emerald-100 border-emerald-300";
      case "starter":
        return "from-amber-50 to-orange-100 border-amber-300";
      default:
        return "from-gray-50 to-slate-100 border-gray-300";
    }
  };

  // Double-guard: redirect non-admin who somehow bypassed the outer check
  if (profile.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fef9ef] font-body">
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center max-w-md shadow-soft">
          <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-red-100 mb-4">
            <Lock className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="font-heading text-xl font-bold text-red-700 mb-2">
            403 — Akses Ditolak
          </h2>
          <p className="text-sm text-red-600 mb-6">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-xl bg-[#52b788] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#40916c] transition-all shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Aplikasi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fef9ef] font-body">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-10 border-b border-[#e8ede6] bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
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

            {/* ── Action buttons ── */}
            <div className="flex items-center gap-2">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-xl border border-[#e8ede6] bg-white px-4 py-2 text-sm font-semibold text-[#6b7d6a] hover:bg-[#faf8f3] transition-all shadow-soft"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Aplikasi
              </Link>
              <button
                onClick={exportToXLSX}
                className="inline-flex items-center gap-2 rounded-xl bg-[#52b788] px-4 py-2 text-sm font-semibold text-white hover:bg-[#40916c] transition-all shadow-soft"
              >
                <Download className="h-4 w-4" />
                Export XLSX
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9db5a6]" />
            <input
              type="text"
              placeholder="Cari berdasarkan email atau nama..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border-2 border-[#e8ede6] bg-white py-2.5 pl-10 pr-4 text-sm text-[#2d4a22] placeholder:text-[#b5c5ae] focus:border-[#52b788] focus:outline-none focus:ring-2 focus:ring-[#52b788]/20 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilterChange(e.target.value as "all" | "admin" | "user")}
            className="rounded-xl border-2 border-[#e8ede6] bg-white py-2.5 px-4 text-sm text-[#2d4a22] focus:border-[#52b788] focus:outline-none focus:ring-2 focus:ring-[#52b788]/20 transition-all cursor-pointer"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* Summary cards — fixed text colors */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {tierOptions.map((t) => {
            const count = users?.filter(
              (u) => (u.subscription_tier ?? "none") === t.value,
            )?.length ?? 0;
            return (
              <div
                key={t.value}
                className={`rounded-xl bg-gradient-to-br ${getTierCardStyle(t.value)} border p-4 text-center shadow-soft`}
              >
                <div className="inline-block rounded-full px-3 py-1 text-xs font-medium mb-2 bg-white/70 text-[#2d4a22]">
                  {t.label}
                </div>
                <div className="text-2xl font-bold text-[#2d4a22] drop-shadow-sm">
                  {isLoading ? "…" : count}
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
          <>
            {/* Users Table */}
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
                    <th
                      className="px-4 py-3 font-medium text-[#6b7d6a] cursor-pointer hover:bg-[#f0ede6] transition-colors select-none"
                      onClick={() => toggleSort("status")}
                    >
                      <div className="flex items-center gap-1">
                        Status Aktif
                        {getSortIcon("status")}
                      </div>
                    </th>
                    <th className="px-4 py-3 font-medium text-[#6b7d6a]">
                      Tier
                    </th>
                    <th
                      className="px-4 py-3 font-medium text-[#6b7d6a] cursor-pointer hover:bg-[#f0ede6] transition-colors select-none"
                      onClick={() => toggleSort("expired")}
                    >
                      <div className="flex items-center gap-1">
                        Expired
                        {getSortIcon("expired")}
                      </div>
                    </th>
                    <th className="px-4 py-3 font-medium text-[#6b7d6a]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ede6]">
                  {paginatedUsers.map((user) => {
                    const editable = getEditableUser(user);
                    const dirty = isDirty(user.id);
                    const saving = savingUsers.has(user.id);

                    const isExpiredDisabled =
                      editable.subscription_tier === "none" || !editable.is_active;

                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors ${dirty ? "bg-[#f0faf2]" : ""}`}
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
                                  {user.email || "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}
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
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${editable.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
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
                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#52b788]/30 ${editable.subscription_tier === "family" ? "bg-green-100 border-green-300 text-green-700" : editable.subscription_tier === "starter" ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-gray-100 border-gray-200 text-gray-700"}`}
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
                            disabled={isExpiredDisabled}
                            className={`rounded-lg border px-2.5 py-1.5 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#52b788]/30 ${isExpiredDisabled ? "bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed" : editable.subscription_expires_at ? "bg-white border-gray-200 text-gray-900" : "bg-gray-50 border-gray-100 text-gray-400"}`}
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

              {(!paginatedUsers || paginatedUsers.length === 0) && (
                <div className="py-12 text-center">
                  <p className="text-[#9db5a6]">
                    {search || roleFilter !== "all"
                      ? "Tidak ada hasil pencarian."
                      : "Belum ada pengguna."}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalUsers > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-[#e8ede6] p-4">
                <div className="flex items-center gap-2 text-sm text-[#6b7d6a]">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="rounded-lg border border-[#e8ede6] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]/20"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>
                    of {totalUsers} entries
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#6b7d6a]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#e8ede6] text-[#6b7d6a] hover:bg-[#faf8f3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? "bg-[#52b788] text-white" : "border border-[#e8ede6] text-[#6b7d6a] hover:bg-[#faf8f3]"}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#e8ede6] text-[#6b7d6a] hover:bg-[#faf8f3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}