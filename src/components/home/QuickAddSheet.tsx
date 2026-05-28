import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShoppingBasket, ReceiptText, Calendar, StickyNote, ListTodo } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type Mode = "menu" | "stock" | "bill" | "agenda" | "task" | "note";

export function QuickAddSheet() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setMode("menu"); }}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-24 right-5 z-30 shadow-card rounded-full h-14 w-14 p-0" size="lg" aria-label="Tambah cepat">
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{mode === "menu" ? "Tambah cepat" : title(mode)}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {mode === "menu" && <MenuGrid onPick={setMode} />}
          {mode !== "menu" && (
            <QuickForm mode={mode} onDone={() => { setOpen(false); setMode("menu"); }} onBack={() => setMode("menu")} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function title(m: Mode) {
  return { stock: "Tambah stok", bill: "Tambah tagihan", agenda: "Tambah agenda", task: "Tambah tugas", note: "Tambah catatan" }[m as Exclude<Mode, "menu">];
}

function MenuGrid({ onPick }: { onPick: (m: Mode) => void }) {
  const items: { m: Mode; label: string; Icon: any; color: string }[] = [
    { m: "stock", label: "Stok", Icon: ShoppingBasket, color: "bg-primary/10 text-primary" },
    { m: "bill", label: "Tagihan", Icon: ReceiptText, color: "bg-warning/15 text-warning-foreground" },
    { m: "agenda", label: "Agenda", Icon: Calendar, color: "bg-accent text-accent-foreground" },
    { m: "task", label: "Tugas", Icon: ListTodo, color: "bg-success/15 text-success-foreground" },
    { m: "note", label: "Catatan", Icon: StickyNote, color: "bg-secondary text-secondary-foreground" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ m, label, Icon, color }) => (
        <button key={m} onClick={() => onPick(m)} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:shadow-card transition">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}

function QuickForm({ mode, onDone, onBack }: { mode: Exclude<Mode, "menu">; onDone: () => void; onBack: () => void }) {
  const { family, profile } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState<any>({});

  const log = async (desc: string, entity: string) => {
    if (!family || !profile) return;
    await supabase.from("activity_feed").insert({
      family_id: family.id, actor_id: profile.id, actor_name: profile.full_name,
      action_type: "create", entity_type: entity, description: desc,
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) return;
    setBusy(true);
    try {
      if (mode === "stock") {
        const payload = { family_id: family.id, item_name: v.item_name, category: v.category || "Lainnya", current_stock: Math.floor(v.qty || 0), quantity_decimal: v.qty || 0, min_stock: v.min || 1, unit: v.unit || "pcs", last_updated_by: profile?.id, last_updated_by_name: profile?.full_name };
        const { error } = await supabase.from("shopping_items").insert(payload);
        if (error) throw error;
        await log(`menambah stok ${v.item_name}`, "shopping");
        qc.invalidateQueries({ queryKey: ["shopping"] });
      } else if (mode === "bill") {
        const { error } = await supabase.from("bills").insert({ family_id: family.id, bill_name: v.bill_name, nominal: v.nominal || 0, due_date: v.due_date, bill_type: v.bill_type || "lainnya" });
        if (error) throw error;
        await log(`menambah tagihan ${v.bill_name}`, "bill");
        qc.invalidateQueries({ queryKey: ["bills"] });
        qc.invalidateQueries({ queryKey: ["beranda-stats"] });
        qc.invalidateQueries({ queryKey: ["next-bill"] });
      } else if (mode === "agenda") {
        const { error } = await supabase.from("agenda_events").insert({ family_id: family.id, title: v.title, event_date: v.event_date, event_type: v.event_type || "pengingat", created_by: profile?.id });
        if (error) throw error;
        await log(`menambah agenda ${v.title}`, "agenda");
        qc.invalidateQueries({ queryKey: ["agenda"] });
      } else if (mode === "task") {
        const { error } = await supabase.from("kanban_boards").insert({ family_id: family.id, title: v.title, status: "To Do", target_date: v.target_date || null });
        if (error) throw error;
        await log(`menambah tugas ${v.title}`, "kanban");
        qc.invalidateQueries({ queryKey: ["kanban"] });
      } else if (mode === "note") {
        const { error } = await supabase.from("quick_notes").insert({ family_id: family.id, content: v.content, created_by: profile?.id, created_by_name: profile?.full_name });
        if (error) throw error;
        await log(`menambah catatan`, "note");
        qc.invalidateQueries({ queryKey: ["notes"] });
      }
      toast.success("Tersimpan");
      onDone();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {mode === "stock" && (
        <>
          <div><Label>Nama item</Label><Input required onChange={(e) => setV({ ...v, item_name: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Jumlah</Label><Input type="number" step="0.1" min={0} onChange={(e) => setV({ ...v, qty: parseFloat(e.target.value) })} /></div>
            <div>
              <Label>Satuan</Label>
              <Select onValueChange={(x) => setV({ ...v, unit: x })}>
                <SelectTrigger><SelectValue placeholder="pcs" /></SelectTrigger>
                <SelectContent>{["pcs","kg","liter","botol","tabung"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Min</Label><Input type="number" min={0} onChange={(e) => setV({ ...v, min: parseInt(e.target.value) })} /></div>
          </div>
          <div><Label>Kategori</Label><Input placeholder="Groceries" onChange={(e) => setV({ ...v, category: e.target.value })} /></div>
        </>
      )}
      {mode === "bill" && (
        <>
          <div><Label>Nama tagihan</Label><Input required onChange={(e) => setV({ ...v, bill_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Nominal</Label><Input required type="number" min={0} onChange={(e) => setV({ ...v, nominal: parseFloat(e.target.value) })} /></div>
            <div><Label>Jatuh tempo</Label><Input required type="date" onChange={(e) => setV({ ...v, due_date: e.target.value })} /></div>
          </div>
          <div>
            <Label>Jenis</Label>
            <Select onValueChange={(x) => setV({ ...v, bill_type: x })}>
              <SelectTrigger><SelectValue placeholder="lainnya" /></SelectTrigger>
              <SelectContent>{["listrik","internet","air","sekolah","pajak","subscription","lainnya"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </>
      )}
      {mode === "agenda" && (
        <>
          <div><Label>Judul</Label><Input required onChange={(e) => setV({ ...v, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Tanggal</Label><Input required type="date" onChange={(e) => setV({ ...v, event_date: e.target.value })} /></div>
            <div>
              <Label>Jenis</Label>
              <Select onValueChange={(x) => setV({ ...v, event_type: x })}>
                <SelectTrigger><SelectValue placeholder="pengingat" /></SelectTrigger>
                <SelectContent>{["ulang_tahun","kajian","janji","sekolah","pengingat"].map(t => <SelectItem key={t} value={t}>{t.replace("_"," ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
      {mode === "task" && (
        <>
          <div><Label>Judul tugas</Label><Input required onChange={(e) => setV({ ...v, title: e.target.value })} /></div>
          <div><Label>Target tanggal (opsional)</Label><Input type="date" onChange={(e) => setV({ ...v, target_date: e.target.value })} /></div>
        </>
      )}
      {mode === "note" && (
        <div><Label>Catatan</Label><Textarea required rows={3} onChange={(e) => setV({ ...v, content: e.target.value })} /></div>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">Kembali</Button>
        <Button type="submit" disabled={busy} className="flex-1">Simpan</Button>
      </div>
    </form>
  );
}
