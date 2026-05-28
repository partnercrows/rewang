import { createFileRoute, Link } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, daysUntil, initials } from "@/lib/utils";
import { ShoppingBasket, Wallet, ReceiptText, TrendingDown, Calendar, Pin, Trash2, Cake, BookOpen, GraduationCap, BellRing, Sparkles, CheckCircle2 } from "lucide-react";
import { QuickAddSheet } from "@/components/home/QuickAddSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      const [items, bills, debts] = await Promise.all([
        supabase.from("shopping_items").select("status").eq("family_id", familyId!).is("deleted_at", null),
        supabase.from("bills").select("nominal,due_date,is_paid").eq("family_id", familyId!).is("deleted_at", null).eq("is_paid", false),
        supabase.from("debts_credits").select("type,total_amount").eq("family_id", familyId!).is("deleted_at", null),
      ]);
      const lowStock = (items.data ?? []).filter((i) => i.status !== "Aman").length;
      const unpaidCount = (bills.data ?? []).length;
      const hutang = (debts.data ?? []).filter((d) => d.type === "hutang").reduce((s, d) => s + Number(d.total_amount), 0);
      const piutang = (debts.data ?? []).filter((d) => d.type === "piutang").reduce((s, d) => s + Number(d.total_amount), 0);
      const habis = (items.data ?? []).filter((i) => i.status === "Habis").length;
      return { lowStock, unpaidCount, hutang, piutang, habis };
    },
  });

  const { data: nextBill } = useQuery({
    queryKey: ["next-bill", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("bills")
        .select("id,bill_name,nominal,due_date,is_recurring")
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
        <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold overflow-hidden shrink-0">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(profile?.full_name)}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <SummaryCard to="/app/belanja" Icon={ShoppingBasket} label="Stok perlu" value={`${stats?.lowStock ?? 0} item`} accent={stats?.lowStock ? "warning" : "default"} />
        <SummaryCard to="/app/keuangan" Icon={ReceiptText} label="Belum bayar" value={`${stats?.unpaidCount ?? 0} tagihan`} accent={stats?.unpaidCount ? "warning" : "default"} />
        <SummaryCard to="/app/keuangan" Icon={TrendingDown} label="Hutang" value={formatRupiah(stats?.hutang ?? 0)} accent={stats?.hutang ? "destructive" : "default"} />
        <SummaryCard to="/app/keuangan" Icon={Wallet} label="Piutang" value={formatRupiah(stats?.piutang ?? 0)} accent={stats?.piutang ? "success" : "default"} />
      </div>

      {nextBill && <UpcomingBillCard bill={nextBill} familyId={familyId!} />}

      <SectionHeader title="Agenda keluarga" />
      <AgendaList familyId={familyId!} />

      <SectionHeader title="Catatan cepat" />
      <QuickNotesCard familyId={familyId!} />

      <SectionHeader title="Highlight rumah" />
      <HighlightsCard stats={stats} />

      <SectionHeader title="Papan tugas" hint="Geser horizontal" />
      <KanbanWrap familyId={familyId!} />

      <QuickAddSheet />
    </MainLayout>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mt-6 mb-2 flex items-center justify-between">
      <h2 className="text-base font-bold">{title}</h2>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function SummaryCard({ to, Icon, label, value, accent }: { to: string; Icon: any; label: string; value: string; accent: "default" | "warning" | "destructive" | "success" }) {
  const accentMap = { default: "text-primary", warning: "text-warning", destructive: "text-destructive", success: "text-success" } as const;
  return (
    <Link to={to} className="bg-card border border-border rounded-2xl p-4 shadow-soft hover:shadow-card transition active:scale-[0.98]">
      <Icon className={cn("h-5 w-5 mb-2", accentMap[accent])} />
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-base font-bold leading-tight mt-0.5">{value}</p>
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
    <div className={cn("rounded-2xl p-4 mb-5 shadow-card text-primary-foreground", overdue ? "bg-gradient-to-br from-destructive to-destructive/70" : "bg-gradient-to-br from-primary to-primary-glow")}>
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="h-4 w-4" />
        <p className="text-[10px] uppercase tracking-wide opacity-90">Tagihan terdekat{bill.is_recurring ? " · berulang" : ""}</p>
      </div>
      <h3 className="text-lg font-bold leading-tight">{bill.bill_name}</h3>
      <div className="flex items-baseline justify-between mt-1">
        <span className="text-2xl font-extrabold">{formatRupiah(bill.nominal)}</span>
        <span className="text-sm font-medium">{overdue ? `Telat ${-days} hari` : days === 0 ? "Hari ini" : `${days} hari lagi`}</span>
      </div>
      <div className="flex gap-2 mt-3">
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => pay.mutate()} disabled={pay.isPending}>
          <CheckCircle2 className="h-4 w-4 mr-1" /> Lunasi
        </Button>
        <Button size="sm" variant="outline" className="flex-1 bg-transparent border-white/40 text-white hover:bg-white/15 hover:text-white" asChild>
          <Link to="/app/keuangan">Detail</Link>
        </Button>
      </div>
    </div>
  );
}

const AGENDA_ICON: Record<string, any> = { ulang_tahun: Cake, kajian: BookOpen, sekolah: GraduationCap, janji: Calendar, pengingat: BellRing };

function AgendaList({ familyId }: { familyId: string }) {
  const { data: agenda = [] } = useQuery({
    queryKey: ["agenda", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("agenda_events")
        .select("*")
        .eq("family_id", familyId)
        .is("deleted_at", null)
        .gte("event_date", today)
        .order("event_date")
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  if (agenda.length === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center bg-card border border-dashed border-border rounded-xl">Belum ada agenda. Tambah dengan tombol +</p>;
  }
  return (
    <div className="space-y-2">
      {agenda.map((a: any) => {
        const Icon = AGENDA_ICON[a.event_type] ?? BellRing;
        const d = daysUntil(a.event_date);
        return (
          <div key={a.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shadow-soft">
            <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{a.title}</p>
              <p className="text-[11px] text-muted-foreground capitalize">{String(a.event_type).replace("_", " ")}</p>
            </div>
            <span className="text-xs font-semibold text-primary shrink-0">{d === 0 ? "Hari ini" : `${d} hari`}</span>
          </div>
        );
      })}
    </div>
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
        .limit(10);
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
    <div className="bg-card border border-border rounded-2xl p-3 shadow-soft">
      <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="flex gap-2 mb-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis catatan singkat..." />
        <Button type="submit" size="sm" disabled={!text.trim() || add.isPending}>Tambah</Button>
      </form>
      <div className="space-y-1.5">
        {notes.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Belum ada catatan</p>}
        {notes.map((n: any) => (
          <div key={n.id} className={cn("flex items-start gap-2 p-2 rounded-lg text-sm", n.is_pinned ? "bg-warning/10" : "bg-secondary/40")}>
            <button onClick={() => togglePin.mutate(n)} className={cn("shrink-0 mt-0.5", n.is_pinned ? "text-warning" : "text-muted-foreground")}>
              <Pin className={cn("h-3.5 w-3.5", n.is_pinned && "fill-current")} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="leading-snug break-words">{n.content}</p>
              {n.created_by_name && <p className="text-[10px] text-muted-foreground mt-0.5">— {n.created_by_name}</p>}
            </div>
            <button onClick={() => del.mutate(n.id)} className="text-muted-foreground hover:text-destructive shrink-0">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HighlightsCard({ stats }: { stats: any }) {
  const items: { ok: boolean; text: string }[] = [
    { ok: (stats?.unpaidCount ?? 0) === 0, text: "Semua tagihan lunas bulan ini" },
    { ok: (stats?.habis ?? 0) === 0, text: "Tidak ada stok habis minggu ini" },
    { ok: (stats?.hutang ?? 0) === 0, text: "Tidak ada hutang aktif" },
  ];
  return (
    <div className="bg-gradient-to-br from-accent/60 to-secondary border border-border rounded-2xl p-3 shadow-soft space-y-1.5">
      {items.map((h, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          {h.ok ? <Sparkles className="h-4 w-4 text-success shrink-0" /> : <BellRing className="h-4 w-4 text-warning shrink-0" />}
          <span className={cn(h.ok ? "" : "text-muted-foreground")}>{h.ok ? h.text : `Cek ${h.text.toLowerCase()}`}</span>
        </div>
      ))}
    </div>
  );
}

function KanbanWrap({ familyId }: { familyId: string }) {
  // lazy import via dynamic — keep simple inline import
  const { KanbanBoard } = require("@/components/kanban/KanbanBoard");
  return <KanbanBoard familyId={familyId} />;
}
