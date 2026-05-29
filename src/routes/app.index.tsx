import { createFileRoute, Link } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, daysUntil, initials, cn } from "@/lib/utils";
import {
  Package, ReceiptText, TrendingDown, Coins, Calendar, Pin, Trash2,
  Cake, BookOpen, GraduationCap, BellRing, Sparkles, CheckCircle2, Trophy, Zap,
  Check, Circle, Flame, StickyNote, Plus, Repeat, X,
} from "lucide-react";
import { QuickAddSheet } from "@/components/home/QuickAddSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Beranda — Rewang" }] }),
  component: BerandaPage,
});

function todayDate(lang: string) {
  const now = new Date();
  return now.toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BerandaPage() {
  const { profile, family } = useAuth();
  const { T } = useLang();
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
      const lowStock = (items.data ?? []).filter((i) => i.status === "Menipis").length;
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

  const { lang } = useLang();

  return (
    <MainLayout>
      <header className="flex items-center justify-between mb-5">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {todayDate(lang)}
          </p>
          <h1 className="text-2xl font-bold tracking-tight truncate">{profile?.full_name?.split(" ")[0]} 👋</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">{family?.family_name}</p>
        </div>
        <Link to="/app/akun" className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold overflow-hidden shrink-0">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(profile?.full_name)}
        </Link>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <SummaryTile to="/app/belanja" Icon={Package} label={T("Stok menipis", "Low stock")} value={`${stats?.lowStock ?? 0} ${T("item", "item")}`} bg="bg-warning/15" fg="text-warning-foreground" iconBg="bg-warning/25" />
        <SummaryTile to="/app/keuangan" Icon={ReceiptText} label={T("Belum bayar", "Unpaid")} value={`${stats?.unpaidCount ?? 0} ${T("tagihan", "bills")}`} bg="bg-primary/10" fg="text-primary" iconBg="bg-primary/20" />
        <SummaryTile to="/app/keuangan?tab=hutang-piutang" Icon={TrendingDown} label={T("Hutang aktif", "Active debt")} value={formatRupiah(stats?.hutang ?? 0)} bg="bg-destructive/10" fg="text-destructive" iconBg="bg-destructive/15" />
        <SummaryTile to="/app/keuangan?tab=hutang-piutang" Icon={Coins} label={T("Piutang", "Receivable")} value={formatRupiah(stats?.piutang ?? 0)} bg="bg-success/15" fg="text-success-foreground" iconBg="bg-success/25" />
      </div>

      {/* Upcoming bill */}
      {nextBill ? (
        <UpcomingBillCard bill={nextBill} familyId={familyId!} />
      ) : (
        <div className="bg-card border border-dashed border-border rounded-2xl p-5 text-center text-sm text-muted-foreground mb-6">
          🎉 {T("Tidak ada tagihan menunggu", "No pending bills")}
        </div>
      )}

      {/* Agenda */}
      <SectionHeader title={T("Agenda bulan ini", "This month's agenda")} />
      <AgendaSection familyId={familyId!} />

      {/* Quick notes */}
      <SectionHeader title={T("Catatan rumah", "House notes")} />
      <QuickNotesCard familyId={familyId!} />

      {/* Today's Tasks — simplified checklist */}
      <SectionHeader title={T("Aktivitas Hari Ini", "Today's Tasks")} />
      <TodayTasksSimple familyId={familyId!} />

      {/* Achievements */}
      <SectionHeader title={T("Pencapaian rumah", "Home achievements")} />
      <Achievements stats={stats} />

      <QuickAddSheet />
    </MainLayout>
  );
}

// ==================== SIMPLE CHECKLIST TASKS ====================

function TodayTasksSimple({ familyId }: { familyId: string }) {
  const { T } = useLang();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["daily-tasks", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      // Fetch all non-deleted tasks
      const { data, error } = await (supabase as any)
        .from("daily_tasks")
        .select("*")
        .eq("family_id", familyId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((t: any) => {
        // Show if: not done, OR done today, OR recurring (will always show)
        if (!t.is_done) return true;
        if (t.is_recurring) {
          // Recurring tasks: only hide if done today; reset tomorrow
          if (t.done_at) {
            const doneDate = t.done_at.slice(0, 10);
            if (doneDate === todayStr) return true; // show as done today
            return false; // hide — will be reset by midnight logic or we show as un-done
          }
          return true;
        }
        // Non-recurring done tasks: show if done today only
        if (t.done_at && t.done_at.slice(0, 10) === todayStr) return true;
        return false;
      });
    },
  });

  const toggleDone = useMutation({
    mutationFn: async (task: any) => {
      const newDone = !task.is_done;
      const updates: any = {
        is_done: newDone,
        done_at: newDone ? new Date().toISOString() : null,
        done_by: newDone ? profile?.id : null,
      };
      await (supabase as any).from("daily_tasks").update(updates).eq("id", task.id);
      // Activity feed (fire & forget — jangan blocking)
      if (newDone) {
        (async () => {
          try {
            await supabase.from("activity_feed").insert({
              family_id: familyId,
              actor_id: profile?.id,
              actor_name: profile?.full_name,
              action_type: "complete_task",
              entity_type: "daily_task",
              description: `menyelesaikan tugas "${task.title}"`,
            });
          } catch { /* ignore */ }
        })();
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-tasks", familyId] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from("daily_tasks").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-tasks", familyId] });
      toast.success("Tugas dihapus");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 flex gap-2 animate-pulse shadow-soft">
            <div className="h-5 w-5 rounded-full bg-muted shrink-0" />
            <div className="flex-1 h-4 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const sorted = [...tasks].sort((a: any, b: any) => {
    // Done tasks at bottom
    if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
    return 0;
  });

  return (
    <>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground py-5 text-center bg-card border border-dashed border-border rounded-2xl">
          {T("Belum ada tugas hari ini", "No tasks for today")}
        </p>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((t: any) => (
            <div
              key={t.id}
              className={cn(
                "bg-card border rounded-xl p-3 flex items-center gap-2.5 shadow-soft transition active:scale-[0.99]",
                t.is_done ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10" : "border-border",
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleDone.mutate(t)}
                disabled={toggleDone.isPending}
                className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  t.is_done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-muted-foreground/30 hover:border-primary",
                )}
              >
                {t.is_done && <Check className="h-3 w-3" />}
              </button>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium leading-snug",
                    t.is_done && "line-through text-muted-foreground",
                  )}
                >
                  {t.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {t.is_recurring && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400">
                      <Repeat className="h-3 w-3" />
                      {T("Berulang", "Recurring")}
                    </span>
                  )}
                  {t.priority && t.priority !== "normal" && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
                      t.priority === "high" ? "text-red-500 bg-red-50 dark:bg-red-950/30" : "text-slate-400 bg-slate-50 dark:bg-slate-800/30",
                    )}>
                      {t.priority === "high" ? "🔥" : "○"}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => deleteTask.mutate(t.id)}
                disabled={deleteTask.isPending}
                className="text-muted-foreground/50 hover:text-destructive shrink-0 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add task dialog — controlled so it closes on success */}
      <AddTaskSimpleDialog familyId={familyId} profile={profile} onSuccess={() => qc.invalidateQueries({ queryKey: ["daily-tasks", familyId] })} />
    </>
  );
}

function AddTaskSimpleDialog({ familyId, profile, onSuccess }: { familyId: string; profile: any; onSuccess: () => void }) {
  const { T } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="w-full mt-2 rounded-xl">
          <Plus className="h-4 w-4 mr-1" /> {T("Tambah Tugas", "Add Task")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{T("Tambah Tugas", "Add Task")}</DialogTitle></DialogHeader>
        <AddTaskSimpleForm
          familyId={familyId}
          profile={profile}
          onSuccess={() => {
            setOpen(false);
            onSuccess();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddTaskSimpleForm({ familyId, profile, onSuccess }: { familyId: string; profile: any; onSuccess: () => void }) {
  const { T } = useLang();
  const [title, setTitle] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const { error } = await (supabase as any).from("daily_tasks").insert({
      family_id: familyId,
      title: title.trim(),
      is_recurring: isRecurring,
      is_done: false,
      created_by: profile?.id,
      priority: "normal",
    });
    if (error) {
      toast.error("Gagal menambah tugas");
      setBusy(false);
      return;
    }
    // Success — close dialog & reset form FIRST
    toast.success("Tugas ditambahkan");
    setTitle("");
    setIsRecurring(false);
    onSuccess();
    setBusy(false);
    // Insert to activity feed (fire & forget, jangan blocking)
    (async () => {
      try {
        await supabase.from("activity_feed").insert({
          family_id: familyId,
          actor_id: profile?.id,
          actor_name: profile?.full_name,
          action_type: "create_task",
          entity_type: "daily_task",
          description: `menambahkan tugas "${title.trim()}"${isRecurring ? " (berulang)" : ""}`,
        });
      } catch { /* ignore */ }
    })();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>{T("Judul", "Title")}</Label>
        <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={T("Masukkan nama tugas...", "Enter task name...")} />
      </div>
      <div className="flex items-center justify-between py-2">
        <div>
          <Label className="text-sm">{T("Tugas Berulang", "Recurring Task")}</Label>
          <p className="text-[11px] text-muted-foreground">{T("Muncul setiap hari", "Appears every day")}</p>
        </div>
        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
      </div>
      <Button type="submit" className="w-full" disabled={busy || !title.trim()}>{T("Simpan", "Save")}</Button>
    </form>
  );
}

// ==================== END SIMPLE CHECKLIST ====================

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
        .limit(3);
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
        <Link to="/app/kalender"><Calendar className="h-4 w-4 mr-2" /> Lihat kalender</Link>
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
                    ? "bg-warning/20 dark:bg-warning/20 border border-warning/40"
                    : i % 2 === 0
                      ? "bg-[oklch(0.95_0.04_85)] dark:bg-[oklch(0.28_0.04_80)] border border-warning/20 dark:border-warning/30"
                      : "bg-[oklch(0.93_0.04_120)] dark:bg-[oklch(0.25_0.04_130)] border border-accent/40 dark:border-accent/30",
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
        <div key={i} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-300 dark:border-emerald-700 text-xs font-medium text-emerald-800 dark:text-emerald-100">
          <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}