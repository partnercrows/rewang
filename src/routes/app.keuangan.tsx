import { createFileRoute } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatRupiah, daysUntil, cn } from "@/lib/utils";
import { Plus, Trash2, Check, MessageCircle, Receipt, HandCoins, FileDown, ChevronDown, Repeat, History } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/app/keuangan")({
  head: () => ({ meta: [{ title: "Keuangan — Rewang" }] }),
  component: KeuanganPage,
});

function KeuanganPage() {
  return (
    <MainLayout title="Keuangan">
      <Tabs defaultValue="bills">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bills"><Receipt className="h-4 w-4 mr-2" />Tagihan</TabsTrigger>
          <TabsTrigger value="debts"><HandCoins className="h-4 w-4 mr-2" />Hutang/Piutang</TabsTrigger>
        </TabsList>
        <TabsContent value="bills" className="mt-4"><BillsTab /></TabsContent>
        <TabsContent value="debts" className="mt-4"><DebtsTab /></TabsContent>
      </Tabs>
    </MainLayout>
  );
}

/* ============== BILLS ============== */

type BillFilter = "all" | "unpaid" | "due" | "paid";

const BILL_TYPE_STYLE: Record<string, string> = {
  listrik: "bg-warning/20 text-warning-foreground",
  internet: "bg-primary/15 text-primary",
  air: "bg-[oklch(0.85_0.08_220)] text-[oklch(0.3_0.12_220)]",
  sekolah: "bg-accent text-accent-foreground",
  pajak: "bg-destructive/15 text-destructive",
  subscription: "bg-secondary text-secondary-foreground",
  lainnya: "bg-muted text-muted-foreground",
};

function BillsTab() {
  const { family, profile } = useAuth();
  const familyId = family?.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<BillFilter>("all");

  const { data: bills = [] } = useQuery({
    queryKey: ["bills", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills").select("*").eq("family_id", familyId!).is("deleted_at", null).order("due_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["bill_payments", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bill_payments").select("*, bills(bill_name)").eq("family_id", familyId!).is("deleted_at", null)
        .order("paid_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });

  const filtered = bills.filter((b: any) => {
    if (filter === "paid") return b.is_paid;
    if (filter === "unpaid") return !b.is_paid;
    if (filter === "due") return !b.is_paid && daysUntil(b.due_date) <= 7;
    return true;
  });

  const logActivity = async (description: string) => {
    if (!familyId || !profile) return;
    await supabase.from("activity_feed").insert({
      family_id: familyId, actor_id: profile.id, actor_name: profile.full_name,
      action_type: "bill", entity_type: "bill", description,
    });
  };

  const addBill = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("bills").insert({ ...v, family_id: familyId! });
      if (error) throw error;
      await logActivity(`menambahkan tagihan ${v.bill_name} (${formatRupiah(v.nominal)})`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bills", familyId] }); toast.success("Tagihan ditambahkan"); setOpen(false); },
  });

  const pay = useMutation({
    mutationFn: async (bill: any) => {
      const now = new Date().toISOString();
      const { error } = await supabase.from("bills").update({ is_paid: true, paid_at: now }).eq("id", bill.id);
      if (error) throw error;
      await supabase.from("bill_payments").insert({
        family_id: familyId!, bill_id: bill.id, amount: bill.nominal,
        paid_by: profile?.id, paid_by_name: profile?.full_name,
      });
      // Auto-renewal: buat tagihan baru bila recurring
      if (bill.is_recurring) {
        const next = new Date(bill.due_date);
        if (bill.recurrence_interval === "yearly") next.setFullYear(next.getFullYear() + 1);
        else if (bill.recurrence_interval === "weekly") next.setDate(next.getDate() + 7);
        else next.setMonth(next.getMonth() + 1);
        await supabase.from("bills").insert({
          family_id: familyId!,
          bill_name: bill.bill_name,
          nominal: bill.nominal,
          due_date: next.toISOString().slice(0, 10),
          is_recurring: true,
          recurrence_interval: bill.recurrence_interval,
          bill_type: bill.bill_type,
          notes: bill.notes,
          reminder_days: bill.reminder_days,
        });
      }
      await logActivity(`melunasi tagihan ${bill.bill_name}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills", familyId] });
      qc.invalidateQueries({ queryKey: ["bill_payments", familyId] });
      qc.invalidateQueries({ queryKey: ["beranda-stats"] });
      qc.invalidateQueries({ queryKey: ["next-bill"] });
      toast.success("Tagihan dilunasi");
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bills").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bills", familyId] }); toast.success("Dihapus"); },
  });

  const exportPDF = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthBills = bills.filter((b: any) => {
      const d = new Date(b.due_date);
      return d >= monthStart && d <= monthEnd;
    });
    const doc = new jsPDF();
    const monthName = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    doc.setFontSize(16); doc.text(`Laporan Tagihan — ${monthName}`, 14, 18);
    doc.setFontSize(10); doc.setTextColor(120); doc.text(`Keluarga: ${family?.family_name ?? "-"}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [["Tagihan", "Jenis", "Jatuh tempo", "Nominal", "Status"]],
      body: monthBills.map((b: any) => [
        b.bill_name,
        b.bill_type ?? "lainnya",
        new Date(b.due_date).toLocaleDateString("id-ID"),
        formatRupiah(b.nominal),
        b.is_paid ? "Lunas" : "Belum",
      ]),
      foot: [[
        "Total", "", "",
        formatRupiah(monthBills.reduce((s: number, b: any) => s + Number(b.nominal), 0)),
        `${monthBills.filter((b: any) => b.is_paid).length}/${monthBills.length} lunas`,
      ]],
      headStyles: { fillColor: [125, 155, 118] },
      footStyles: { fillColor: [240, 235, 220], textColor: 40, fontStyle: "bold" },
      styles: { fontSize: 9 },
    });
    doc.save(`tagihan-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`);
    toast.success("PDF diunduh");
  };

  const FILTERS: { v: BillFilter; label: string }[] = [
    { v: "all", label: "Semua" }, { v: "unpaid", label: "Belum" }, { v: "due", label: "Jatuh tempo" }, { v: "paid", label: "Lunas" },
  ];

  return (
    <>
      <div className="flex items-center gap-2 mb-3 overflow-x-auto -mx-1 px-1 pb-1">
        {FILTERS.map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition",
              filter === f.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}
          >{f.label}</button>
        ))}
        <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={exportPDF}>
          <FileDown className="h-3.5 w-3.5 mr-1" /> PDF
        </Button>
      </div>

      <div className="space-y-2 mb-4">
        {filtered.length === 0 && <p className="text-center py-10 text-muted-foreground text-sm">Tidak ada tagihan</p>}
        {filtered.map((b: any) => {
          const days = daysUntil(b.due_date);
          const overdue = days < 0 && !b.is_paid;
          const billType = b.bill_type ?? "lainnya";
          return (
            <div key={b.id} className={cn(
              "bg-card border rounded-2xl p-4 shadow-soft",
              overdue ? "border-destructive/50" : "border-border",
              b.is_paid && "opacity-60",
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", BILL_TYPE_STYLE[billType])}>{billType}</span>
                    {b.is_recurring && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-accent text-accent-foreground inline-flex items-center gap-1">
                        <Repeat className="h-2.5 w-2.5" /> berulang
                      </span>
                    )}
                  </div>
                  <p className={cn("font-semibold truncate", b.is_paid && "line-through")}>{b.bill_name}</p>
                  <p className="text-lg font-extrabold text-primary">{formatRupiah(b.nominal)}</p>
                  <p className={cn("text-xs mt-0.5", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                    {b.is_paid
                      ? `Lunas${b.paid_at ? " · " + new Date(b.paid_at).toLocaleDateString("id-ID") : ""}`
                      : overdue ? `Telat ${-days} hari` : days === 0 ? "Jatuh tempo hari ini" : `${days} hari lagi`}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {!b.is_paid && (
                    <Button size="icon" className="h-8 w-8" onClick={() => pay.mutate(b)} disabled={pay.isPending}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => del.mutate(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment history */}
      <Collapsible className="mb-24">
        <CollapsibleTrigger className="flex items-center justify-between w-full bg-card border border-border rounded-2xl p-4 shadow-soft">
          <span className="flex items-center gap-2 font-semibold text-sm">
            <History className="h-4 w-4 text-primary" /> Riwayat pembayaran ({payments.length})
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-1.5">
          {payments.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Belum ada</p>}
          {payments.map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{p.bills?.bill_name ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground">{new Date(p.paid_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}{p.paid_by_name && ` · ${p.paid_by_name}`}</p>
              </div>
              <span className="text-sm font-bold text-success-foreground">{formatRupiah(p.amount)}</span>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-24 left-1/2 -translate-x-1/2 shadow-card rounded-full h-12 px-5" size="lg">
            <Plus className="h-5 w-5 mr-1" /> Tagihan Baru
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Tagihan baru</DialogTitle></DialogHeader>
          <AddBillForm onSubmit={(v) => addBill.mutate(v)} busy={addBill.isPending} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddBillForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const [bill_name, setName] = useState("");
  const [nominal, setNominal] = useState(0);
  const [due_date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bill_type, setType] = useState("lainnya");
  const [notes, setNotes] = useState("");
  const [reminder_days, setReminder] = useState(3);
  const [is_recurring, setRec] = useState(false);
  const [recurrence_interval, setInterval] = useState("monthly");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ bill_name, nominal, due_date, bill_type, notes, reminder_days, is_recurring, recurrence_interval: is_recurring ? recurrence_interval : null }); }}
      className="space-y-3"
    >
      <div><Label>Nama tagihan</Label><Input required value={bill_name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Nominal (Rp)</Label><Input required type="number" min={0} value={nominal} onChange={(e) => setNominal(parseFloat(e.target.value) || 0)} /></div>
        <div><Label>Jatuh tempo</Label><Input required type="date" value={due_date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>
      <div>
        <Label>Jenis</Label>
        <Select value={bill_type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["listrik","internet","air","sekolah","pajak","subscription","lainnya"].map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Catatan (opsional)</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <div><Label>Ingatkan (hari sebelum)</Label><Input type="number" min={0} value={reminder_days} onChange={(e) => setReminder(parseInt(e.target.value) || 0)} /></div>
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <Label htmlFor="rec">Tagihan berulang</Label>
        <Switch id="rec" checked={is_recurring} onCheckedChange={setRec} />
      </div>
      {is_recurring && (
        <Select value={recurrence_interval} onValueChange={setInterval}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Mingguan</SelectItem>
            <SelectItem value="monthly">Bulanan</SelectItem>
            <SelectItem value="yearly">Tahunan</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Button type="submit" className="w-full" disabled={busy}>Simpan</Button>
    </form>
  );
}

/* ============== DEBTS ============== */

function DebtsTab() {
  const { family, profile } = useAuth();
  const familyId = family?.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"all" | "hutang" | "piutang">("all");

  const { data: debts = [] } = useQuery({
    queryKey: ["debts", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("debts_credits").select("*, installment_logs(id, amount_paid, payment_date, installment_number)")
        .eq("family_id", familyId!).is("deleted_at", null).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const logActivity = async (description: string) => {
    if (!familyId || !profile) return;
    await supabase.from("activity_feed").insert({
      family_id: familyId, actor_id: profile.id, actor_name: profile.full_name,
      action_type: "debt", entity_type: "debt", description,
    });
  };

  const addDebt = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("debts_credits").insert({ ...v, family_id: familyId! });
      if (error) throw error;
      await logActivity(`mencatat ${v.type} ${v.person_name} (${formatRupiah(v.total_amount)})`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["debts", familyId] }); toast.success("Disimpan"); setOpen(false); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("debts_credits").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["debts", familyId] }); toast.success("Dihapus"); },
  });

  const pay = useMutation({
    mutationFn: async ({ debt, amount }: { debt: any; amount: number }) => {
      const paid = (debt.installment_logs ?? []).reduce((s: number, l: any) => s + Number(l.amount_paid), 0);
      const nextNum = (debt.installment_logs?.length ?? 0) + 1;
      const { error } = await supabase.from("installment_logs").insert({
        debt_credit_id: debt.id, installment_number: nextNum, amount_paid: amount,
        payment_date: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      await logActivity(`mencatat cicilan ${formatRupiah(amount)} untuk ${debt.person_name} (total bayar ${formatRupiah(paid + amount)})`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["debts", familyId] }); toast.success("Cicilan dicatat"); },
  });

  const filtered = view === "all" ? debts : debts.filter((d: any) => d.type === view);

  return (
    <>
      <div className="flex gap-2 mb-3">
        {(["all","hutang","piutang"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={cn("flex-1 px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition",
              view === v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}
          >{v === "all" ? "Semua" : v}</button>
        ))}
      </div>

      <div className="space-y-3 mb-24">
        {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">Belum ada catatan</p>}
        {filtered.map((d: any) => <DebtCard key={d.id} d={d} onDelete={(id) => del.mutate(id)} onPay={(amount) => pay.mutate({ debt: d, amount })} />)}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-24 left-1/2 -translate-x-1/2 shadow-card rounded-full h-12 px-5" size="lg">
            <Plus className="h-5 w-5 mr-1" /> Catat Baru
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Hutang / Piutang baru</DialogTitle></DialogHeader>
          <AddDebtForm onSubmit={(v) => addDebt.mutate(v)} busy={addDebt.isPending} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function DebtCard({ d, onDelete, onPay }: { d: any; onDelete: (id: string) => void; onPay: (amount: number) => void }) {
  const paid = (d.installment_logs ?? []).reduce((s: number, l: any) => s + Number(l.amount_paid), 0);
  const remaining = Math.max(0, Number(d.total_amount) - paid);
  const progress = Number(d.total_amount) > 0 ? Math.min(100, (paid / Number(d.total_amount)) * 100) : 0;
  const monthsLeft = Number(d.monthly_installment) > 0 ? Math.ceil(remaining / Number(d.monthly_installment)) : null;
  const isHutang = d.type === "hutang";
  const waText = encodeURIComponent(
    isHutang
      ? `Halo ${d.person_name}, ini pengingat cicilan saya. Sisa: ${formatRupiah(remaining)}`
      : `Halo ${d.person_name}, ini pengingat cicilan Anda. Sisa: ${formatRupiah(remaining)}`,
  );

  const [payAmt, setPayAmt] = useState<string>("");
  const [payOpen, setPayOpen] = useState(false);
  const logs = [...(d.installment_logs ?? [])].sort((a: any, b: any) => (a.installment_number || 0) - (b.installment_number || 0));

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
              isHutang ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success-foreground",
            )}>{d.type}</span>
            <h3 className="font-semibold truncate">{d.person_name}</h3>
          </div>
          {d.phone_number && <p className="text-xs text-muted-foreground mt-0.5">{d.phone_number}</p>}
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(d.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Terbayar {formatRupiah(paid)}</span>
          <span className="font-semibold">{formatRupiah(d.total_amount)}</span>
        </div>
        <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary-glow h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs">
          <span className="font-medium">{progress.toFixed(0)}% · sisa {formatRupiah(remaining)}</span>
          {monthsLeft !== null && monthsLeft > 0 && <span className="text-muted-foreground">~{monthsLeft} bulan lagi</span>}
        </div>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <div className="flex gap-2 mt-3">
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setPayAmt(String(d.monthly_installment || ""))}>Tambah cicilan</Button>
          </DialogTrigger>
          {d.phone_number && (
            <Button asChild size="sm" variant="secondary">
              <a href={`https://wa.me/${d.phone_number.replace(/\D/g, "")}?text=${waText}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4 mr-1" /> WA
              </a>
            </Button>
          )}
        </div>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah cicilan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nominal (Rp)</Label><Input type="number" min={0} value={payAmt} onChange={(e) => setPayAmt(e.target.value)} /></div>
            <Button className="w-full" onClick={() => { const n = parseFloat(payAmt); if (n > 0) { onPay(n); setPayOpen(false); setPayAmt(""); } }}>Catat</Button>
          </div>
        </DialogContent>
      </Dialog>

      {logs.length > 0 && (
        <Collapsible className="mt-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground">
            <span>Riwayat ({logs.length})</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">
            {logs.map((l: any) => (
              <div key={l.id} className="flex justify-between text-xs bg-muted/40 rounded-md px-2 py-1.5">
                <span>#{l.installment_number} · {new Date(l.payment_date).toLocaleDateString("id-ID")}</span>
                <span className="font-semibold">{formatRupiah(l.amount_paid)}</span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function AddDebtForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const [type, setType] = useState("hutang");
  const [person_name, setName] = useState("");
  const [phone_number, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [total_amount, setAmt] = useState(0);
  const [monthly_installment, setInst] = useState(0);
  const [start_date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ type, person_name, phone_number, address, total_amount, monthly_installment, start_date }); }} className="space-y-3">
      <div>
        <Label>Jenis</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hutang">Hutang (saya berhutang)</SelectItem>
            <SelectItem value="piutang">Piutang (orang berhutang ke saya)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Nama</Label><Input required value={person_name} onChange={(e) => setName(e.target.value)} /></div>
      <div><Label>No. WhatsApp</Label><Input value={phone_number} onChange={(e) => setPhone(e.target.value)} placeholder="62812..." /></div>
      <div><Label>Alamat (opsional)</Label><Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Total (Rp)</Label><Input required type="number" min={0} value={total_amount} onChange={(e) => setAmt(parseFloat(e.target.value) || 0)} /></div>
        <div><Label>Cicilan/bln</Label><Input type="number" min={0} value={monthly_installment} onChange={(e) => setInst(parseFloat(e.target.value) || 0)} /></div>
      </div>
      <div><Label>Tanggal mulai</Label><Input type="date" value={start_date} onChange={(e) => setDate(e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={busy}>Simpan</Button>
    </form>
  );
}
