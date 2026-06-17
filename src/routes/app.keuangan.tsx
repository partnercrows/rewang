import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, cn, daysUntil, normalizePhone } from "@/lib/utils";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";
import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { format as fmtDate } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Plus, Trash2, MessageCircle, ChevronDown, FileDown, Search,
  TrendingDown, Coins, Wallet, Banknote, Calendar, ReceiptText, CheckCircle2, BellRing, Lock,
  Users, UserPlus, FileSpreadsheet, Download, ShieldX, Check, X, Edit3, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRecurringBillReset } from "@/hooks/useRecurringReset";

async function tryFeedInsert(payload: Record<string, unknown>) {
  try { await supabase.from("activity_feed").insert(payload as any); } catch {}
}

const keuanganSearchSchema = z.object({
  tab: z.enum(["tagihan", "hutang-piutang", "kolektif"]).optional().default("tagihan"),
});

export const Route = createFileRoute("/app/keuangan")({
  head: () => ({ meta: [{ title: "Keuangan — Rewang" }] }),
  validateSearch: keuanganSearchSchema,
  component: KeuanganPage,
});

function KeuanganPage() {
  const { profile, family } = useAuth();
  const { T } = useLang();
  const limits = useSubscriptionGate();
  const familyId = family?.id;

  if (!limits.canAccessFinance) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold mb-2">{T("Fitur Premium", "Premium Feature")}</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {T(
              "Keuangan tersedia untuk paket Family. Upgrade sekarang untuk mengelola tagihan dan hutang piutang keluarga.",
              "Finance is available for Family plan. Upgrade now to manage bills and family debts."
            )}
          </p>
          <Button asChild className="rounded-xl">
            <Link to="/aktivasi">{T("Upgrade ke Family", "Upgrade to Family")}</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/app/keuangan" });
  const search = Route.useSearch();
  const [tab, setTab] = useState<"tagihan" | "hutang-piutang" | "kolektif">(search.tab);
  const [view, setView] = useState<"all" | "hutang" | "piutang">("all");
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [confirmDeleteBill, setConfirmDeleteBill] = useState<any>(null);
  const [confirmDeleteDebt, setConfirmDeleteDebt] = useState<any>(null);
  const [billSearch, setBillSearch] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState<string>(T("Semua"));
  // Kolektif state
  const [kAddOpen, setKAddOpen] = useState(false);
  const [kDetailId, setKDetailId] = useState<string | null>(null);
  const [kEditId, setKEditId] = useState<string | null>(null);
  const [kDeleteConfirm, setKDeleteConfirm] = useState<any>(null);
  const [kPesertaSearch, setKPesertaSearch] = useState("");
  const [kolektifSearch, setKolektifSearch] = useState("");
  const [kolektifFilter, setKolektifFilter] = useState<"semua" | "berlangsung" | "selesai">("semua");
  const [deletePesertaConfirm, setDeletePesertaConfirm] = useState<{ id: string; nama: string; soft: boolean } | null>(null);

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
      const { error } = await supabase.from("bills").insert({ ...v, family_id: familyId!, last_updated_by: profile?.id, last_updated_by_name: profile?.full_name });
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
      const { error } = await supabase.from("bills").update({ is_paid: true, paid_at: now, last_updated_by: profile?.id, last_updated_by_name: profile?.full_name }).eq("id", bill.id);
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
      const { error } = await supabase.from("debts_credits").insert({ ...v, family_id: familyId!, last_updated_by: profile?.id, last_updated_by_name: profile?.full_name });
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

  // ---- KOLEKTIF ----
  const { data: kolektifList = [] } = useQuery({
    queryKey: ["kolektif", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data: kegiatan, error } = await supabase
        .from("kolektif_kegiatan")
        .select("*, kolektif_peserta(*)")
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return kegiatan ?? [];
    },
  });

  const filteredKolektif = useMemo(() => {
    let result = kolektifList;
    if (kolektifSearch.trim()) {
      const s = kolektifSearch.toLowerCase();
      result = result.filter((kg: any) => kg.nama_kegiatan.toLowerCase().includes(s));
    }
    if (kolektifFilter !== "semua") {
      result = result.filter((kg: any) => (kg.status_kegiatan ?? "berlangsung") === kolektifFilter);
    }
    return result;
  }, [kolektifList, kolektifSearch, kolektifFilter]);

  const addKegiatan = useMutation({
    mutationFn: async (v: any) => {
      const { data: kg, error: e1 } = await supabase
        .from("kolektif_kegiatan")
        .insert({
          family_id: familyId!,
          nama_kegiatan: v.nama_kegiatan,
          sifat_kegiatan: v.sifat_kegiatan,
          jenis_pembayaran: v.jenis_pembayaran,
          jumlah_bayar: v.jumlah_bayar,
          batas_tanggal: v.batas_tanggal || null,
          penanggung_jawab: v.penanggung_jawab || null,
          catatan: v.catatan || null,
          created_by: profile?.id,
          created_by_name: profile?.full_name,
          last_updated_by: profile?.id,
          last_updated_by_name: profile?.full_name,
        } as any)
        .select("id")
        .single();
      if (e1) throw e1;
      const defaultStatus = v.jenis_pembayaran === "iuran_sukarela" ? "belum_bayar" : "belum_bayar";
      const pesertaInserts = v.peserta.map((p: any) => ({
        kegiatan_id: kg.id,
        nama: p.nama,
        alamat: p.alamat || null,
        no_hp: p.no_hp || null,
        status_bayar: defaultStatus,
        nominal: 0,
      }));
      const { error: e2 } = await supabase.from("kolektif_peserta").insert(pesertaInserts);
      if (e2) throw e2;
    },
    onSuccess: (_data, v) => {
      qc.invalidateQueries({ queryKey: ["kolektif", familyId] });
      toast.success(T("Kegiatan kolektif disimpan", "Collective activity saved"));
      setKAddOpen(false);
      tryFeedInsert({
        family_id: familyId!,
        actor_id: profile?.id,
        actor_name: profile?.full_name ?? "",
        action_type: "create_kolektif",
        entity_type: "kolektif",
        description: `membuat kegiatan kolektif "${v.nama_kegiatan}" (${v.jenis_pembayaran === "iuran_rata" ? "Iuran Rata" : "Iuran Sukarela"})`,
      });
    },
  });

  const updateStatusBayar = useMutation({
    mutationFn: async ({ id, status_bayar, nominal, tanggal_bayar }: { id: string; status_bayar: string; nominal: number; tanggal_bayar: string | null }) => {
      const { error } = await supabase
        .from("kolektif_peserta")
        .update({ status_bayar, nominal, tanggal_bayar, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kolektif", familyId] });
      toast.success(T("Status diperbarui", "Status updated"));
    },
  });

  const updatePeserta = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("kolektif_peserta").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kolektif", familyId] });
    },
  });

  const addPesertaToKegiatan = useMutation({
    mutationFn: async ({ kegiatan_id, peserta }: { kegiatan_id: string; peserta: { nama: string; alamat?: string; no_hp?: string }[] }) => {
      const kg = kolektifList.find((k: any) => k.id === kegiatan_id);
      const defaultStatus = kg?.jenis_pembayaran === "iuran_sukarela" ? "belum_bayar" : "belum_bayar";
      const inserts = peserta.map((p) => ({
        kegiatan_id,
        nama: p.nama,
        alamat: p.alamat || null,
        no_hp: p.no_hp || null,
        status_bayar: defaultStatus,
        nominal: 0,
      }));
      const { error } = await supabase.from("kolektif_peserta").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kolektif", familyId] });
      toast.success(T("Peserta ditambahkan", "Participants added"));
    },
  });

  const deletePeserta = useMutation({
    mutationFn: async ({ id, soft }: { id: string; soft: boolean }) => {
      if (soft) {
        const { error } = await supabase.from("kolektif_peserta").update({ is_aktif: false, updated_at: new Date().toISOString() }).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kolektif_peserta").delete().eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kolektif", familyId] });
      setDeletePesertaConfirm(null);
      toast.success(T("Peserta dihapus", "Participant deleted"));
    },
  });

  const updateKegiatan = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("kolektif_kegiatan").update({ ...data, updated_at: new Date().toISOString(), last_updated_by: profile?.id, last_updated_by_name: profile?.full_name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kolektif", familyId] });
      toast.success(T("Kegiatan diperbarui", "Activity updated"));
      setKEditId(null);
    },
  });

  const setKegiatanSelesai = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kolektif_kegiatan").update({
        status_kegiatan: "selesai",
        updated_at: new Date().toISOString(),
        last_updated_by: profile?.id,
        last_updated_by_name: profile?.full_name,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kolektif", familyId] });
      toast.success(T("Kegiatan diselesaikan", "Activity marked done"));
    },
  });

  const setKegiatanBukaKembali = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kolektif_kegiatan").update({
        status_kegiatan: "berlangsung",
        updated_at: new Date().toISOString(),
        last_updated_by: profile?.id,
        last_updated_by_name: profile?.full_name,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kolektif", familyId] });
      toast.success(T("Kegiatan dibuka kembali", "Activity reopened"));
    },
  });

  const deleteKegiatan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kolektif_kegiatan").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kolektif", familyId] });
      toast.success(T("Kegiatan dihapus", "Activity deleted"));
      setKDeleteConfirm(null);
    },
  });

  // Bill stats
  const unpaidBills = useMemo(() => bills.filter((b: any) => !b.is_paid), [bills]);
  const paidBills = useMemo(() => bills.filter((b: any) => b.is_paid), [bills]);

  const filteredUnpaidBills = useMemo(() => {
    let filtered = unpaidBills;
    if (billSearch) {
      const s = billSearch.toLowerCase();
      filtered = filtered.filter((b: any) => (b.bill_name ?? "").toLowerCase().includes(s));
    }
    if (billTypeFilter !== T("Semua")) {
      filtered = filtered.filter((b: any) => b.bill_type === billTypeFilter);
    }
    return filtered;
  }, [unpaidBills, billSearch, billTypeFilter, T]);

  const filteredPaidBills = useMemo(() => {
    let filtered = paidBills;
    if (billSearch) {
      const s = billSearch.toLowerCase();
      filtered = filtered.filter((b: any) => (b.bill_name ?? "").toLowerCase().includes(s));
    }
    if (billTypeFilter !== T("Semua")) {
      filtered = filtered.filter((b: any) => b.bill_type === billTypeFilter);
    }
    return filtered;
  }, [paidBills, billSearch, billTypeFilter, T]);

  const exportBillsPDF = async () => {
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFillColor(0x17, 0x83, 0x7e);
      doc.rect(0, 0, pageW, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Rewang — Laporan Tagihan", 14, 14);
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 14, 26);

      const allBills = [...filteredUnpaidBills, ...filteredPaidBills];
      if (allBills.length === 0) {
        doc.setFontSize(10);
        doc.text(T("Tidak ada tagihan", "No bills"), 14, 36);
      } else {
        autoTable(doc, {
          startY: 30,
          head: [["Nama Tagihan", "Nominal", "Jatuh Tempo", "Status", "Jenis"]],
          body: allBills.map((b: any) => [
            b.bill_name,
            formatRupiah(b.nominal),
            new Date(b.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
            b.is_paid ? "Lunas" : "Belum Lunas",
            b.bill_type ?? "",
          ]),
          theme: "grid",
          headStyles: { fillColor: [0x17, 0x83, 0x7e], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
          bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
          alternateRowStyles: { fillColor: [0xfc, 0xfd, 0xfe] },
          margin: { left: 14, right: 14 },
        });
      }
      doc.setTextColor(170, 170, 170);
      doc.setFontSize(7);
      doc.text("Generated by Rewang — Family Household Management System", pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tagihan.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(T("PDF terunduh", "PDF downloaded"));
    } catch (e: any) {
      toast.error(T("Gagal unduh PDF", "Failed to download PDF") + ": " + (e?.message ?? ""));
    }
  };

  // Auto-reset recurring bills
  useRecurringBillReset(familyId);

  // Track overdue bills that have already been fed to avoid spam
  const overdueFedRef = useRef<Set<string>>(new Set());

  // When bills become overdue, insert into activity_feed
  useMemo(() => {
    if (!familyId || bills.length === 0) return;
    const now = new Date();
    for (const bill of bills) {
      if (bill.is_paid) continue;
      const dueDate = new Date(bill.due_date);
      if (dueDate < now && !overdueFedRef.current.has(bill.id)) {
        overdueFedRef.current.add(bill.id);
        tryFeedInsert({
          family_id: familyId,
          actor_id: profile?.id,
          actor_name: profile?.full_name ?? "",
          action_type: "overdue",
          entity_type: "bill",
          description: `Tagihan "${bill.bill_name}" melewati jatuh tempo — Segera Bayar!`,
        });
      }
    }
  }, [bills, familyId, profile?.id, profile?.full_name]);

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold tracking-tight mb-1">{T("Keuangan", "Finance")}</h1>
      <p className="text-sm text-muted-foreground mb-5">{T("Kelola tagihan & hutang keluarga", "Manage family bills & debts")}</p>

      {/* Tab switcher — Tagihan | Hutang Piutang | Kolektif */}
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
        <button
          onClick={() => { setTab("kolektif"); navigate({ search: { tab: "kolektif" }, replace: true }); }}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
            tab === "kolektif"
              ? "bg-primary text-primary-foreground border-primary font-extrabold scale-[1.02] shadow-md"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-4 w-4 inline mr-1" />
          {T("Kolektif", "Collective")}
        </button>
      </div>

      {/* ====== TAGIHAN TAB ====== */}
      {tab === "tagihan" && (
        <>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder={T("Cari tagihan...", "Search bills...")} value={billSearch} onChange={(e) => setBillSearch(e.target.value)} />
            </div>
            <Select value={billTypeFilter} onValueChange={setBillTypeFilter}>
              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={T("Semua")}>{T("Semua", "All")}</SelectItem>
                <SelectItem value="tagihan">{T("Tagihan", "Bill")}</SelectItem>
                <SelectItem value="listrik">{T("Listrik", "Electricity")}</SelectItem>
                <SelectItem value="air">{T("Air", "Water")}</SelectItem>
                <SelectItem value="internet">{T("Internet", "Internet")}</SelectItem>
                <SelectItem value="sewa">{T("Sewa", "Rent")}</SelectItem>
                <SelectItem value="asuransi">{T("Asuransi", "Insurance")}</SelectItem>
                <SelectItem value="lainnya">{T("Lainnya", "Other")}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" variant="outline" className="h-10 w-10 shrink-0" onClick={exportBillsPDF} title={T("Unduh PDF Tagihan", "Download Bills PDF")}>
              <FileDown className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full mb-4 rounded-xl"><Plus className="h-4 w-4 mr-1" /> {T("Tambah Tagihan", "Add Bill")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{T("Tambah Tagihan", "Add Bill")}</DialogTitle></DialogHeader>
              <AddBillForm onSubmit={(v) => addBill.mutate(v)} busy={addBill.isPending} />
            </DialogContent>
          </Dialog>

          {bills.length === 0 ? (
            <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
              <ReceiptText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">{T("Tidak ada tagihan", "No bills")}</p>
            </div>
          ) : (
            <div className="space-y-3 mb-24">
              {filteredUnpaidBills.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-destructive dark:text-red-400 mt-1">{T("Belum Lunas", "Unpaid")} ({filteredUnpaidBills.length})</h3>
                  {filteredUnpaidBills.map((b: any) => (<BillCard key={b.id} bill={b} onDelete={(id) => deleteBill.mutate(id)} onPay={(bill) => payBill.mutate(bill)} onDeletePrompt={setConfirmDeleteBill} />))}
                </>
              )}
              {filteredPaidBills.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-4">{T("Lunas", "Paid")} ({filteredPaidBills.length})</h3>
                  {filteredPaidBills.map((b: any) => (<BillCard key={b.id} bill={b} onDelete={(id) => deleteBill.mutate(id)} onPay={() => {}} onDeletePrompt={setConfirmDeleteBill} />))}
                </>
              )}
              {filteredUnpaidBills.length === 0 && filteredPaidBills.length === 0 && (<p className="text-center py-8 text-muted-foreground text-sm">{T("Tidak ada hasil", "No results")}</p>)}
            </div>
          )}
        </>
      )}

      {/* ====== HUTANG PIUTANG TAB ====== */}
      {tab === "hutang-piutang" && (
        <>
          <div className="flex gap-2 mb-3">
            {(["all", "hutang", "piutang"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn("flex-1 px-3 py-2 rounded-xl text-xs capitalize border transition-all", view === v ? "bg-primary text-primary-foreground border-primary font-extrabold scale-[1.02] shadow-md" : "bg-card border-border text-muted-foreground font-medium hover:text-foreground")}>
                {v === "all" ? T("Semua", "All") : v === "hutang" ? T("Hutang", "Debt") : T("Piutang", "Credit")}
              </button>
            ))}
          </div>
          <div className="space-y-3 mb-24">
            {filteredDebts.length === 0 && (<p className="text-center py-12 text-muted-foreground text-sm">{T("Belum ada catatan", "No records yet")}</p>)}
            {filteredDebts.map((d: any) => (<DebtCard key={d.id} d={d} onDelete={(id) => delDebt.mutate(id)} onPay={(amount, method, payDate) => payDebt.mutate({ debt: d, amount, method, payDate })} onDeletePrompt={setConfirmDeleteDebt} />))}
          </div>
          <Dialog open={debtDialogOpen} onOpenChange={setDebtDialogOpen}>
            <DialogTrigger asChild>
              <Button className="fixed bottom-24 left-1/2 -translate-x-1/2 shadow-card rounded-full h-12 px-5" size="lg"><Plus className="h-5 w-5 mr-1" /> {T("Catat Baru", "New Record")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{T("Hutang / Piutang baru", "New Debt / Credit")}</DialogTitle></DialogHeader>
              <AddDebtForm onSubmit={(v) => addDebt.mutate(v)} busy={addDebt.isPending} />
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* ====== KOLEKTIF TAB ====== */}
      {tab === "kolektif" && (
        <>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={T("Cari kegiatan...", "Search activities...")} value={kolektifSearch} onChange={(e) => setKolektifSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 mb-3">
            {(["semua", "berlangsung", "selesai"] as const).map((v) => (
              <button key={v} onClick={() => setKolektifFilter(v)} className={cn("flex-1 px-3 py-2 rounded-xl text-xs capitalize border transition-all", kolektifFilter === v ? "bg-primary text-primary-foreground border-primary font-extrabold scale-[1.02] shadow-md" : "bg-card border-border text-muted-foreground font-medium hover:text-foreground")}>
                {v === "semua" ? T("Semua", "All") : v === "berlangsung" ? T("Berlangsung", "Ongoing") : T("Selesai", "Done")}
              </button>
            ))}
          </div>

          <div className="space-y-3 mb-24">
            {filteredKolektif.length === 0 ? (
              <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
                <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">{kolektifSearch.trim() ? T("Tidak ada hasil pencarian", "No search results") : T("Belum ada kegiatan kolektif", "No collective activities yet")}</p>
              </div>
            ) : (
              filteredKolektif.map((kg: any) => {
                const peserta = (kg.kolektif_peserta ?? []).filter((p: any) => p.is_aktif !== false);
                const isRata = kg.jenis_pembayaran === "iuran_rata";
                const totalTerkumpul = peserta.reduce((s: number, p: any) => s + Number(p.nominal), 0);
                const lunasCount = peserta.filter((p: any) => p.status_bayar === "lunas").length;
                const totalPeserta = isRata ? peserta.length : peserta.filter((p: any) => p.status_bayar !== "absen").length;
                return (<KegiatanCard key={kg.id} kg={kg} onDetail={() => setKDetailId(kg.id)} onDelete={() => setKDeleteConfirm(kg)} lunasCount={lunasCount} totalPeserta={totalPeserta} totalTerkumpul={totalTerkumpul} />);
              })
            )}
          </div>

          <Dialog open={kAddOpen} onOpenChange={setKAddOpen}>
            <DialogTrigger asChild>
              <Button className="fixed bottom-24 left-1/2 -translate-x-1/2 shadow-card rounded-full h-12 px-5" size="lg"><Plus className="h-5 w-5 mr-1" /> {T("Kegiatan Baru", "New Activity")}</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{T("Tambah Kegiatan Kolektif", "Add Collective Activity")}</DialogTitle></DialogHeader>
              <AddKegiatanForm onSubmit={(v) => addKegiatan.mutate(v)} busy={addKegiatan.isPending} />
            </DialogContent>
          </Dialog>

          {/* Detail Kegiatan Dialog */}
          <Dialog open={!!kDetailId} onOpenChange={(open) => { if (!open) { setKDetailId(null); setKPesertaSearch(""); } }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{T("Detail Kegiatan", "Activity Detail")}</DialogTitle></DialogHeader>
              {kDetailId && (() => {
                const kg = kolektifList.find((k: any) => k.id === kDetailId);
                if (!kg) return <p className="text-muted-foreground text-sm">{T("Tidak ditemukan", "Not found")}</p>;
                const peserta = (kg.kolektif_peserta ?? []).filter((p: any) => p.is_aktif !== false);
                const isRata = kg.jenis_pembayaran === "iuran_rata";
                const targetNominal = kg.jumlah_bayar ?? 0;
                const searchFilter = kPesertaSearch.toLowerCase();
                const filtered = peserta.filter((p: any) => !kPesertaSearch || p.nama.toLowerCase().includes(searchFilter));
                return (
                  <DetailKegiatan
                    kg={kg} peserta={filtered} allPeserta={peserta} isRata={isRata} targetNominal={targetNominal}
                    onLunas={(id, nominal) => updateStatusBayar.mutate({ id, status_bayar: "lunas", nominal, tanggal_bayar: new Date().toISOString() })}
                    onAbsen={(id) => updateStatusBayar.mutate({ id, status_bayar: "absen", nominal: 0, tanggal_bayar: null })}
                    onEditNominal={(id, nominal) => updatePeserta.mutate({ id, data: { nominal } })}
                    onDeletePeserta={(id, nama, soft) => setDeletePesertaConfirm({ id, nama, soft })}
                    onAddPeserta={(pes) => addPesertaToKegiatan.mutate({ kegiatan_id: kg.id, peserta: pes })}
                    onEditKegiatan={() => { setKDetailId(null); setKEditId(kg.id); }}
                    onSelesai={() => setKegiatanSelesai.mutate(kg.id)}
                    onBukaKembali={() => setKegiatanBukaKembali.mutate(kg.id)}
                    kPesertaSearch={kPesertaSearch} setKPesertaSearch={setKPesertaSearch}
                  />
                );
              })()}
            </DialogContent>
          </Dialog>

          {/* Edit Kegiatan Dialog */}
          <Dialog open={!!kEditId} onOpenChange={(open) => { if (!open) setKEditId(null); }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{T("Edit Kegiatan", "Edit Activity")}</DialogTitle></DialogHeader>
              {kEditId && (() => {
                const kg = kolektifList.find((k: any) => k.id === kEditId);
                if (!kg) return <p className="text-muted-foreground text-sm">{T("Tidak ditemukan", "Not found")}</p>;
                const peserta = kg.kolektif_peserta ?? [];
                const hasLunas = peserta.some((p: any) => p.status_bayar === "lunas");
                return (
                  <EditKegiatanForm kg={kg} peserta={peserta} hasLunas={hasLunas}
                    onUpdate={(id, data) => updateKegiatan.mutate({ id, data })}
                    onAddPeserta={(pes) => addPesertaToKegiatan.mutate({ kegiatan_id: kg.id, peserta: pes })}
                    onDeletePeserta={(id) => deletePeserta.mutate({ id, soft: hasLunas })}
                    busy={updateKegiatan.isPending} onCancel={() => setKEditId(null)}
                  />
                );
              })()}
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Confirm Delete Kegiatan */}
      <ConfirmDialog open={!!kDeleteConfirm} onOpenChange={(open) => { if (!open) setKDeleteConfirm(null); }} title={T("Hapus Kegiatan", "Delete Activity")} description={kDeleteConfirm ? T(`Yakin ingin menghapus kegiatan "${kDeleteConfirm.nama_kegiatan}"? Semua data peserta akan diarsipkan.`, `Are you sure you want to delete "${kDeleteConfirm.nama_kegiatan}"? All participant data will be archived.`) : ""} confirmLabel={T("Hapus", "Delete")} variant="destructive" onConfirm={() => { if (kDeleteConfirm) deleteKegiatan.mutate(kDeleteConfirm.id); }} />
      <ConfirmDialog open={!!deletePesertaConfirm} onOpenChange={(open) => { if (!open) setDeletePesertaConfirm(null); }} title={T("Hapus Peserta", "Delete Participant")} description={deletePesertaConfirm ? T(`Yakin ingin menghapus peserta "${deletePesertaConfirm.nama}"?`, `Are you sure you want to delete "${deletePesertaConfirm.nama}"?`) : ""} confirmLabel={T("Hapus", "Delete")} variant="destructive" onConfirm={() => { if (deletePesertaConfirm) { deletePeserta.mutate({ id: deletePesertaConfirm.id, soft: deletePesertaConfirm.soft }); } }} />
      <ConfirmDialog open={!!confirmDeleteBill} onOpenChange={(open) => { if (!open) setConfirmDeleteBill(null); }} title={T("Hapus Tagihan", "Delete Bill")} description={confirmDeleteBill ? T(`Yakin ingin menghapus tagihan "${confirmDeleteBill.bill_name}"?`, `Are you sure you want to delete bill "${confirmDeleteBill.bill_name}"?`) : ""} confirmLabel={T("Hapus", "Delete")} variant="destructive" onConfirm={() => { if (confirmDeleteBill) { deleteBill.mutate(confirmDeleteBill.id); setConfirmDeleteBill(null); } }} />
      <ConfirmDialog open={!!confirmDeleteDebt} onOpenChange={(open) => { if (!open) setConfirmDeleteDebt(null); }} title={T("Hapus Catatan", "Delete Record")} description={confirmDeleteDebt ? T(`Yakin ingin menghapus catatan ${confirmDeleteDebt.type === "hutang" ? "hutang" : "piutang"} dari "${confirmDeleteDebt.person_name}"?`, `Are you sure you want to delete this ${confirmDeleteDebt.type === "hutang" ? "debt" : "credit"} record from "${confirmDeleteDebt.person_name}"?`) : ""} confirmLabel={T("Hapus", "Delete")} variant="destructive" onConfirm={() => { if (confirmDeleteDebt) { delDebt.mutate(confirmDeleteDebt.id); setConfirmDeleteDebt(null); } }} />
    </MainLayout>
  );
}

// ========== BILL CARD ==========
function BillCard({ bill, onDelete, onPay, onDeletePrompt }: { bill: any; onDelete: (id: string) => void; onPay: (bill: any) => void; onDeletePrompt: (bill: any) => void }) {
  const { T } = useLang();
  const days = daysUntil(bill.due_date);
  const overdue = days < 0;
  const isPaid = bill.is_paid;
  return (
    <div className={cn("bg-card border rounded-2xl p-4 shadow-soft transition", isPaid ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10" : overdue ? "border-destructive/30 bg-destructive/5" : "border-border")}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn("font-semibold text-sm truncate", isPaid && "line-through text-muted-foreground")}>{bill.bill_name}</h3>
            {bill.is_recurring && <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">{bill.recurrence_interval === "yearly" ? "Tiap Tahun" : "Tiap Bulan"}</span>}
            {bill.reminder_days && !bill.is_paid && days >= 1 && days <= bill.reminder_days && (<span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium"><BellRing className="h-3 w-3" /> H-{days}</span>)}
          </div>
          <p className="text-lg font-bold mt-0.5">{formatRupiah(bill.nominal)}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span>{T("Jatuh tempo", "Due")}: {new Date(bill.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
            {bill.bill_type && <span className="capitalize px-1.5 py-0.5 rounded bg-muted text-xs">{bill.bill_type}</span>}
          </div>
          {bill.last_updated_by_name && <p className="text-[10px] text-muted-foreground mt-0.5">{T("Diupdate oleh")} {bill.last_updated_by_name}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDeletePrompt(bill)}><Trash2 className="h-3.5 w-3.5" /></Button>
          {!isPaid && (<>
            {overdue ? <span className="text-[10px] text-destructive font-bold">{T("Telat", "Overdue")} {-days} {T("hari", "days")}</span> : <span className="text-[10px] text-muted-foreground">{days === 0 ? T("Hari ini", "Today") : `${days} ${T("hari lagi", "days left")}`}</span>}
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onPay(bill)}><CheckCircle2 className="h-3 w-3 mr-1" /> {T("Lunasi", "Pay")}</Button>
          </>)}
          {isPaid && <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ {T("Lunas", "Paid")}</span>}
        </div>
      </div>
    </div>
  );
}

// ========== ADD BILL FORM ==========
function AddBillForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const { T } = useLang();
  const [bill_name, setName] = useState("");
  const nominalInput = useCurrencyInput();
  const [due_date, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [recurrence_interval, setRecurrence] = useState<string>("none");
  const [bill_type, setBillType] = useState("tagihan");
  const [notes, setNotes] = useState("");
  const [reminder_days, setReminderDays] = useState<string>("none");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ bill_name, nominal: nominalInput.value, due_date, is_recurring: recurrence_interval !== "none", recurrence_interval: recurrence_interval === "none" ? null : recurrence_interval, bill_type, notes: notes.trim() || null, is_paid: false, reminder_days: reminder_days === "none" ? null : Number(reminder_days) }); }} className="space-y-3">
      <div><Label>{T("Nama Tagihan", "Bill Name")}</Label><Input required value={bill_name} onChange={(e) => setName(e.target.value)} placeholder={T("Contoh: Listrik PLN", "e.g. Electricity")} /></div>
      <div className="grid grid-cols-2 gap-2"><div><Label>{T("Nominal (Rp)", "Amount (Rp)")}</Label><Input required type="text" inputMode="numeric" ref={nominalInput.inputRef} value={nominalInput.displayValue} onChange={nominalInput.handleChange} onBlur={nominalInput.handleBlur} placeholder="0" /></div><div><Label>{T("Jatuh Tempo", "Due Date")}</Label><Input type="date" value={due_date} onChange={(e) => setDueDate(e.target.value)} /></div></div>
      <div><Label>{T("Jenis", "Type")}</Label><Select value={bill_type} onValueChange={setBillType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tagihan">{T("Tagihan", "Bill")}</SelectItem><SelectItem value="listrik">{T("Listrik", "Electricity")}</SelectItem><SelectItem value="air">{T("Air", "Water")}</SelectItem><SelectItem value="internet">{T("Internet", "Internet")}</SelectItem><SelectItem value="sewa">{T("Sewa", "Rent")}</SelectItem><SelectItem value="asuransi">{T("Asuransi", "Insurance")}</SelectItem><SelectItem value="lainnya">{T("Lainnya", "Other")}</SelectItem></SelectContent></Select></div>
      <div><Label>{T("Tagihan Berulang", "Recurring Bill")}</Label><Select value={recurrence_interval} onValueChange={setRecurrence}><SelectTrigger><SelectValue placeholder={T("Tidak berulang", "Not recurring")} /></SelectTrigger><SelectContent><SelectItem value="none">{T("Tidak Berulang", "Not Recurring")}</SelectItem><SelectItem value="monthly">{T("Tiap Bulan", "Every Month")}</SelectItem><SelectItem value="yearly">{T("Tiap Tahun", "Every Year")}</SelectItem></SelectContent></Select></div>
      <div><Label>{T("Pengingat Jatuh Tempo", "Due Date Reminder")}</Label><Select value={reminder_days} onValueChange={setReminderDays}><SelectTrigger><SelectValue placeholder={T("Tidak ada pengingat", "No reminder")} /></SelectTrigger><SelectContent><SelectItem value="none">{T("Tidak Ada", "None")}</SelectItem><SelectItem value="1">H-1 ({T("1 hari sebelum", "1 day before")})</SelectItem><SelectItem value="3">H-3 ({T("3 hari sebelum", "3 days before")})</SelectItem><SelectItem value="7">H-7 ({T("7 hari sebelum", "7 days before")})</SelectItem><SelectItem value="30">H-30 ({T("30 hari sebelum", "30 days before")})</SelectItem></SelectContent></Select></div>
      <div><Label>{T("Catatan", "Notes")}</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={T("Opsional", "Optional")} /></div>
      <Button type="submit" className="w-full" disabled={busy || !bill_name.trim() || nominalInput.value <= 0}>{T("Simpan", "Save")}</Button>
    </form>
  );
}

// ========== DEBT CARD ==========
function DebtCard({ d, onDelete, onPay, onDeletePrompt }: { d: any; onDelete: (id: string) => void; onPay: (amount: number, method: string, payDate: string) => void; onDeletePrompt: (debt: any) => void }) {
  const { T } = useLang();
  const paid = (d.installment_logs ?? []).reduce((s: number, l: any) => s + Number(l.amount_paid), 0);
  const remaining = Math.max(0, Number(d.total_amount) - paid);
  const progress = Number(d.total_amount) > 0 ? Math.min(100, (paid / Number(d.total_amount)) * 100) : 0;
  const monthsLeft = Number(d.monthly_installment) > 0 ? Math.ceil(remaining / Number(d.monthly_installment)) : null;
  const isHutang = d.type === "hutang";
  const isLunas = remaining <= 0;
  const waText = encodeURIComponent(isHutang ? `Halo ${d.person_name}, ini pengingat cicilan saya. Sisa: ${formatRupiah(remaining)}` : `Halo ${d.person_name}, ini pengingat cicilan Anda. Sisa: ${formatRupiah(remaining)}`);
  const payAmtInput = useCurrencyInput();
  const [payMethod, setPayMethod] = useState("Transfer");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payOpen, setPayOpen] = useState(false);
  const logs = [...(d.installment_logs ?? [])].sort((a: any, b: any) => (a.installment_number || 0) - (b.installment_number || 0));
  const handlePay = () => { const n = payAmtInput.value; if (n > 0 && n <= remaining) { onPay(n, payMethod, payDate); setPayOpen(false); payAmtInput.setValue(0); setPayMethod("Transfer"); setPayDate(new Date().toISOString().slice(0, 10)); } else if (n > remaining) { toast.error(T("Nominal melebihi sisa yang harus dibayar", "Amount exceeds remaining balance")); } };

  const exportPDF = async () => {
    try {
      const label = isHutang ? "Hutang" : "Piutang";
      const title = `Laporan ${label} - ${d.person_name}`;
      const paymentMethod = (l: any) => l.payment_method || "Cash";
      const paymentDate = (l: any) => l.payment_date_input || l.payment_date;
      const filename = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 16;
      const centered = (text: string, fontSize: number, style: string, offsetY: number) => { doc.setFont("helvetica", style as any); doc.setFontSize(fontSize); const w = doc.getTextWidth(text); doc.text(text, (pageW - w) / 2, y + offsetY); };
      doc.setFillColor(0x17, 0x83, 0x7e); doc.rect(0, 0, pageW, 28, "F"); doc.setTextColor(255, 255, 255);
      centered("Rewang", 16, "bold", 12); centered(title, 10, "normal", 22);
      y = 34; doc.setTextColor(80, 80, 80); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} — Generated by Rewang`, 14, y); y += 6;
      const statusLabel = isLunas ? "LUNAS" : remaining < Number(d.total_amount) ? "CICILAN BERJALAN" : "BELUM LUNAS";
      const statusColors = isLunas ? { bg: [0xd1, 0xfa, 0xe5], fg: [0x06, 0x5f, 0x46] } : paid > 0 ? { bg: [0xfe, 0xf3, 0xc7], fg: [0x92, 0x40, 0x0e] } : { bg: [0xfe, 0xe2, 0xe2], fg: [0xb9, 0x1c, 0x1c] };
      doc.setFillColor(statusColors.bg[0], statusColors.bg[1], statusColors.bg[2]); const badgeW = doc.getTextWidth(statusLabel) + 12; doc.roundedRect(14, y, badgeW, 6, 3, 3, "F"); doc.setTextColor(statusColors.fg[0], statusColors.fg[1], statusColors.fg[2]); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text(statusLabel, 14 + 6, y + 4.2); y += 10;
      if (!isLunas) { doc.setFillColor(0xf9, 0xfa, 0xfb); doc.setDrawColor(0xe5, 0xe7, 0xeb); doc.roundedRect(14, y, pageW - 28, 14, 3, 3, "FD"); doc.setTextColor(120, 120, 120); doc.setFontSize(7); doc.text(isHutang ? "SISA HUTANG" : "SISA PIUTANG", pageW / 2, y + 5, { align: "center" }); doc.setTextColor(isHutang ? 220 : 5, isHutang ? 38 : 150, isHutang ? 38 : 105); doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text(formatRupiah(remaining), pageW / 2, y + 12, { align: "center" }); y += 18; }
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      const infoKey = (text: string) => { doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "bold"); doc.text(text, 14, y); };
      const infoVal = (text: string) => { doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "normal"); doc.text(text, pageW - 14, y, { align: "right" }); };
      const infoRow = (key: string, val: string) => { infoKey(key); infoVal(val); y += 5; };
      infoRow("Nama", d.person_name); if (d.phone_number) infoRow("WhatsApp", d.phone_number);
      if (d.address) { infoKey("Alamat"); infoVal(""); y -= 5; doc.setFontSize(7); doc.text(d.address, 14, y + 3, { maxWidth: pageW - 28 }); y += 7; doc.setFontSize(8); }
      infoRow("Jenis", isHutang ? "Hutang (Saya Berhutang)" : "Piutang (Berhutang ke Saya)"); if (d.start_date) infoRow("Tanggal Mulai", new Date(d.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })); if (d.monthly_installment) infoRow("Cicilan per Bulan", formatRupiah(d.monthly_installment)); y += 4;
      doc.setFillColor(0xf9, 0xfa, 0xfb); doc.roundedRect(14, y, pageW - 28, 36, 3, 3, "F"); const sy = y + 5;
      doc.setTextColor(130, 130, 130); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("RINGKASAN KEUANGAN", 18, sy);
      const summaryData = [[`Total ${label}`, formatRupiah(d.total_amount)], ["Total Terbayar", formatRupiah(paid)], ["Sisa", formatRupiah(remaining)], ["Progress", `${progress.toFixed(1)}%`]];
      let rowY = sy + 6;
      summaryData.forEach(([k, v]) => { doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal"); doc.text(k, 18, rowY); doc.setTextColor(k === "Sisa" ? (isHutang ? 220 : 5) : 50, k === "Sisa" ? (isHutang ? 38 : 150) : 50, k === "Sisa" ? (isHutang ? 38 : 105) : 50); doc.setFont("helvetica", "bold"); doc.text(v, pageW - 18, rowY, { align: "right" }); rowY += 6; });
      doc.setFillColor(0xe5, 0xe7, 0xeb); doc.roundedRect(18, rowY - 2, pageW - 36, 4, 2, 2, "F"); doc.setFillColor(isHutang ? 220 : 5, isHutang ? 38 : 150, isHutang ? 38 : 105); const barW = ((pageW - 36) * progress) / 100; if (barW > 0) doc.roundedRect(18, rowY - 2, barW, 4, 2, 2, "F"); y += 42;
      if (logs.length > 0) { doc.setTextColor(80, 80, 80); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Riwayat Pembayaran", 14, y); y += 5; autoTable(doc, { startY: y, head: [["Tanggal", "Nominal", "Metode / Catatan"]], body: logs.map((l: any) => [new Date(paymentDate(l)).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), formatRupiah(l.amount_paid), paymentMethod(l)]), theme: "grid", headStyles: { fillColor: [0xf9, 0xfa, 0xfb], textColor: [80, 80, 80], fontStyle: "bold", fontSize: 8 }, bodyStyles: { fontSize: 8, textColor: [50, 50, 50] }, alternateRowStyles: { fillColor: [0xfc, 0xfd, 0xfe] }, margin: { left: 14, right: 14 } }); y = (doc as any).getNumberOfPages() > 0 ? (doc as any).lastAutoTable?.finalY ?? y + 6 : y + 6; }
      if (isLunas) { doc.setFillColor(0xd1, 0xfa, 0xe5); doc.roundedRect(14, y, pageW - 28, 10, 3, 3, "F"); doc.setTextColor(0x06, 0x5f, 0x46); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("LUNAS", pageW / 2, y + 7, { align: "center" }); y += 16; }
      doc.setTextColor(170, 170, 170); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text("Generated by Rewang — Family Household Management System", pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
      const blob = doc.output("blob"); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); toast.success(T("PDF terunduh", "PDF downloaded"));
    } catch (e: any) { toast.error(T("Gagal unduh PDF", "Failed to download PDF") + ": " + (e?.message ?? "")); }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", isHutang ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success-foreground")}>{isHutang ? T("Hutang", "Debt") : T("Piutang", "Credit")}</span>{isLunas && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">LUNAS</span>}<h3 className="font-semibold truncate">{d.person_name}</h3></div>
          {d.phone_number && <p className="text-xs text-muted-foreground mt-0.5">{d.phone_number}</p>}
          {d.last_updated_by_name && <p className="text-[10px] text-muted-foreground mt-0.5">{T("Diupdate oleh")} {d.last_updated_by_name}</p>}
        </div>
        <div className="flex gap-1"><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => exportPDF()} title="Unduh PDF"><FileDown className="h-4 w-4 text-muted-foreground hover:text-primary" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDeletePrompt(d)}><Trash2 className="h-4 w-4" /></Button></div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{T("Terbayar", "Paid")}: {formatRupiah(paid)}</span><span className="font-semibold">{formatRupiah(d.total_amount)}</span></div>
        <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden"><div className={cn("h-2.5 rounded-full transition-all", isLunas ? "bg-emerald-500" : isHutang ? "bg-gradient-to-r from-destructive to-destructive/70" : "bg-gradient-to-r from-emerald-400 to-emerald-600")} style={{ width: `${progress}%` }} /></div>
        <div className="flex justify-between text-xs"><span className="font-medium">{progress.toFixed(0)}% · {T("sisa", "remaining")} {formatRupiah(remaining)}</span>{monthsLeft !== null && monthsLeft > 0 && <span className="text-muted-foreground">~{monthsLeft} {T("bulan lagi", "more months")}</span>}</div>
      </div>
      {!isLunas && (
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <div className="flex gap-2 mt-3">
            <DialogTrigger asChild><Button size="sm" variant="outline" className="flex-1" onClick={() => payAmtInput.setValue(Number(d.monthly_installment || 0))}><Wallet className="h-3.5 w-3.5 mr-1" /> {T("Bayar", "Pay")}</Button></DialogTrigger>
            {d.phone_number && <Button asChild size="sm" variant="secondary"><a href={`https://wa.me/${normalizePhone(d.phone_number)}?text=${waText}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-1" /> WA</a></Button>}
          </div>
          <DialogContent>
            <DialogHeader><DialogTitle>{T("Bayar", "Pay")} — {d.person_name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">{T("Sisa", "Remaining")}: {formatRupiah(remaining)} {T("dari", "of")} {formatRupiah(d.total_amount)}</div>
              <div><Label>{T("Metode Pembayaran", "Payment Method")}</Label><div className="flex gap-2 mt-1"><button type="button" onClick={() => setPayMethod("Transfer")} className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition", payMethod === "Transfer" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}><Banknote className="h-4 w-4" /> Transfer</button><button type="button" onClick={() => setPayMethod("Cash")} className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition", payMethod === "Cash" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}><Coins className="h-4 w-4" /> Cash</button></div></div>
              <div><Label>{T("Nominal (Rp)", "Amount (Rp)")}</Label><Input type="text" inputMode="numeric" ref={payAmtInput.inputRef} value={payAmtInput.displayValue} onChange={payAmtInput.handleChange} onBlur={payAmtInput.handleBlur} placeholder="0" />{payAmtInput.value > 0 && payAmtInput.value < remaining && <p className="text-[11px] text-muted-foreground mt-1">{T("Bayar sebagian:", "Partial payment:")} {formatRupiah(payAmtInput.value)} · {T("Sisa setelah ini:", "Remaining after:")} {formatRupiah(remaining - payAmtInput.value)}</p>}</div>
              <div><Label>{T("Tanggal Bayar", "Payment Date")}</Label><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></div>
              <Button className="w-full" onClick={handlePay} disabled={payAmtInput.value <= 0}><Wallet className="h-4 w-4 mr-1" /> {T("Catat Pembayaran", "Record Payment")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {logs.length > 0 && (
        <Collapsible className="mt-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground"><span>{T("Riwayat", "History")} ({logs.length})</span><ChevronDown className="h-3.5 w-3.5" /></CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">{logs.map((l: any) => (<div key={l.id} className="flex justify-between text-xs bg-muted/40 rounded-md px-2 py-1.5"><span>#{l.installment_number} · {new Date(l.payment_date_input || l.payment_date).toLocaleDateString("id-ID")}{l.payment_method ? ` · ${l.payment_method}` : ""}</span><span className="font-semibold">{formatRupiah(l.amount_paid)}</span></div>))}</CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// ========== ADD DEBT FORM ==========
function AddDebtForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const { T } = useLang();
  const totalAmountInput = useCurrencyInput();
  const installmentInput = useCurrencyInput();
  const [type, setType] = useState("hutang"); const [person_name, setName] = useState(""); const [phone_number, setPhone] = useState(""); const [address, setAddress] = useState(""); const [start_date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (<form onSubmit={(e) => { e.preventDefault(); onSubmit({ type, person_name, phone_number, address, total_amount: totalAmountInput.value, monthly_installment: installmentInput.value, start_date }); }} className="space-y-3">
    <div><Label>{T("Jenis", "Type")}</Label><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hutang">{T("Hutang (saya berhutang)", "Debt (I owe)")}</SelectItem><SelectItem value="piutang">{T("Piutang (orang berhutang ke saya)", "Credit (owed to me)")}</SelectItem></SelectContent></Select></div>
    <div><Label>{T("Nama", "Name")}</Label><Input required value={person_name} onChange={(e) => setName(e.target.value)} /></div>
    <div><Label>{T("No. WhatsApp", "WhatsApp No.")}</Label><Input value={phone_number} onChange={(e) => setPhone(e.target.value)} placeholder="62812..." /></div>
    <div><Label>{T("Alamat", "Address")} ({T("opsional", "optional")})</Label><Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
    <div className="grid grid-cols-2 gap-2"><div><Label>{T("Total (Rp)", "Total (Rp)")}</Label><Input required type="text" inputMode="numeric" ref={totalAmountInput.inputRef} value={totalAmountInput.displayValue} onChange={totalAmountInput.handleChange} onBlur={totalAmountInput.handleBlur} placeholder="0" /></div><div><Label>{T("Cicilan/bln", "Installment/mo")}</Label><Input type="text" inputMode="numeric" ref={installmentInput.inputRef} value={installmentInput.displayValue} onChange={installmentInput.handleChange} onBlur={installmentInput.handleBlur} placeholder="0" /></div></div>
    <div><Label>{T("Tanggal mulai", "Start date")}</Label><Input type="date" value={start_date} onChange={(e) => setDate(e.target.value)} /></div>
    <Button type="submit" className="w-full" disabled={busy}>{T("Simpan", "Save")}</Button>
  </form>);
}

/* ========== KOLEKTIF HELPERS ========== */

function KegiatanCard({ kg, onDetail, onDelete, lunasCount, totalPeserta, totalTerkumpul }: { kg: any; onDetail: () => void; onDelete: () => void; lunasCount: number; totalPeserta: number; totalTerkumpul: number }) {
  const { T } = useLang();
  const isRata = kg.jenis_pembayaran === "iuran_rata";
  const targetTotal = isRata ? (kg.jumlah_bayar ?? 0) * totalPeserta : null;
  const isSelesai = (kg.status_kegiatan ?? "berlangsung") === "selesai";
  return (
    <div onClick={onDetail} className={cn("bg-card border rounded-2xl p-4 shadow-soft cursor-pointer hover:border-primary/30 transition", isSelesai && "opacity-75")}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm truncate">{kg.nama_kegiatan}</h3>
            {isSelesai && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">✓ Selesai</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", isRata ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>{isRata ? T("Iuran Rata", "Flat Fee") : T("Iuran Sukarela", "Voluntary")}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground capitalize">{kg.sifat_kegiatan === "rutin" ? T("Rutin", "Routine") : T("Sekali Jalan", "One-time")}</span>
          </div>
          {kg.penanggung_jawab && <p className="text-[11px] text-muted-foreground mt-1">{T("PJ", "PIC")}: {kg.penanggung_jawab}</p>}
          {kg.last_updated_by_name && (<p className="text-[10px] text-muted-foreground mt-0.5">{T("Diupdate oleh")} {kg.last_updated_by_name}{kg.updated_at && <span className="ml-1">· {fmtDate(new Date(kg.updated_at), "dd MMM yyyy, HH:mm", { locale: idLocale })}</span>}</p>)}
        </div>
        <div className="flex gap-0.5 shrink-0 ml-2">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-lg font-bold">{formatRupiah(totalTerkumpul)}</p>
          <p className="text-[11px] text-muted-foreground">{lunasCount}/{totalPeserta} {T("lunas", "paid")}{isRata && targetTotal !== null && <span className="ml-1 opacity-60"> — {T("target", "target")} {formatRupiah(targetTotal)}</span>}</p>
        </div>
      </div>
      <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden"><div className={cn("h-1.5 rounded-full transition-all", isRata ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${totalPeserta > 0 ? Math.min(100, (lunasCount / totalPeserta) * 100) : 0}%` }} /></div>
    </div>
  );
}

function AddKegiatanForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const { T } = useLang();
  const jumlahInput = useCurrencyInput();
  const [nama, setNama] = useState(""); const [sifat, setSifat] = useState("sekali_jalan"); const [jenis, setJenis] = useState("iuran_rata"); const [batas, setBatas] = useState("");
  const [penanggungJawab, setPenanggungJawab] = useState(""); const [catatan, setCatatan] = useState("");
  const [pesertaInput, setPesertaInput] = useState(""); const [peserta, setPeserta] = useState<{ nama: string; alamat: string; no_hp: string }[]>([]); const [pesertaMode, setPesertaMode] = useState<"manual" | "excel">("manual"); const fileRef = useRef<HTMLInputElement>(null);
  const addPeserta = () => { const n = pesertaInput.trim(); if (!n) return; if (peserta.some(p => p.nama.toLowerCase() === n.toLowerCase())) { toast.error(T("Nama sudah ada", "Name exists")); return; } setPeserta(prev => [...prev, { nama: n, alamat: "", no_hp: "" }]); setPesertaInput(""); };
  const removePeserta = (i: number) => setPeserta(prev => prev.filter((_, idx) => idx !== i));
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; try { const XLSX = await import("xlsx"); const data = await f.arrayBuffer(); const wb = XLSX.read(data, { type: "array" }); const ws = wb.Sheets[wb.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json<any>(ws, { header: 1 }); const hdr = rows[0] as string[]; const ni = hdr.findIndex((h: string) => h?.toLowerCase().includes("nama")); const ai = hdr.findIndex((h: string) => h?.toLowerCase().includes("alamat")); const hi = hdr.findIndex((h: string) => h?.toLowerCase().includes("hp") || h?.toLowerCase().includes("telepon") || h?.toLowerCase().includes("no")); if (ni === -1) { toast.error(T("Kolom 'Nama' tidak ditemukan", "Column 'Nama' not found")); return; } const imported = rows.slice(1).filter((r: any) => r[ni]?.toString().trim()).map((r: any) => ({ nama: r[ni]?.toString().trim() ?? "", alamat: ai >= 0 ? (r[ai]?.toString().trim() ?? "") : "", no_hp: hi >= 0 ? (r[hi]?.toString().trim() ?? "") : "" })); setPeserta(prev => { const existing = new Set(prev.map(p => p.nama.toLowerCase())); const uniq = [...prev]; for (const imp of imported) { if (!existing.has(imp.nama.toLowerCase())) { uniq.push(imp); existing.add(imp.nama.toLowerCase()); } } return uniq; }); toast.success(T(`${imported.length} peserta diimpor`, `${imported.length} imported`)); } catch { toast.error(T("Gagal baca Excel", "Failed to read Excel")); } if (fileRef.current) fileRef.current.value = ""; };
  const downloadTemplate = async () => { try { const XLSX = await import("xlsx"); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Nama", "Alamat", "No HP"]]), "Peserta"); XLSX.writeFile(wb, "template_peserta_kolektif.xlsx"); } catch { toast.error(T("Gagal unduh template", "Download failed")); } };
  const previewText = jenis === "iuran_sukarela" ? T("Default: Absen / Tidak Ikut", "Default: Absent") : T("Default: Belum Bayar", "Default: Unpaid");
  return (
    <form onSubmit={e => { e.preventDefault(); if (peserta.length === 0) { toast.error(T("Minimal 1 peserta", "At least 1 participant")); return; } onSubmit({ nama_kegiatan: nama, sifat_kegiatan: sifat, jenis_pembayaran: jenis, jumlah_bayar: jenis === "iuran_rata" ? jumlahInput.value || 0 : null, batas_tanggal: batas || null, penanggung_jawab: penanggungJawab.trim() || null, catatan: catatan.trim() || null, peserta }); }} className="space-y-3">
      <div><Label>{T("Nama Kegiatan", "Activity Name")}</Label><Input required value={nama} onChange={e => setNama(e.target.value)} placeholder={T("Contoh: Kas Lebaran 2026", "e.g. Eid Fund 2026")} /></div>
      <div><Label>{T("Sifat Kegiatan", "Activity Nature")}</Label><div className="flex gap-2 mt-1">{[{ key: "sekali_jalan", label: T("Sekali Jalan", "One-time") }, { key: "rutin", label: T("Rutin", "Routine") }].map(opt => (<button key={opt.key} type="button" onClick={() => setSifat(opt.key)} className={cn("flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition", sifat === opt.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}>{opt.label}</button>))}</div></div>
      <div><Label>{T("Jenis Pembayaran", "Payment Type")}</Label><div className="flex gap-2 mt-1">{[{ key: "iuran_rata", label: T("Iuran Rata", "Flat Fee") }, { key: "iuran_sukarela", label: T("Iuran Sukarela", "Voluntary") }].map(opt => (<button key={opt.key} type="button" onClick={() => setJenis(opt.key)} className={cn("flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition", jenis === opt.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}>{opt.label}</button>))}</div></div>
      {jenis === "iuran_rata" && <div><Label>{T("Jumlah Bayar (Rp)", "Amount (Rp)")}</Label><Input required type="text" inputMode="numeric" ref={jumlahInput.inputRef} value={jumlahInput.displayValue} onChange={jumlahInput.handleChange} onBlur={jumlahInput.handleBlur} placeholder="50000" /></div>}
      <div><Label>{T("Batas Tanggal", "Due Date")} ({T("opsional", "optional")})</Label><Input type="date" value={batas} onChange={e => setBatas(e.target.value)} /></div>
      <div><Label>{T("Penanggung Jawab", "Person in Charge")} ({T("opsional", "optional")})</Label><Input value={penanggungJawab} onChange={e => setPenanggungJawab(e.target.value)} placeholder={T("Nama PJ", "PIC Name")} /></div>
      <div><Label>{T("Catatan", "Notes")} ({T("opsional", "optional")})</Label><Textarea rows={2} value={catatan} onChange={e => setCatatan(e.target.value)} placeholder={T("Info tambahan kegiatan...", "Additional info...")} /></div>
      <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground"><span className="font-medium">{T("Preview Status:", "Status Preview:")}</span> {previewText}</div>
      <div className="border-t pt-3"><Label className="mb-2 block">{T("Tambah Peserta", "Add Participants")}</Label>
        <div className="flex gap-2 mb-2"><button type="button" onClick={() => setPesertaMode("manual")} className={cn("flex-1 py-1.5 text-xs rounded-lg border transition", pesertaMode === "manual" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}><UserPlus className="h-3.5 w-3.5 inline mr-1" />{T("Manual", "Manual")}</button><button type="button" onClick={() => setPesertaMode("excel")} className={cn("flex-1 py-1.5 text-xs rounded-lg border transition", pesertaMode === "excel" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}><FileSpreadsheet className="h-3.5 w-3.5 inline mr-1" />Excel</button></div>
        {pesertaMode === "manual" ? (<div className="flex gap-2"><Input value={pesertaInput} onChange={e => setPesertaInput(e.target.value)} placeholder={T("Ketik nama...", "Type name...")} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPeserta(); } }} /><Button type="button" size="sm" onClick={addPeserta}><Plus className="h-4 w-4" /></Button></div>) : (<div className="space-y-2"><Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()}><Download className="h-4 w-4 mr-1" />{T("Import Excel", "Import Excel")}</Button><input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelImport} /><Button type="button" variant="ghost" size="sm" className="w-full" onClick={downloadTemplate}><FileDown className="h-4 w-4 mr-1" />{T("Unduh Template .xlsx", "Download Template .xlsx")}</Button></div>)}
        {peserta.length > 0 && (<div className="mt-2 space-y-1 max-h-32 overflow-y-auto">{peserta.map((p, i) => (<div key={i} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-1.5 text-xs"><span>{p.nama}</span><Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" type="button" onClick={() => removePeserta(i)}><X className="h-3 w-3" /></Button></div>))}</div>)}
        <p className="text-[11px] text-muted-foreground mt-1">{peserta.length} {T("peserta", "participants")}</p>
      </div>
      <Button type="submit" className="w-full" disabled={busy || !nama.trim() || peserta.length === 0}>{T("Simpan Kegiatan", "Save Activity")}</Button>
    </form>
  );
}

function DetailKegiatan({ kg, peserta: ps, allPeserta, isRata, targetNominal, onLunas, onAbsen, onEditNominal, onDeletePeserta, onAddPeserta, onEditKegiatan, onSelesai, onBukaKembali, kPesertaSearch, setKPesertaSearch }: { kg: any; peserta: any[]; allPeserta: any[]; isRata: boolean; targetNominal: number; onLunas: (id: string, nominal: number) => void; onAbsen: (id: string) => void; onEditNominal: (id: string, nominal: number) => void; onDeletePeserta: (id: string, nama: string, soft: boolean) => void; onAddPeserta: (pes: { nama: string; alamat?: string; no_hp?: string }[]) => void; onEditKegiatan: () => void; onSelesai: () => void; onBukaKembali: () => void; kPesertaSearch: string; setKPesertaSearch: (v: string) => void }) {
  const { T } = useLang();
      const [editNomId, setEditNomId] = useState<string | null>(null); const editNomInput = useCurrencyInput();
  const [addPesInput, setAddPesInput] = useState(""); const [showAddPes, setShowAddPes] = useState(false);
      const [sukarelaBayarId, setSukarelaBayarId] = useState<string | null>(null); const sukarelaInput = useCurrencyInput();
  const waText = (p: any) => encodeURIComponent(`Assalamualaikum Wr. Wb. / Halo Bapak/Ibu ${p.nama}, mengingatkan untuk partisipasi agenda ${kg.nama_kegiatan} saat ini belum tercatat di rekap kami. Pembayaran bisa diserahkan ke pengurus atau via transfer ya. Terima kasih banyak atas dukungannya, Jazakumullah Khayra / Terima kasih banyak 🙏`);
  const totalTerkumpul = ps.reduce((s: number, p: any) => s + Number(p.nominal), 0);
  const lc = allPeserta.filter((p: any) => p.status_bayar === "lunas").length;
  const bc = allPeserta.filter((p: any) => p.status_bayar === "belum_bayar").length;
  const ac = allPeserta.filter((p: any) => p.status_bayar === "absen").length;
  const isSelesai = (kg.status_kegiatan ?? "berlangsung") === "selesai";
  const handleExportPDF = () => { exportKolektifPDF(kg, allPeserta, isRata, targetNominal, allPeserta.reduce((s: number, p: any) => s + Number(p.nominal), 0), T); };
  return (
    <div className="space-y-3">
      <div className="bg-muted/30 rounded-xl p-3 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{kg.nama_kegiatan}</h3>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={handleExportPDF} title={T("Ekspor PDF", "Export PDF")}><FileDown className="h-3.5 w-3.5 mr-1" />PDF</Button>
            <Button size="sm" variant="outline" onClick={onEditKegiatan}><Edit3 className="h-3.5 w-3.5 mr-1" />{T("Edit", "Edit")}</Button>
            {isSelesai ? (
              <Button size="sm" variant="outline" className="text-amber-600 border-amber-300" onClick={onBukaKembali}>{T("Buka Kembali", "Reopen")}</Button>
            ) : (
              <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300" onClick={onSelesai}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />{T("Selesai", "Done")}</Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("px-2 py-0.5 rounded-full font-medium", isRata ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>{isRata ? `${T("Iuran Rata", "Flat Fee")}: ${formatRupiah(targetNominal)}` : T("Iuran Sukarela", "Voluntary")}</span>
          <span className="px-2 py-0.5 rounded-full bg-muted">{kg.sifat_kegiatan === "rutin" ? T("Rutin", "Routine") : T("Sekali Jalan", "One-time")}</span>
          {isSelesai && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">✓ Selesai</span>}
        </div>
        {kg.penanggung_jawab && <p className="text-xs text-muted-foreground">{T("Penanggung Jawab", "PIC")}: <span className="font-medium text-foreground">{kg.penanggung_jawab}</span></p>}
        {kg.catatan && <p className="text-xs text-muted-foreground italic">"{kg.catatan}"</p>}
        <div className="flex gap-3 text-xs">
          <span className="text-emerald-600 font-medium">✓ {lc} {T("Lunas", "Paid")}</span>
          <span className="text-destructive font-medium">⏳ {bc} {T("Belum", "Unpaid")}</span>
          <span className="text-muted-foreground">✗ {ac} {T("Absen", "Absent")}</span>
        </div>
        <p className="text-lg font-bold">{formatRupiah(totalTerkumpul)}</p>
        {kg.batas_tanggal && <p className="text-[11px] text-muted-foreground">{T("Batas", "Due")}: {new Date(kg.batas_tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>}
        {kg.last_updated_by_name && (<p className="text-[10px] text-muted-foreground">{T("Diupdate oleh")} {kg.last_updated_by_name}{kg.updated_at && <span className="ml-1">· {fmtDate(new Date(kg.updated_at), "dd MMM yyyy, HH:mm", { locale: idLocale })}</span>}</p>)}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder={T("Cari nama peserta...", "Search name...")} value={kPesertaSearch} onChange={e => setKPesertaSearch(e.target.value)} /></div>
        <Button size="icon" variant="outline" onClick={() => setShowAddPes(!showAddPes)}><UserPlus className="h-4 w-4" /></Button>
      </div>
      {showAddPes && (<div className="flex gap-2"><Input value={addPesInput} onChange={e => setAddPesInput(e.target.value)} placeholder={T("Nama peserta baru", "New name")} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (addPesInput.trim()) { onAddPeserta([{ nama: addPesInput.trim() }]); setAddPesInput(""); } } }} /><Button size="sm" onClick={() => { if (addPesInput.trim()) { onAddPeserta([{ nama: addPesInput.trim() }]); setAddPesInput(""); } }}>{T("Tambah", "Add")}</Button></div>)}
      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
        {ps.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">{T("Tidak ada peserta", "No participants")}</p>}
        {ps.map((p: any) => {
          const isLunas = p.status_bayar === "lunas"; const isAbsen = p.status_bayar === "absen"; const pNoHp = p.no_hp ?? "";
          return (
            <div key={p.id} className={cn("flex items-center justify-between rounded-xl px-3 py-2.5 border", isLunas ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-800" : isAbsen ? "bg-muted/30 border-muted" : "bg-card border-border")}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.nama}</p>
                <p className="text-xs text-muted-foreground">
                  {isLunas ? (<span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {T("Lunas", "Paid")} · {formatRupiah(p.nominal)} {p.tanggal_bayar ? "· " + new Date(p.tanggal_bayar).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : ""}</span>) : isAbsen ? (<span className="text-muted-foreground">✗ {T("Absen / Tidak Ikut", "Absent")}</span>) : (<span className="text-destructive">⏳ {T("Belum Bayar", "Unpaid")}</span>)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {!isLunas && !isAbsen && !isSelesai && (<>
                  {!isRata ? (<Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => { setSukarelaBayarId(p.id); sukarelaInput.setValue(0); }}><Check className="h-3 w-3 mr-0.5" />{T("Bayar", "Pay")}</Button>) : (<Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => onLunas(p.id, targetNominal)}><Check className="h-3 w-3 mr-0.5" />{T("Lunas", "Paid")}</Button>)}
                  {pNoHp && (<Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" asChild><a href={`https://wa.me/${normalizePhone(pNoHp)}?text=${waText(p)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-3.5 w-3.5" /></a></Button>)}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onAbsen(p.id)}><ShieldX className="h-3.5 w-3.5" /></Button>
                </>)}
                {isLunas && !isSelesai && (<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditNomId(p.id); editNomInput.setValue(p.nominal); }}><Pencil className="h-3.5 w-3.5" /></Button>)}
                {!isSelesai && (<Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDeletePeserta(p.id, p.nama, isLunas)}><Trash2 className="h-3.5 w-3.5" /></Button>)}
              </div>
            </div>
          );
        })}
      </div>
      {/* Edit Nominal Dialog */}
      <Dialog open={!!editNomId} onOpenChange={(open) => { if (!open) { setEditNomId(null); editNomInput.setValue(0); } }}><DialogContent><DialogHeader><DialogTitle>{T("Edit Nominal", "Edit Amount")}</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>{T("Nominal (Rp)", "Amount (Rp)")}</Label><Input type="text" inputMode="numeric" ref={editNomInput.inputRef} value={editNomInput.displayValue} onChange={editNomInput.handleChange} onBlur={editNomInput.handleBlur} placeholder="0" /></div><Button className="w-full" onClick={() => { if (editNomId && editNomInput.value > 0) { onEditNominal(editNomId, editNomInput.value); setEditNomId(null); editNomInput.setValue(0); } }}>{T("Simpan", "Save")}</Button></div></DialogContent></Dialog>
      {/* Sukarela Bayar Dialog - no preset buttons, only input */}
      <Dialog open={!!sukarelaBayarId} onOpenChange={(open) => { if (!open) { setSukarelaBayarId(null); sukarelaInput.setValue(0); } }}><DialogContent><DialogHeader><DialogTitle>{T("Jumlah Bayar", "Payment Amount")}</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>{T("Nominal (Rp)", "Amount (Rp)")}</Label><Input type="text" inputMode="numeric" ref={sukarelaInput.inputRef} value={sukarelaInput.displayValue} onChange={sukarelaInput.handleChange} onBlur={sukarelaInput.handleBlur} placeholder={T("Masukkan jumlah pembayaran", "Enter payment amount")} /></div><Button className="w-full" disabled={sukarelaInput.value <= 0} onClick={() => { if (sukarelaBayarId && sukarelaInput.value > 0) { onLunas(sukarelaBayarId, sukarelaInput.value); setSukarelaBayarId(null); sukarelaInput.setValue(0); } }}>{T("Simpan Pembayaran", "Save Payment")}</Button></div></DialogContent></Dialog>
    </div>
  );
}

function EditKegiatanForm({ kg, peserta: ps, hasLunas, onUpdate, onAddPeserta, onDeletePeserta, busy, onCancel }: { kg: any; peserta: any[]; hasLunas: boolean; onUpdate: (id: string, data: any) => void; onAddPeserta: (pes: { nama: string; alamat?: string; no_hp?: string }[]) => void; onDeletePeserta: (id: string) => void; busy: boolean; onCancel: () => void }) {
  const { T } = useLang();
  const [nama, setNama] = useState(kg.nama_kegiatan); const [batas, setBatas] = useState(kg.batas_tanggal ?? "");
  const [penanggungJawab, setPenanggungJawab] = useState(kg.penanggung_jawab ?? "");
  const [catatan, setCatatan] = useState(kg.catatan ?? "");
  const [addPesInput, setAddPesInput] = useState(""); const aktip = ps.filter((p: any) => p.is_aktif !== false);
  return (
    <div className="space-y-3">
      <div><Label>{T("Jenis Pembayaran", "Payment Type")}</Label><Input disabled value={kg.jenis_pembayaran === "iuran_rata" ? T("Iuran Rata", "Flat Fee") : T("Iuran Sukarela", "Voluntary")} className="bg-muted" />{hasLunas && <p className="text-[11px] text-amber-600 mt-1">{T("Terkunci karena sudah ada pembayaran", "Locked: payments exist")}</p>}</div>
      {kg.jenis_pembayaran === "iuran_rata" && <div><Label>{T("Jumlah Bayar (Rp)", "Amount (Rp)")}</Label><Input disabled value={String(kg.jumlah_bayar ?? 0)} className="bg-muted" />{hasLunas && <p className="text-[11px] text-amber-600 mt-1">{T("Terkunci karena sudah ada pembayaran", "Locked: payments exist")}</p>}</div>}
      <div><Label>{T("Nama Kegiatan", "Activity Name")}</Label><Input value={nama} onChange={e => setNama(e.target.value)} /></div>
      <div><Label>{T("Batas Tanggal", "Due Date")}</Label><Input type="date" value={batas} onChange={e => setBatas(e.target.value)} /></div>
      <div><Label>{T("Penanggung Jawab", "Person in Charge")}</Label><Input value={penanggungJawab} onChange={e => setPenanggungJawab(e.target.value)} placeholder={T("Nama PJ", "PIC Name")} /></div>
      <div><Label>{T("Catatan", "Notes")}</Label><Textarea rows={2} value={catatan} onChange={e => setCatatan(e.target.value)} placeholder={T("Info tambahan...", "Additional info...")} /></div>
      <div className="border-t pt-3"><Label className="mb-2 block">{T("Tambah Peserta", "Add Participant")}</Label><div className="flex gap-2"><Input value={addPesInput} onChange={e => setAddPesInput(e.target.value)} placeholder={T("Ketik nama...", "Type name...")} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (addPesInput.trim()) { onAddPeserta([{ nama: addPesInput.trim() }]); setAddPesInput(""); } } }} /><Button size="sm" onClick={() => { if (addPesInput.trim()) { onAddPeserta([{ nama: addPesInput.trim() }]); setAddPesInput(""); } }}><Plus className="h-4 w-4" /></Button></div></div>
      <div className="space-y-1 max-h-40 overflow-y-auto"><Label>{T("Daftar Peserta Aktif", "Active")} ({aktip.length})</Label>{aktip.map((p: any) => (<div key={p.id} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-1.5 text-xs"><span>{p.nama} {p.status_bayar === "lunas" ? "✓" : p.status_bayar === "absen" ? "✗" : "⏳"}</span><Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDeletePeserta(p.id)}><X className="h-3 w-3" /></Button></div>))}</div>
      <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={onCancel}>{T("Batal", "Cancel")}</Button><Button className="flex-1" disabled={busy || !nama.trim()} onClick={() => onUpdate(kg.id, { nama_kegiatan: nama, batas_tanggal: batas || null, penanggung_jawab: penanggungJawab.trim() || null, catatan: catatan.trim() || null })}>{T("Perbarui", "Update")}</Button></div>
    </div>
  );
}

async function exportKolektifPDF(kg: any, peserta: any[], isRata: boolean, targetNominal: number, totalTerkumpul: number, T: (k: string, d?: string) => string) {
  try {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(0x17, 0x83, 0x7e); doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text("Rewang", 14, 16);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Rekap Kolektif", 14, 24);
    let y = 34;
    doc.setTextColor(80, 80, 80); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 14, y); y += 5;
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(30, 30, 30);
    doc.text(kg.nama_kegiatan, 14, y); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
    doc.text(`Jenis: ${isRata ? `${T("Iuran Rata", "Flat Fee")} - ${formatRupiah(targetNominal)}` : T("Iuran Sukarela", "Voluntary")}`, 14, y); y += 4;
    if (kg.penanggung_jawab) { doc.text(`Penanggung Jawab: ${kg.penanggung_jawab}`, 14, y); y += 4; }
    if (kg.catatan) { doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "italic"); doc.text(`"${kg.catatan}"`, 14, y); y += 5; doc.setFont("helvetica", "normal"); }
    doc.setTextColor(80, 80, 80);
    doc.text(`Sifat: ${kg.sifat_kegiatan === "rutin" ? "Rutin" : "Sekali Jalan"}`, 14, y); y += 4;
    if (kg.batas_tanggal) { doc.text(`Batas Tanggal: ${new Date(kg.batas_tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, 14, y); y += 4; }
    const lc = peserta.filter((p: any) => p.status_bayar === "lunas").length;
    const ac = peserta.filter((p: any) => p.status_bayar === "absen").length;
    const bc = peserta.filter((p: any) => p.status_bayar === "belum_bayar").length;
    const isSelesai = (kg.status_kegiatan ?? "berlangsung") === "selesai";

    // Summary box
    y += 2;
    doc.setFillColor(0xf9, 0xfa, 0xfb); doc.setDrawColor(0xe5, 0xe7, 0xeb);
    doc.roundedRect(14, y, pageW - 28, 28, 3, 3, "FD");
    const sy = y + 4;
    doc.setTextColor(130, 130, 130); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("RINGKASAN", 18, sy);
    const ringkasan = [
      ["Total Terkumpul", formatRupiah(totalTerkumpul)],
      ["Status Lunas", `${lc} peserta`],
      ["Status Belum", `${bc} peserta`],
      ["Status Absen", `${ac} peserta`],
    ];
    let ry = sy + 5;
    ringkasan.forEach(([k, v]) => { doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal"); doc.text(k, 18, ry); doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "bold"); doc.text(v, pageW - 18, ry, { align: "right" }); ry += 5; });
    y += 32;
    if (isSelesai) { doc.setFillColor(0xd1, 0xfa, 0xe5); doc.roundedRect(14, y, pageW - 28, 6, 3, 3, "F"); doc.setTextColor(0x06, 0x5f, 0x46); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("KEGIATAN SELESAI", pageW / 2, y + 4.2, { align: "center" }); y += 10; }

    // Table
    autoTable(doc, { startY: y, head: [["Nama", "Status", "Nominal", "Tanggal Bayar"]], body: peserta.map((p: any) => [p.nama, p.status_bayar === "lunas" ? "Lunas" : p.status_bayar === "absen" ? "Absen / Tidak Ikut" : "Belum Bayar", formatRupiah(p.nominal), p.tanggal_bayar ? new Date(p.tanggal_bayar).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"]), theme: "grid", headStyles: { fillColor: [0x17, 0x83, 0x7e], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 }, bodyStyles: { fontSize: 8, textColor: [50, 50, 50] }, alternateRowStyles: { fillColor: [0xfc, 0xfd, 0xfe] }, margin: { left: 14, right: 14 } });
    doc.setTextColor(170, 170, 170); doc.setFontSize(7);
    doc.text("Generated by Rewang — Family Household Management System", pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    const blob = doc.output("blob"); const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `rekap_kolektif_${kg.nama_kegiatan.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success(T("PDF terunduh", "PDF downloaded"));
  } catch (e: any) { toast.error(T("Gagal unduh PDF", "Failed to download PDF") + ": " + (e?.message ?? "")); }
}