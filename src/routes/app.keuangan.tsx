import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, cn, daysUntil, normalizePhone } from "@/lib/utils";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, MessageCircle, ChevronDown, FileDown,
  TrendingDown, Coins, Wallet, Banknote, Calendar, ReceiptText, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";

async function tryFeedInsert(payload: Record<string, unknown>) {
  try { await supabase.from("activity_feed").insert(payload); } catch {}
}

const keuanganSearchSchema = z.object({
  tab: z.enum(["tagihan", "hutang-piutang"]).optional().default("tagihan"),
});

export const Route = createFileRoute("/app/keuangan")({
  head: () => ({ meta: [{ title: "Keuangan — Rewang" }] }),
  validateSearch: keuanganSearchSchema,
  component: KeuanganPage,
});

function KeuanganPage() {
  const { profile, family } = useAuth();
  const { T } = useLang();
  const familyId = family?.id;
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/app/keuangan" });
  const search = Route.useSearch();
  const [tab, setTab] = useState<"tagihan" | "hutang-piutang">(search.tab);
  const [view, setView] = useState<"all" | "hutang" | "piutang">("all");
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);

  // ---- BILLS (Tagihan) ----
  const { data: bills = [] } = useQuery({
    queryKey: ["bills", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addBill = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("bills").insert({ ...v, family_id: familyId! });
      if (error) throw error;
    },
    onSuccess: (_data, v) => {
      qc.invalidateQueries({ queryKey: ["bills", familyId] });
      qc.invalidateQueries({ queryKey: ["beranda-stats", familyId] });
      qc.invalidateQueries({ queryKey: ["next-bill", familyId] });
      toast.success(T("Tagihan disimpan", "Bill saved"));
      setBillDialogOpen(false);
      tryFeedInsert({
        family_id: familyId!,
        actor_id: profile?.id,
        actor_name: profile?.full_name ?? "",
        action_type: "create_bill",
        entity_type: "bill",
        description: `menambahkan tagihan "${v.bill_name}" ${formatRupiah(v.nominal)}`,
      });
    },
  });

  const payBill = useMutation({
    mutationFn: async (bill: any) => {
      const now = new Date().toISOString();
      const { error } = await supabase.from("bills").update({ is_paid: true, paid_at: now }).eq("id", bill.id);
      if (error) throw error;
      await supabase.from("bill_payments").insert({
        family_id: familyId!,
        bill_id: bill.id,
        amount: bill.nominal,
        paid_by: profile?.id,
        paid_by_name: profile?.full_name,
      });
    },
    onSuccess: (_data, bill) => {
      qc.invalidateQueries({ queryKey: ["bills", familyId] });
      qc.invalidateQueries({ queryKey: ["beranda-stats", familyId] });
      qc.invalidateQueries({ queryKey: ["next-bill", familyId] });
      toast.success(T("Tagihan dilunasi", "Bill paid"));
      tryFeedInsert({
        family_id: familyId!,
        actor_id: profile?.id,
        actor_name: profile?.full_name ?? "",
        action_type: "pay",
        entity_type: "bill",
        description: `melunasi tagihan ${bill.bill_name}`,
      });
    },
  });

  const deleteBill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bills").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills", familyId] });
      qc.invalidateQueries({ queryKey: ["beranda-stats", familyId] });
      qc.invalidateQueries({ queryKey: ["next-bill", familyId] });
      toast.success(T("Dihapus", "Deleted"));
    },
  });

  // ---- DEBTS/CREDITS (Hutang Piutang) ----
  const { data: debts = [] } = useQuery({
    queryKey: ["debts", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("debts_credits")
        .select("*, installment_logs(id, amount_paid, payment_date, installment_number, payment_method, payment_date_input)")
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addDebt = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("debts_credits").insert({ ...v, family_id: familyId! });
      if (error) throw error;
    },
    onSuccess: (_data, v) => {
      qc.invalidateQueries({ queryKey: ["debts", familyId] });
      qc.invalidateQueries({ queryKey: ["beranda-stats", familyId] });
      toast.success(T("Disimpan", "Saved"));
      setDebtDialogOpen(false);
      tryFeedInsert({
        family_id: familyId!,
        actor_id: profile?.id,
        actor_name: profile?.full_name ?? "",
        action_type: "debt",
        entity_type: "debt",
        description: `mencatat ${v.type} ${v.person_name} (${formatRupiah(v.total_amount)})`,
      });
    },
  });

  const delDebt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("debts_credits").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts", familyId] });
      qc.invalidateQueries({ queryKey: ["beranda-stats", familyId] });
      toast.success(T("Dihapus", "Deleted"));
    },
  });

  const payDebt = useMutation({
    mutationFn: async ({
      debt,
      amount,
      method,
      payDate,
    }: {
      debt: any;
      amount: number;
      method: string;
      payDate: string;
    }) => {
      const paid = (debt.installment_logs ?? []).reduce((s: number, l: any) => s + Number(l.amount_paid), 0);
      const nextNum = (debt.installment_logs?.length ?? 0) + 1;
      const { error } = await supabase.from("installment_logs").insert({
        debt_credit_id: debt.id,
        installment_number: nextNum,
        amount_paid: amount,
        payment_date: payDate,
        payment_date_input: payDate,
        payment_method: method,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { debt, amount, method }) => {
      const paid = (debt.installment_logs ?? []).reduce((s: number, l: any) => s + Number(l.amount_paid), 0);
      qc.invalidateQueries({ queryKey: ["debts", familyId] });
      qc.invalidateQueries({ queryKey: ["beranda-stats", familyId] });
      toast.success(T("Cicilan dicatat", "Payment recorded"));
      tryFeedInsert({
        family_id: familyId!,
        actor_id: profile?.id,
        actor_name: profile?.full_name ?? "",
        action_type: "debt",
        entity_type: "debt",
        description: `mencatat cicilan ${formatRupiah(amount)} (${method}) untuk ${debt.person_name} (total bayar ${formatRupiah(paid + amount)})`,
      });
    },
  });

  const filteredDebts = view === "all" ? debts : debts.filter((d: any) => d.type === view);

  // Bill stats
  const unpaidBills = useMemo(() => bills.filter((b: any) => !b.is_paid), [bills]);
  const paidBills = useMemo(() => bills.filter((b: any) => b.is_paid), [bills]);

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold tracking-tight mb-1">{T("Keuangan", "Finance")}</h1>
      <p className="text-sm text-muted-foreground mb-5">{T("Kelola tagihan & hutang keluarga", "Manage family bills & debts")}</p>

      {/* Tab switcher — Tagihan (left), Hutang Piutang (right) */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setTab("tagihan"); navigate({ search: { tab: "tagihan" }, replace: true }); }}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
            tab === "tagihan"
              ? "bg-primary text-primary-foreground border-primary font-extrabold scale-[1.02] shadow-md"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <ReceiptText className="h-4 w-4 inline mr-1" />
          {T("Tagihan", "Bills")} {unpaidBills.length > 0 && <span className="ml-1 text-xs opacity-80">({unpaidBills.length})</span>}
        </button>
        <button
          onClick={() => { setTab("hutang-piutang"); navigate({ search: { tab: "hutang-piutang" }, replace: true }); }}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
            tab === "hutang-piutang"
              ? "bg-primary text-primary-foreground border-primary font-extrabold scale-[1.02] shadow-md"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <TrendingDown className="h-4 w-4 inline mr-1" />
          {T("Hutang Piutang", "Debts & Credits")}
        </button>
      </div>

      {/* ====== TAGIHAN TAB ====== */}
      {tab === "tagihan" && (
        <>
          {/* Add Bill Dialog */}
          <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full mb-4 rounded-xl">
                <Plus className="h-4 w-4 mr-1" /> {T("Tambah Tagihan", "Add Bill")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{T("Tambah Tagihan", "Add Bill")}</DialogTitle>
              </DialogHeader>
              <AddBillForm
                onSubmit={(v) => addBill.mutate(v)}
                busy={addBill.isPending}
              />
            </DialogContent>
          </Dialog>

          {/* Unpaid bills first */}
          {bills.length === 0 ? (
            <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
              <ReceiptText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">{T("Tidak ada tagihan", "No bills")}</p>
            </div>
          ) : (
            <div className="space-y-3 mb-24">
              {/* Unpaid section */}
              {unpaidBills.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-destructive dark:text-red-400 mt-1">
                    {T("Belum Lunas", "Unpaid")} ({unpaidBills.length})
                  </h3>
                  {unpaidBills.map((b: any) => (
                    <BillCard
                      key={b.id}
                      bill={b}
                      onDelete={(id) => deleteBill.mutate(id)}
                      onPay={(bill) => payBill.mutate(bill)}
                    />
                  ))}
                </>
              )}

              {/* Paid section */}
              {paidBills.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-4">
                    {T("Lunas", "Paid")} ({paidBills.length})
                  </h3>
                  {paidBills.map((b: any) => (
                    <BillCard
                      key={b.id}
                      bill={b}
                      onDelete={(id) => deleteBill.mutate(id)}
                      onPay={() => {}}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ====== HUTANG PIUTANG TAB ====== */}
      {tab === "hutang-piutang" && (
        <>
          {/* Sub filter */}
          <div className="flex gap-2 mb-3">
            {(["all", "hutang", "piutang"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "flex-1 px-3 py-2 rounded-xl text-xs capitalize border transition-all",
                  view === v
                    ? "bg-primary text-primary-foreground border-primary font-extrabold scale-[1.02] shadow-md"
                    : "bg-card border-border text-muted-foreground font-medium hover:text-foreground"
                )}
              >
                {v === "all" ? T("Semua", "All") : v === "hutang" ? T("Hutang", "Debt") : T("Piutang", "Credit")}
              </button>
            ))}
          </div>

          <div className="space-y-3 mb-24">
            {filteredDebts.length === 0 && (
              <p className="text-center py-12 text-muted-foreground text-sm">
                {T("Belum ada catatan", "No records yet")}
              </p>
            )}
            {filteredDebts.map((d: any) => (
              <DebtCard
                key={d.id}
                d={d}
                onDelete={(id) => delDebt.mutate(id)}
                onPay={(amount, method, payDate) =>
                  payDebt.mutate({ debt: d, amount, method, payDate })
                }
              />
            ))}
          </div>

          {/* Floating add button for debts */}
          <Dialog open={debtDialogOpen} onOpenChange={setDebtDialogOpen}>
            <DialogTrigger asChild>
              <Button className="fixed bottom-24 left-1/2 -translate-x-1/2 shadow-card rounded-full h-12 px-5" size="lg">
                <Plus className="h-5 w-5 mr-1" /> {T("Catat Baru", "New Record")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{T("Hutang / Piutang baru", "New Debt / Credit")}</DialogTitle>
              </DialogHeader>
              <AddDebtForm onSubmit={(v) => addDebt.mutate(v)} busy={addDebt.isPending} />
            </DialogContent>
          </Dialog>
        </>
      )}
    </MainLayout>
  );
}

// ========== BILL CARD ==========
function BillCard({
  bill,
  onDelete,
  onPay,
}: {
  bill: any;
  onDelete: (id: string) => void;
  onPay: (bill: any) => void;
}) {
  const { T } = useLang();
  const days = daysUntil(bill.due_date);
  const overdue = days < 0;
  const isPaid = bill.is_paid;

  return (
    <div
      className={cn(
        "bg-card border rounded-2xl p-4 shadow-soft transition",
        isPaid
          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10"
          : overdue
            ? "border-destructive/30 bg-destructive/5"
            : "border-border",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "font-semibold text-sm truncate",
                isPaid && "line-through text-muted-foreground",
              )}
            >
              {bill.bill_name}
            </h3>
            {bill.is_recurring && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Berulang</span>
            )}
          </div>
          <p className="text-lg font-bold mt-0.5">{formatRupiah(bill.nominal)}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span>
              {T("Jatuh tempo", "Due")}: {new Date(bill.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {bill.bill_type && <span className="capitalize px-1.5 py-0.5 rounded bg-muted text-xs">{bill.bill_type}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if (window.confirm("Hapus tagihan ini?")) onDelete(bill.id); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

          {!isPaid && (
            <>
              {overdue ? (
                <span className="text-[10px] text-destructive font-bold">
                  {T("Telat", "Overdue")} {-days} {T("hari", "days")}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  {days === 0 ? T("Hari ini", "Today") : `${days} ${T("hari lagi", "days left")}`}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onPay(bill)}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" /> {T("Lunasi", "Pay")}
              </Button>
            </>
          )}

          {isPaid && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ {T("Lunas", "Paid")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== ADD BILL FORM ==========
function AddBillForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const { T } = useLang();
  const [bill_name, setName] = useState("");
  const [nominal, setNominal] = useState("");
  const [due_date, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [is_recurring, setIsRecurring] = useState(false);
  const [bill_type, setBillType] = useState("tagihan");
  const [notes, setNotes] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ bill_name, nominal: Number(nominal) || 0, due_date, is_recurring, bill_type, notes: notes.trim() || null, is_paid: false });
      }}
      className="space-y-3"
    >
      <div>
        <Label>{T("Nama Tagihan", "Bill Name")}</Label>
        <Input required value={bill_name} onChange={(e) => setName(e.target.value)} placeholder={T("Contoh: Listrik PLN", "e.g. Electricity")} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>{T("Nominal (Rp)", "Amount (Rp)")}</Label>
          <Input required type="number" min={0} value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>{T("Jatuh Tempo", "Due Date")}</Label>
          <Input type="date" value={due_date} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>{T("Jenis", "Type")}</Label>
        <Select value={bill_type} onValueChange={setBillType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tagihan">{T("Tagihan", "Bill")}</SelectItem>
            <SelectItem value="listrik">{T("Listrik", "Electricity")}</SelectItem>
            <SelectItem value="air">{T("Air", "Water")}</SelectItem>
            <SelectItem value="internet">{T("Internet", "Internet")}</SelectItem>
            <SelectItem value="sewa">{T("Sewa", "Rent")}</SelectItem>
            <SelectItem value="asuransi">{T("Asuransi", "Insurance")}</SelectItem>
            <SelectItem value="lainnya">{T("Lainnya", "Other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between py-2">
        <div>
          <Label className="text-sm">{T("Tagihan Berulang", "Recurring Bill")}</Label>
          <p className="text-[11px] text-muted-foreground">{T("Terjadi tiap bulan", "Every month")}</p>
        </div>
        <Switch checked={is_recurring} onCheckedChange={setIsRecurring} />
      </div>
      <div>
        <Label>{T("Catatan", "Notes")}</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={T("Opsional", "Optional")} />
      </div>
      <Button type="submit" className="w-full" disabled={busy || !bill_name.trim() || !nominal || Number(nominal) <= 0}>
        {T("Simpan", "Save")}
      </Button>
    </form>
  );
}

// ========== DEBT CARD ==========
function DebtCard({
  d,
  onDelete,
  onPay,
}: {
  d: any;
  onDelete: (id: string) => void;
  onPay: (amount: number, method: string, payDate: string) => void;
}) {
  const { T } = useLang();
  const paid = (d.installment_logs ?? []).reduce((s: number, l: any) => s + Number(l.amount_paid), 0);
  const remaining = Math.max(0, Number(d.total_amount) - paid);
  const progress = Number(d.total_amount) > 0 ? Math.min(100, (paid / Number(d.total_amount)) * 100) : 0;
  const monthsLeft =
    Number(d.monthly_installment) > 0 ? Math.ceil(remaining / Number(d.monthly_installment)) : null;
  const isHutang = d.type === "hutang";
  const isLunas = remaining <= 0;

  const waText = encodeURIComponent(
    isHutang
      ? `Halo ${d.person_name}, ini pengingat cicilan saya. Sisa: ${formatRupiah(remaining)}`
      : `Halo ${d.person_name}, ini pengingat cicilan Anda. Sisa: ${formatRupiah(remaining)}`
  );

  const [payAmt, setPayAmt] = useState<string>("");
  const [payMethod, setPayMethod] = useState("Transfer");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payOpen, setPayOpen] = useState(false);
  const logs = [...(d.installment_logs ?? [])].sort(
    (a: any, b: any) => (a.installment_number || 0) - (b.installment_number || 0)
  );

  const handlePay = () => {
    const n = parseFloat(payAmt);
    if (n > 0 && n <= remaining) {
      onPay(n, payMethod, payDate);
      setPayOpen(false);
      setPayAmt("");
      setPayMethod("Transfer");
      setPayDate(new Date().toISOString().slice(0, 10));
    } else if (n > remaining) {
      toast.error(T("Nominal melebihi sisa yang harus dibayar", "Amount exceeds remaining balance"));
    }
  };

  const exportPDF = () => {
    const title = isHutang
      ? `Laporan Hutang - ${d.person_name}`
      : `Laporan Piutang - ${d.person_name}`;
    const statusLabel = isLunas ? "LUNAS ✅" : remaining < Number(d.total_amount) ? "CICILAN BERJALAN" : "BELUM LUNAS";
    const paymentMethod = (l: any) => l.payment_method || "Cash";
    const paymentDate = (l: any) => l.payment_date_input || l.payment_date;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; padding: 32px; max-width: 640px; margin: 0 auto; color: #1a1a1a; font-size: 13px; line-height: 1.5; }
      .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e0e0e0; }
      .header .app-name { font-size: 18px; font-weight: 700; color: #2d7340; }
      .header .report-title { font-size: 14px; font-weight: 600; margin-top: 3px; color: #333; }
      .header .meta { font-size: 10px; color: #888; margin-top: 4px; }
      .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; margin: 8px 0; }
      .status-badge.unpaid { background: #fee2e2; color: #b91c1c; }
      .status-badge.partial { background: #fef3c7; color: #92400e; }
      .status-badge.paid { background: #d1fae5; color: #065f46; }
      .remaining-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin: 12px 0; text-align: center; }
      .remaining-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; }
      .remaining-box .amount { font-size: 22px; font-weight: 800; color: ${isHutang ? "#dc2626" : "#059669"}; margin-top: 2px; }
      .info-section { margin: 18px 0; }
      .info-row { display: flex; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
      .info-row .key { width: 140px; font-weight: 600; color: #555; flex-shrink: 0; }
      .info-row .val { flex: 1; }
      .financial-summary { background: #f9fafb; border-radius: 10px; padding: 14px; margin: 18px 0; }
      .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
      .summary-row .label { color: #666; }
      .summary-row .value { font-weight: 600; }
      .progress-bar { background: #e5e7eb; border-radius: 99px; height: 8px; margin-top: 10px; overflow: hidden; }
      .progress-fill { height: 8px; border-radius: 99px; background: ${isHutang ? "#dc2626" : "#059669"}; width: ${progress}%; }
      table { width: 100%; border-collapse: collapse; margin: 14px 0; }
      th { background: #f9fafb; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 2px solid #e0e0e0; }
      td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
      .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #aaa; text-align: center; }
      .footer .brand { font-weight: 600; color: #2d7340; }
    </style></head><body>
    <div class="header">
      <div class="app-name">Rewang</div>
      <div class="report-title">${title}</div>
      <div class="meta">Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} &middot; Generated by Rewang</div>
    </div>
    <div class="status-badge ${isLunas ? "paid" : paid > 0 ? "partial" : "unpaid"}">${statusLabel}</div>
    ${!isLunas ? `<div class="remaining-box"><div class="label">${isHutang ? "Sisa Hutang" : "Sisa Piutang"}</div><div class="amount">${formatRupiah(remaining)}</div></div>` : ""}
    <div class="info-section">
      <div class="info-row"><span class="key">Nama</span><span class="val">${d.person_name}</span></div>
      ${d.phone_number ? `<div class="info-row"><span class="key">WhatsApp</span><span class="val">${d.phone_number}</span></div>` : ""}
      ${d.address ? `<div class="info-row"><span class="key">Alamat</span><span class="val">${d.address}</span></div>` : ""}
      <div class="info-row"><span class="key">Jenis</span><span class="val">${isHutang ? "Hutang (Saya Berhutang)" : "Piutang (Berhutang ke Saya)"}</span></div>
      ${d.start_date ? `<div class="info-row"><span class="key">Tanggal Mulai</span><span class="val">${new Date(d.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span></div>` : ""}
      ${d.monthly_installment ? `<div class="info-row"><span class="key">Cicilan per Bulan</span><span class="val">${formatRupiah(d.monthly_installment)}</span></div>` : ""}
    </div>
    <div class="financial-summary">
      <div style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin-bottom:6px;">Ringkasan Keuangan</div>
      <div class="summary-row"><span class="label">Total ${isHutang ? "Hutang" : "Piutang"}</span><span class="value">${formatRupiah(d.total_amount)}</span></div>
      <div class="summary-row"><span class="label">Total Terbayar</span><span class="value">${formatRupiah(paid)}</span></div>
      <div class="summary-row"><span class="label">Sisa</span><span class="value" style="color:${isHutang ? "#dc2626" : "#059669"}">${formatRupiah(remaining)}</span></div>
      <div class="summary-row"><span class="label">Progress</span><span class="value">${progress.toFixed(1)}%</span></div>
      <div class="progress-bar"><div class="progress-fill"></div></div>
    </div>
    ${logs.length > 0 ? `
    <div style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin:18px 0 8px;color:#555;">Riwayat Pembayaran</div>
    <table>
      <thead><tr><th>Tanggal</th><th>Nominal</th><th>Metode / Catatan</th></tr></thead>
      <tbody>
        ${logs.map((l: any) => `
        <tr>
          <td>${new Date(paymentDate(l)).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</td>
          <td>${formatRupiah(l.amount_paid)}</td>
          <td>${paymentMethod(l)}</td>
        </tr>`).join("")}
      </tbody>
    </table>` : ""}
    ${isLunas ? `<div style="text-align:center;margin:20px 0;padding:14px;background:#d1fae5;border-radius:10px;font-weight:700;color:#065f46;">LUNAS ✅</div>` : ""}
    <div class="footer">Generated by <span class="brand">Rewang</span><br>Family Household Management System</div>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                isHutang ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success-foreground"
              )}
            >
              {isHutang ? T("Hutang", "Debt") : T("Piutang", "Credit")}
            </span>
            {isLunas && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                LUNAS
              </span>
            )}
            <h3 className="font-semibold truncate">{d.person_name}</h3>
          </div>
          {d.phone_number && <p className="text-xs text-muted-foreground mt-0.5">{d.phone_number}</p>}
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={exportPDF} title="Unduh PDF">
            <FileDown className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if (window.confirm("Hapus catatan ini?")) onDelete(d.id); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {T("Terbayar", "Paid")}: {formatRupiah(paid)}
          </span>
          <span className="font-semibold">{formatRupiah(d.total_amount)}</span>
        </div>
        <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-2.5 rounded-full transition-all",
              isLunas
                ? "bg-emerald-500"
                : isHutang
                  ? "bg-gradient-to-r from-destructive to-destructive/70"
                  : "bg-gradient-to-r from-emerald-400 to-emerald-600"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="font-medium">
            {progress.toFixed(0)}% · {T("sisa", "remaining")} {formatRupiah(remaining)}
          </span>
          {monthsLeft !== null && monthsLeft > 0 && (
            <span className="text-muted-foreground">~{monthsLeft} {T("bulan lagi", "more months")}</span>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      {!isLunas && (
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <div className="flex gap-2 mt-3">
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() =>
                  setPayAmt(String(d.monthly_installment || ""))
                }
              >
                <Wallet className="h-3.5 w-3.5 mr-1" /> {T("Bayar", "Pay")}
              </Button>
            </DialogTrigger>
            {d.phone_number && (
              <Button asChild size="sm" variant="secondary">
                <a
                  href={`https://wa.me/${normalizePhone(d.phone_number)}?text=${waText}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-1" /> WA
                </a>
              </Button>
            )}
          </div>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {T("Bayar", "Pay")} — {d.person_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                {T("Sisa", "Remaining")}: {formatRupiah(remaining)}{" "}
                {T("dari", "of")} {formatRupiah(d.total_amount)}
              </div>

              <div>
                <Label>{T("Metode Pembayaran", "Payment Method")}</Label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setPayMethod("Transfer")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition",
                      payMethod === "Transfer"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground"
                    )}
                  >
                    <Banknote className="h-4 w-4" /> Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("Cash")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition",
                      payMethod === "Cash"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground"
                    )}
                  >
                    <Coins className="h-4 w-4" /> Cash
                  </button>
                </div>
              </div>

              <div>
                <Label>{T("Nominal (Rp)", "Amount (Rp)")}</Label>
          <Input
                  type="number"
                  min={0}
                  max={remaining}
                  value={payAmt}
                  onChange={(e) => setPayAmt(e.target.value)}
                  placeholder="0"
                />
                {payAmt && parseFloat(payAmt) < remaining && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {T("Bayar sebagian:", "Partial payment:")}{" "}
                    {formatRupiah(parseFloat(payAmt))} ·{" "}
                    {T("Sisa setelah ini:", "Remaining after:")}{" "}
                    {formatRupiah(remaining - parseFloat(payAmt))}
                  </p>
                )}
              </div>

              <div>
                <Label>{T("Tanggal Bayar", "Payment Date")}</Label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handlePay}
                disabled={!payAmt || parseFloat(payAmt) <= 0}
              >
                <Wallet className="h-4 w-4 mr-1" /> {T("Catat Pembayaran", "Record Payment")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment History */}
      {logs.length > 0 && (
        <Collapsible className="mt-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground">
            <span>{T("Riwayat", "History")} ({logs.length})</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">
            {logs.map((l: any) => (
              <div
                key={l.id}
                className="flex justify-between text-xs bg-muted/40 rounded-md px-2 py-1.5"
              >
                <span>
                  #{l.installment_number} ·{" "}
                  {new Date(
                    l.payment_date_input || l.payment_date
                  ).toLocaleDateString("id-ID")}
                  {l.payment_method ? ` · ${l.payment_method}` : ""}
                </span>
                <span className="font-semibold">{formatRupiah(l.amount_paid)}</span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// ========== ADD DEBT FORM ==========
function AddDebtForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const { T } = useLang();
  const [type, setType] = useState("hutang");
  const [person_name, setName] = useState("");
  const [phone_number, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [total_amount, setAmt] = useState("");
  const [monthly_installment, setInst] = useState("");
  const [start_date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ type, person_name, phone_number, address, total_amount: Number(total_amount) || 0, monthly_installment: Number(monthly_installment) || 0, start_date });
      }}
      className="space-y-3"
    >
      <div>
        <Label>{T("Jenis", "Type")}</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hutang">{T("Hutang (saya berhutang)", "Debt (I owe)")}</SelectItem>
            <SelectItem value="piutang">{T("Piutang (orang berhutang ke saya)", "Credit (owed to me)")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{T("Nama", "Name")}</Label>
        <Input required value={person_name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>{T("No. WhatsApp", "WhatsApp No.")}</Label>
        <Input value={phone_number} onChange={(e) => setPhone(e.target.value)} placeholder="62812..." />
      </div>
      <div>
        <Label>{T("Alamat", "Address")} ({T("opsional", "optional")})</Label>
        <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>{T("Total (Rp)", "Total (Rp)")}</Label>
          <Input required type="number" min={0} value={total_amount} onChange={(e) => setAmt(e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>{T("Cicilan/bln", "Installment/mo")}</Label>
          <Input type="number" min={0} value={monthly_installment} onChange={(e) => setInst(e.target.value)} placeholder="0" />
        </div>
      </div>
      <div>
        <Label>{T("Tanggal mulai", "Start date")}</Label>
        <Input type="date" value={start_date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {T("Simpan", "Save")}
      </Button>
    </form>
  );
}