import { createFileRoute } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Minus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/belanja")({
  head: () => ({ meta: [{ title: "Belanja — Rumahku" }] }),
  component: BelanjaPage,
});

const CATEGORIES = ["Groceries", "Home Care", "Hair Care", "Bayi", "Lainnya"];

function BelanjaPage() {
  const { family, profile } = useAuth();
  const familyId = family?.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("Semua");

  const { data: items = [] } = useQuery({
    queryKey: ["shopping", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .order("status", { ascending: false })
        .order("item_name");
      if (error) throw error;
      return data;
    },
  });

  const logActivity = async (description: string) => {
    if (!familyId || !profile) return;
    await supabase.from("activity_feed").insert({
      family_id: familyId,
      actor_id: profile.id,
      actor_name: profile.full_name,
      action_type: "update",
      entity_type: "shopping",
      description,
    });
  };

  const addItem = useMutation({
    mutationFn: async (vals: { item_name: string; category: string; current_stock: number; min_stock: number }) => {
      const { error } = await supabase.from("shopping_items").insert({ ...vals, family_id: familyId! });
      if (error) throw error;
      await logActivity(`menambahkan ${vals.item_name} ke daftar belanja`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping", familyId] });
      toast.success("Item ditambahkan");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const next = Math.max(0, item.current_stock + delta);
      const { error } = await supabase.from("shopping_items").update({ current_stock: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping", familyId] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const item = items.find((i) => i.id === id);
      const { error } = await supabase.from("shopping_items").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      if (item) await logActivity(`menghapus ${item.item_name} dari daftar belanja`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shopping", familyId] });
      toast.success("Dihapus");
    },
  });

  const filtered = filter === "Semua" ? items : items.filter((i) => i.category === filter);
  const categories = ["Semua", ...CATEGORIES];

  return (
    <MainLayout title="Belanja">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-3">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition",
              filter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Belum ada item</div>
        )}
        {filtered.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shadow-soft">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{item.item_name}</p>
                <StatusBadge status={item.status as string} />
              </div>
              <p className="text-xs text-muted-foreground">{item.category} · min {item.min_stock}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateStock.mutate({ id: item.id, delta: -1 })}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center font-bold">{item.current_stock}</span>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateStock.mutate({ id: item.id, delta: 1 })}>
                <Plus className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem.mutate(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-24 left-1/2 -translate-x-1/2 shadow-card rounded-full h-12 px-5" size="lg">
            <Plus className="h-5 w-5 mr-1" /> Tambah Item
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Item baru</DialogTitle></DialogHeader>
          <AddItemForm onSubmit={(v) => addItem.mutate(v)} busy={addItem.isPending} />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Aman: "bg-success/20 text-success-foreground",
    Menipis: "bg-warning/20 text-warning-foreground",
    Habis: "bg-destructive/20 text-destructive",
  };
  return <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", map[status])}>{status}</span>;
}

function AddItemForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const [item_name, setName] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [current_stock, setStock] = useState(1);
  const [min_stock, setMin] = useState(1);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ item_name, category, current_stock, min_stock });
      }}
      className="space-y-3"
    >
      <div>
        <Label>Nama item</Label>
        <Input required value={item_name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>Kategori</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Stok saat ini</Label>
          <Input type="number" min={0} value={current_stock} onChange={(e) => setStock(parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <Label>Stok minimum</Label>
          <Input type="number" min={0} value={min_stock} onChange={(e) => setMin(parseInt(e.target.value) || 0)} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>Simpan</Button>
    </form>
  );
}
