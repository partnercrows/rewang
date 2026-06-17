import { createFileRoute, Link } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { initials, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, Filter, X, RotateCcw, Lock } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export const Route = createFileRoute("/app/feed")({
  head: () => ({ meta: [{ title: "Feed — Rewang" }] }),
  component: FeedPage,
});

// --- category config ---
type CategoryKey = "finance" | "agenda" | "stock" | "tasks" | "other";

const CATEGORY_CONFIG: Record<
  CategoryKey,
  { icon: string; label: { id: string; en: string }; color: { bg: string; fg: string; iconBg: string } }
> = {
  finance: {
    icon: "💸",
    label: { id: "Keuangan", en: "Finance" },
    color: { bg: "bg-red-50 dark:bg-red-950/30", fg: "text-red-700 dark:text-red-300", iconBg: "bg-red-100 dark:bg-red-900/40" },
  },
  agenda: {
    icon: "📅",
    label: { id: "Agenda", en: "Agenda" },
    color: { bg: "bg-amber-50 dark:bg-amber-950/30", fg: "text-amber-700 dark:text-amber-300", iconBg: "bg-amber-100 dark:bg-amber-900/40" },
  },
  stock: {
    icon: "📦",
    label: { id: "Stok", en: "Stock" },
    color: { bg: "bg-emerald-50 dark:bg-emerald-950/30", fg: "text-emerald-700 dark:text-emerald-300", iconBg: "bg-emerald-100 dark:bg-emerald-900/40" },
  },
  tasks: {
    icon: "✅",
    label: { id: "Tugas", en: "Tasks" },
    color: { bg: "bg-blue-50 dark:bg-blue-950/30", fg: "text-blue-700 dark:text-blue-300", iconBg: "bg-blue-100 dark:bg-blue-900/40" },
  },
  other: {
    icon: "🔔",
    label: { id: "Lainnya", en: "Other" },
    color: { bg: "bg-slate-50 dark:bg-slate-800/40", fg: "text-slate-600 dark:text-slate-300", iconBg: "bg-slate-100 dark:bg-slate-700/40" },
  },
};

function getCategory(entityType: string | null, actionType: string | null): CategoryKey {
  const t = (entityType ?? "").toLowerCase();
  const a = (actionType ?? "").toLowerCase();
  if (t === "bill" || t === "debt" || t === "credit" || t === "kolektif" || a === "pay" || a === "debt" || a === "credit") return "finance";
  if (t === "agenda" || t === "event" || a === "agenda" || a === "event") return "agenda";
  if (t === "stock" || t === "shopping_item" || t === "shopping" || a === "stock" || a === "shopping") return "stock";
  if (t === "task" || t === "chore" || t === "daily_task" || a === "task" || a === "chore" || a === "complete_task") return "tasks";
  return "other";
}

function FeedPage() {
  const { family } = useAuth();
  const { lang, T } = useLang();
  const limits = useSubscriptionGate();
  const familyId = family?.id;
  const qc = useQueryClient();

  // Paywall untuk user starter — tidak bisa akses feed
  if (!limits.canAccessFeed) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold mb-2">{T("Fitur Premium", "Premium Feature")}</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {T(
              "Feed aktivitas tersedia untuk paket Family. Upgrade sekarang untuk melihat semua aktivitas anggota keluarga.",
              "Activity feed is available for Family plan. Upgrade now to see all family member activities."
            )}
          </p>
          <Button asChild className="rounded-xl">
            <Link to="/aktivasi">{T("Upgrade ke Family", "Upgrade to Family")}</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Fetch family members for filter
  const { data: members = [] } = useQuery({
    queryKey: ["family-members", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url")
        .eq("family_id", familyId!)
        .is("deleted_at", null);
      return data ?? [];
    },
  });

  // Avatar lookup map from members
  const avatarMap = new Map(members.map((m: any) => [m.id, m.avatar_url]));

  const { data: feed = [], isLoading } = useQuery({
    queryKey: ["feed", familyId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), selectedMember],
    enabled: !!familyId,
    queryFn: async () => {
      let query = supabase
        .from("activity_feed")
        .select("*")
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);

      if (dateRange?.from) query = query.gte("created_at", dateRange.from.toISOString());
      if (dateRange?.to) {
        const endOfDay = new Date(dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }
      if (selectedMember) query = query.eq("actor_id", selectedMember);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!familyId) return;
    const ch = supabase
      .channel(`feed-${familyId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_feed", filter: `family_id=eq.${familyId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["feed", familyId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [familyId, qc]);

  return (
    <MainLayout>
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{T("Aktivitas Keluarga")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{T("Semua aktivitas anggota keluarga")}</p>
        </div>
      </header>

      {/* --- Filter bar: date range + member --- */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {/* Date range picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={dateRange?.from || dateRange?.to ? "default" : "outline"}
              size="sm"
              className="h-9 rounded-xl gap-1.5 shrink-0 text-xs"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateRange?.from && dateRange?.to
                ? `${dateRange.from.toLocaleDateString("id", { day: "numeric", month: "short" })} - ${dateRange.to.toLocaleDateString("id", { day: "numeric", month: "short" })}`
                : dateRange?.from
                  ? `≥ ${dateRange.from.toLocaleDateString("id", { day: "numeric", month: "short" })}`
                  : dateRange?.to
                    ? `≤ ${dateRange.to.toLocaleDateString("id", { day: "numeric", month: "short" })}`
                    : T("Tanggal")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-3">
              <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={1} />
              {(dateRange?.from || dateRange?.to) && (
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setDateRange(undefined)}>
                  <X className="h-3 w-3 mr-1" /> {T("Hapus tanggal")}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Member filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={selectedMember ? "default" : "outline"}
              size="sm"
              className="h-9 rounded-xl gap-1.5 shrink-0 text-xs"
            >
              <Filter className="h-3.5 w-3.5" />
              {selectedMember
                ? members.find((m: any) => m.id === selectedMember)?.full_name?.split(" ")[0] ?? T("Anggota")
                : T("Anggota")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            <div className="space-y-0.5">
              <button
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm",
                  !selectedMember ? "bg-primary/10 font-medium" : "hover:bg-secondary/50"
                )}
                onClick={() => setSelectedMember(null)}
              >
                {T("Semua anggota")}
              </button>
              {members.map((m: any) => (
                <button
                  key={m.id}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2",
                    selectedMember === m.id ? "bg-primary/10 font-medium" : "hover:bg-secondary/50"
                  )}
                  onClick={() => setSelectedMember(m.id)}
                >
                  <span className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[11px] font-semibold shrink-0">
                    {initials(m.full_name)}
                  </span>
                  {m.full_name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset filter button */}
        {(dateRange?.from || dateRange?.to || selectedMember) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-xl gap-1.5 shrink-0 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => { setDateRange(undefined); setSelectedMember(null); }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {T("Reset")}
          </Button>
        )}
      </div>

      {/* --- Feed list --- */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-secondary rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-secondary rounded w-3/4" />
                  <div className="h-2.5 bg-secondary rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
          <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            {T("Belum ada aktivitas")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {feed.map((item: any) => (
            <FeedCard key={item.id} item={item} lang={lang as "id" | "en"} avatarMap={avatarMap} />
          ))}
        </div>
      )}

      <div className="h-20" />
    </MainLayout>
  );
}

function FeedCard({ item, lang, avatarMap }: { item: any; lang: "id" | "en"; avatarMap: Map<string, string | null> }) {
  const category = getCategory(item.entity_type, item.action_type);
  const cfg = CATEGORY_CONFIG[category];
  const avatarUrl = avatarMap.get(item.actor_id) ?? undefined;

  const relativeTime = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
    locale: lang === "id" ? idLocale : enUS,
  });

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-soft transition active:scale-[0.99]">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover shrink-0 border border-border" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/40 flex items-center justify-center shrink-0 text-sm font-bold">
            {item.actor_name ? initials(item.actor_name) : "?"}
          </div>
        )}

        {/* Activity sentence */}
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-semibold">{item.actor_name || "—"}</span>{" "}
            <span className="text-muted-foreground">
              {item.description || `${item.action_type} ${item.entity_type || ""}`}
            </span>
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {/* Category badge */}
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium",
                cfg.color.iconBg,
                cfg.color.fg
              )}
            >
              {cfg.icon} {cfg.label[lang]}
            </span>
            {/* Relative time */}
            <span className="text-[10px] text-muted-foreground/70">{relativeTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}