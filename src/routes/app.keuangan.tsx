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
import { formatRupiah, daysUntil, cn } from "@/lib/utils";
import { Plus, Trash2, Check, MessageCircle, Receipt, HandCoins } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/keuangan")({
  head: () => ({ meta: [{ title: "Keuangan — Rumahku" }] }),
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

function BillsTab() {
  const { family, profile } = useAuth();
  const familyId = family?.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: bills = [] } = useQuery({
    queryKey: ["bills", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .order("due_date");
      if (error) throw error;
      return data;
    },
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

  const togglePaid = useMutation({
    mutationFn: async (bill: any) => {
      const { error } = await supabase.from("bills").update({ is_paid: !bill.is_paid }).eq("id", bill.id);
      if (error) throw error;
      if (!bill.is_paid) await logActivity(`membayar tagihan ${bill.bill_name}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills", familyId] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bills").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bills", familyId] }); toast.success("Dihapus"); },
  });

  return (
    <>
      <div className="space-y-2 mb-20">
        {bills.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">Belum ada tagihan</p>}
        {bills.map((b) => {
          const days = daysUntil(b.due_date);
          const overdue = days < 0 && !b.is_paid;
          return (
            <div key={b.id} className={cn(
              "bg-card border rounded-xl p-4 shadow-soft",
              overdue ? "border-destructive/50" : "border-border",
              b.is_paid && "opacity-60",
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold truncate", b.is_paid && "line-through")}>{b.bill_name}</p>
                  <p className="text-lg font-extrabold text-primary">{formatRupiah(b.nominal)}</p>
                  <p className={cn("text-xs mt-0.5", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                    {b.is_paid ? "Lunas" : overdue ? `Telat ${-days} hari` : days === 0 ? "Jatuh tempo hari ini" : `${days} hari lagi`}
                    {b.is_recurring && " · Berulang"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant={b.is_paid ? "outline" : "default"} className="h-8 w-8" onClick={() => togglePaid.mutate(b)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => del.mutate(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
  const [is_recurring, setRec] = useState(false);
  const [recurrence_interval, setInterval] = useState("monthly");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ bill_name, nominal, due_date, is_recurring, recurrence_interval: is_recurring ? recurrence_interval : null }); }} className="space-y-3">
      <div><Label>Nama tagihan</Label><Input required value={bill_name} onChange={(e) => setName(e.target.value)} /></div>
      <div><Label>Nominal (Rp)</Label><Input required type="number" min={0} value={nominal} onChange={(e) => setNominal(parseFloat(e.target.value) || 0)} /></div>
      <div><Label>Jatuh tempo</Label><Input required type="date" value={due_date} onChange={(e) => setDate(e.target.value)} /></div>
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <Label htmlFor="rec">Tagihan berulang</Label>
        <Switch id="rec" checked={is_recurring} onCheckedChange={setRec} />
      </div>
      {is_recurring && (
        <Select value={recurrence_interval} onValueChange={setInterval}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Bulanan</SelectItem>
            <SelectItem value="yearly">Tahunan</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Button type="submit" className="w-full" disabled={busy}>Simpan</Button>
    </form>
  );
}

function DebtsTab() {
  const { family, profile } = useAuth();
  const familyId = family?.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: debts = [] } = useQuery({
    queryKey: ["debts", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("debts_credits")
        .select("*, installment_logs(amount_paid)")
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
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
        debt_credit_id: debt.id,
        installment_number: nextNum,
        amount_paid: amount,
        payment_date: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      await logActivity(`mencatat cicilan ${formatRupiah(amount)} untuk ${debt.person_name} (total bayar ${formatRupiah(paid + amount)})`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["debts", familyId] }); toast.success("Cicilan dicatat"); },
  });

  return (
    <>
      <div className="space-y-3 mb-20">
        {debts.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">Belum ada hutang/piutang</p>}
        {debts.map((d: any) => {
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
          return (
            <div key={d.id} className="bg-card border border-border rounded-2xl p-4 shadow-soft">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                      isHutang ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success-foreground",
                    )}>{d.type}</span>
                    <h3 className="font-semibold">{d.person_name}</h3>
                  </div>
                  {d.phone_number && <p className="text-xs text-muted-foreground mt-0.5">{d.phone_number}</p>}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => del.mutate(d.id)}>
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
                  <span className="font-medium">{progress.toFixed(0)}% lunas</span>
                  {monthsLeft !== null && <span className="text-muted-foreground">~{monthsLeft} bulan lagi</span>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                  const amt = prompt("Nominal cicilan (Rp):", String(d.monthly_installment || 0));
                  if (amt && parseFloat(amt) > 0) pay.mutate({ debt: d, amount: parseFloat(amt) });
                }}>
                  Catat cicilan
                </Button>
                {d.phone_number && (
                  <Button asChild size="sm" variant="secondary">
                    <a href={`https://wa.me/${d.phone_number.replace(/\D/g, "")}?text=${waText}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4 mr-1" /> WA
                    </a>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
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
