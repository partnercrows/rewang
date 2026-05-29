import { createFileRoute, Link } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, daysUntil, initials, cn } from "@/lib/utils";
import {
  Package, ReceiptText, TrendingDown, Coins, Calendar, Pin, Trash2,
  Cake, BookOpen, GraduationCap, BellRing, Sparkles, CheckCircle2, Trophy, Zap,
} from "lucide-react";
import { QuickAddSheet } from "@/components/home/QuickAddSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Beranda — Rewang" }] }),
  component: BerandaPage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

function BerandaPage() {
  const { profile, family } = useAuth();
  const familyId = family?.id;

  const { data: stats } = useQuery({
    queryKey: ["beranda-stats", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      const monthEnd = new Date(monthStart); monthEnd.setMonth(monthEnd.getMonth() + 1);
      const [items, billsAll, billsMonth, debts] = await Promise.all([
        supabase.from("shopping_items").select("status").eq("family_id", familyId!).is("deleted_at", null),
        supabase.from("bills").select("id,is_paid").eq("family_id", familyId!).is("deleted_at", null).eq("is_paid", false),
        supabase.from("bills").select("id,is_paid,due_date").eq("family_id", familyId!).is("deleted_at", null)
          .gte("due_date", monthStart.toISOString().slice(0,10)).lt("due_date", monthEnd.toISOString().slice(0,10)),
        supabase.from("debts_credits").select("type,total_amount, installment_logs(amount_paid)").eq("family_id", familyId!).is("deleted_at", null),
      ]);
      const lowStock = (items.data ?? []).filter((i) => i.status !== "Aman").length;
      const habis = (items.data ?? []).filter((i) => i.status === "Habis").length;
      const unpaidCount = (billsAll.data ?? []).length;
      const monthUnpaid = (billsMonth.data ?? []).filter((b: any) => !b.is_paid).length;
      const monthTotal = (billsMonth.data ?? []).length;
      const hutang = (debts.data ?? []).filter((d: any) => d.type === "hutang")
        .reduce((s: number, d: any) => {
          const paid = (d.installment_logs ?? []).reduce((a: number, l: any) => a + Number(l.amount_paid), 0);
          return s + Math.max(0, Number(d.total_amount) - paid);
        }, 0);
      const piutang = (debts.data ?? []).filter((d: any) => d.type === "piutang")
        .reduce((s: number, d: any) => {
          const paid = (d.installment_logs ?? []).reduce((a: number, l: any) => a + Number(l.amount_paid), 0);
          return s + Math.max(0, Number(d.total_amount) - paid);
        }, 0);
      const hutangCount = (debts.data ?? []).filter((d: any) => d.type === "hutang").length;
      return { lowStock, habis, unpaidCount, hutang, piutang, hutangCount, monthUnpaid, monthTotal };
    },
  });

  const { data: nextBill } = useQuery({
    queryKey: ["next-bill", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("bills")
        .select("id,bill_name,nominal,due_date,is_recurring,bill_type")
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .eq("is_paid", false)
        .order("due_date", { ascending: true })
        .limit(1);
      return data?.[0] ?? null;
    },
  });

  return (
    <MainLayout>
      <header className="flex items-center justify-between mb-5">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{greeting()},</p>
          <h1 className="text-2xl font-bold tracking-tight truncate">{profile?.full_name?.split(" ")[0]} 👋</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">{family?.family_name}</p>
        </div>
        <Link to="/app/akun" className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold overflow-hidden shrink-0">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(profile?.full_name)}
        </Link>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <SummaryTile to="/app/belanja" Icon={Package} label="Stok menipis" value={`${stats?.lowStock ?? 0} item`} bg="bg-warning/15" fg="text-warning-foreground" iconBg="bg-warning/25" />
        <SummaryTile to="/app/keuangan" Icon={ReceiptText} label="Belum bayar" value={`${stats?.unpaidCount ?? 0} tagihan`} bg="bg-primary/10" fg="text-primary" iconBg="bg-primary/20" />
        <SummaryTile to="/app/keuangan" Icon={TrendingDown} label="Hutang aktif" value={formatRupiah(stats?.hutang ?? 0)} bg="bg-destructive/10" fg="text-destructive" iconBg="bg-destructive/15" />
        <SummaryTile to="/app/keuangan" Icon={Coins} label="Piutang" value={formatRupiah(stats?.piutang ?? 0)} bg="bg-success/15" fg="text-success-foreground" iconBg="bg-success/25" />
      </div>

      {/* Upcoming bill */}
      {nextBill ? (
        <UpcomingBillCard bill={nextBill} familyId={familyId!} />
      ) : (
        <div className="bg-card border border-dashed border-border rounded-2xl p-5 text-center text-sm text-muted-foreground mb-6">
          🎉 Tidak ada tagihan menunggu
        </div>
      )}

      {/* Agenda */}
      <SectionHeader title="Agenda bulan ini" />
      <AgendaSection familyId={familyId!} />

      {/* Quick notes */}
      <SectionHeader title="Catatan rumah" />
      <QuickNotesCard familyId={familyId!} />

      {/* Achievements */}
      <SectionHeader title="Pencapaian rumah" />
      <Achievements stats={stats} />

      <QuickAddSheet />
    </MainLayout>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-base font-bold mt-7 mb-3">{title}</h2>;
}

function SummaryTile({ to, Icon, label, value, bg, fg, iconBg }: { to: string; Icon: any; label: string; value: string; bg: string; fg: string; iconBg: string }) {
  return (
    <Link to={to} className={cn("rounded-2xl p-4 transition active:scale-[0.98]", bg)}>
      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center mb-3", iconBg)}>
        <Icon className={cn("h-4 w-4", fg)} />
      </div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("text-base font-bold leading-tight mt-0.5", fg)}>{value}</p>
    </Link>
  );
}

function UpcomingBillCard({ bill, familyId }: { bill: any; familyId: string }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const days = daysUntil(bill.due_date);
  const overdue = days < 0;

  const pay = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const { error } = await supabase.from("bills").update({ is_paid: true, paid_at: now }).eq("id", bill.id);
      if (error) throw error;
      await supabase.from("bill_payments").insert({ family_id: familyId, bill_id: bill.id, amount: bill.nominal, paid_by: profile?.id, paid_by_name: profile?.full_name });
      await supabase.from("activity_feed").insert({ family_id: familyId, actor_id: profile?.id, actor_name: profile?.full_name, action_type: "pay", entity_type: "bill", description: `melunasi tagihan ${bill.bill_name}` });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["next-bill"] });
      qc.invalidateQueries({ queryKey: ["beranda-stats"] });
      qc.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Tagihan dilunasi");
    },
  });

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl p-5 mb-6 shadow-card text-primary-foreground",
      overdue ? "bg-gradient-to-br from-destructive via-destructive/85 to-destructive/70" : "bg-gradient-to-br from-primary via-primary to-primary-glow",
    )}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-8 h-20 w-20 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-1 opacity-90">
          <Calendar className="h-3.5 w-3.5" />
          <p className="text-[10px] uppercase tracking-widest font-semibold">Tagihan terdekat{bill.is_recurring ? " · berulang" : ""}</p>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight truncate">{bill.bill_name}</h3>
            <p className="text-2xl font-extrabold mt-1">{formatRupiah(bill.nominal)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-extrabold leading-none">{overdue ? `-${-days}` : days === 0 ? "0" : days}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-90 mt-1">{overdue ? "hari telat" : days === 0 ? "hari ini" : "hari lagi"}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="secondary" className="flex-1" onClick={() => pay.mutate()} disabled={pay.isPending}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Lunasi
          </Button>
          <Button size="sm" variant="outline" className="flex-1 bg-transparent border-white/40 text-white hover:bg-white/15 hover:text-white" asChild>
            <Link to="/app/keuangan">Detail</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

const AGENDA_ICON: Record<string, any> = { ulang_tahun: Cake, kajian: BookOpen, sekolah: GraduationCap, janji: Calendar, pengingat: BellRing };
const AGENDA_EMOJI: Record<string, string> = { ulang_tahun: "🎂", kajian: "🕌", sekolah: "🎓", janji: "📌", pengingat: "⚡" };

function AgendaSection({ familyId }: { familyId: string }) {
  const { data: agenda = [] } = useQuery({
    queryKey: ["agenda", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const monthEnd = new Date(); monthEnd.setMonth(monthEnd.getMonth() + 1);
      const { data, error } = await supabase
        .from("agenda_events")
        .select("*")
        .eq("family_id", familyId)
        .is("deleted_at", null)
        .gte("event_date", today)
        .lte("event_date", monthEnd.toISOString().slice(0, 10))
        .order("event_date")
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      {agenda.length === 0 ? (
        <p className="text-xs text-muted-foreground py-5 text-center bg-card border border-dashed border-border rounded-2xl">
          Belum ada agenda bulan ini
        </p>
      ) : (
        <div className="space-y-2">
          {agenda.map((a: any) => {
            const Icon = AGENDA_ICON[a.event_type] ?? BellRing;
            const d = daysUntil(a.event_date);
            return (
              <div key={a.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3 shadow-soft active:scale-[0.99] transition">
                <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 text-lg">
                  <span aria-hidden>{AGENDA_EMOJI[a.event_type] ?? "📅"}</span>
                  <Icon className="h-4 w-4 hidden" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{String(a.event_type).replace("_", " ")}</p>
                </div>
                <span className="text-xs font-semibold text-primary shrink-0">
                  {d === 0 ? "Hari ini" : d === 1 ? "Besok" : `${d} hari lagi`}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <Button asChild variant="outline" size="sm" className="w-full mt-3 rounded-xl">
        <Link to="/app/akun"><Calendar className="h-4 w-4 mr-2" /> Lihat kalender</Link>
      </Button>
    </>
  );
}

function QuickNotesCard({ familyId }: { familyId: string }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [text, setText] = useState("");

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_notes")
        .select("*")
        .eq("family_id", familyId)
        .is("deleted_at", null)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      const { error } = await supabase.from("quick_notes").insert({ family_id: familyId, content: text.trim(), created_by: profile?.id, created_by_name: profile?.full_name });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: ["notes", familyId] }); },
  });

  const togglePin = useMutation({
    mutationFn: async (n: any) => {
      const { error } = await supabase.from("quick_notes").update({ is_pinned: !n.is_pinned }).eq("id", n.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", familyId] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quick_notes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", familyId] }),
  });

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="flex gap-2 mb-3">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis catatan singkat..." className="bg-card" />
        <Button type="submit" size="sm" disabled={!text.trim() || add.isPending}>Tambah</Button>
      </form>
      {notes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 bg-card border border-dashed border-border rounded-2xl">Belum ada catatan</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {notes.map((n: any, i: number) => (
            <div
              key={n.id}
              className={cn(
                "relative p-3 rounded-xl text-sm shadow-soft",
                n.is_pinned
                  ? "bg-warning/20 border border-warning/40"
                  : i % 2 === 0
                    ? "bg-[oklch(0.95_0.04_85)] border border-warning/20"
                    : "bg-[oklch(0.93_0.04_120)] border border-accent/40",
              )}
              style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive", transform: `rotate(${(i % 2 === 0 ? -0.6 : 0.6)}deg)` }}
            >
              <button onClick={() => togglePin.mutate(n)} className={cn("absolute top-1.5 right-7", n.is_pinned ? "text-warning" : "text-muted-foreground/60 hover:text-warning")}>
                <Pin className={cn("h-3.5 w-3.5", n.is_pinned && "fill-current")} />
              </button>
              <button onClick={() => del.mutate(n.id)} className="absolute top-1.5 right-1.5 text-muted-foreground/60 hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <p className="leading-snug break-words pr-10 text-[15px]">{n.content}</p>
              {n.created_by_name && <p className="text-[10px] text-muted-foreground/80 mt-1.5" style={{ fontFamily: "var(--font-body)" }}>— {n.created_by_name}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Achievements({ stats }: { stats: any }) {
  const items = [
    { ok: (stats?.monthTotal ?? 0) > 0 && (stats?.monthUnpaid ?? 0) === 0, Icon: Trophy, text: "Semua tagihan bulan ini lunas" },
    { ok: (stats?.habis ?? 0) === 0, Icon: Sparkles, text: "Tidak ada stok habis minggu ini" },
    { ok: (stats?.hutangCount ?? 0) === 0, Icon: Zap, text: "Tidak ada hutang aktif" },
  ].filter((i) => i.ok);

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4 bg-card border border-dashed border-border rounded-2xl">Belum ada pencapaian — terus rapikan rumah ya 💪</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ Icon, text }, i) => (
        <div key={i} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-success/15 to-primary/10 border border-success/30 text-xs font-medium text-success-foreground">
          <Icon className="h-3.5 w-3.5 text-success" />
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}
