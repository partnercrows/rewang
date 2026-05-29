import { createFileRoute, useSearch } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Minus, Search, Edit2, ShoppingCart, Star, Package } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn, formatRupiah } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

async function tryFeedInsert(payload: Record<string, unknown>) {
  try { await supabase.from("activity_feed").insert(payload); } catch {}
}
export const Route = createFileRoute("/app/belanja")({
  head: () => ({ meta: [{ title: "Belanja — Rewang" }] }),
  component: BelanjaPage,
});

const DEFAULT_CATEGORIES = ["Groceries", "Home Care", "Hair Care", "Bayi", "Dapur", "Lainnya"];
const UNITS = ["pcs", "kg", "liter", "botol", "tabung"];

function BelanjaPage() {
  const { T } = useLang();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initialTab = params.get("tab") === "wishlist" ? "wishlist" : "stock";
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <MainLayout title={T("Belanja")}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stock" className="data-[state=active]:font-extrabold data-[state=active]:scale-[1.02] data-[state=active]:shadow-md transition-all"><Package className="h-4 w-4 mr-2" />{T("Stok")}</TabsTrigger>
          <TabsTrigger value="wishlist" className="data-[state=active]:font-extrabold data-[state=active]:scale-[1.02] data-[state=active]:shadow-md transition-all"><Star className="h-4 w-4 mr-2" />{T("Wishlist")}</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-4"><StockTab /></TabsContent>
        <TabsContent value="wishlist" className="mt-4"><WishlistTab /></TabsContent>
      </Tabs>
    </MainLayout>
  );
}

function useFamilyId() {
  const { family } = useAuth();
  return family?.id;
}

function StockTab() {
  const { T } = useLang();
  const familyId = useFamilyId();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [filter, setFilter] = useState<string>(T("Semua"));
  const [statusFilter, setStatusFilter] = useState<string>(T("Semua"));
  const [search, setSearch] = useState("");
  const [catMgrOpen, setCatMgrOpen] = useState(false);

  const STATUSES = [T("Aman"), T("Menipis"), T("Habis")];

  const { data: cats = [] } = useQuery({
    queryKey: ["shopping-cats", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data } = await supabase.from("shopping_categories").select("*").eq("family_id", familyId!).is("deleted_at", null).order("name");
      return data ?? [];
    },
  });

  const allCats = useMemo(() => {
    const custom = cats.map((c: any) => c.name);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...custom]));
  }, [cats]);

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

  const upsertItem = useMutation({
    mutationFn: async (vals: any) => {
      const payload: any = {
        family_id: familyId!, item_name: vals.item_name, category: vals.category,
        quantity_decimal: vals.qty, current_stock: Math.floor(vals.qty),
        min_stock: vals.min, unit: vals.unit,
        last_updated_by: profile?.id, last_updated_by_name: profile?.full_name,
      };
      if (vals.id) {
        const { error } = await supabase.from("shopping_items").update(payload).eq("id", vals.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shopping_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_data, vals) => {
      qc.invalidateQueries({ queryKey: ["shopping", familyId] });
      toast.success(T("Tersimpan"));
      setOpen(false);
      setEdit(null);
      tryFeedInsert({
        family_id: familyId!, actor_id: profile?.id, actor_name: profile?.full_name ?? "",
        action_type: "update", entity_type: "shopping",
        description: vals.id ? `mengubah stok ${vals.item_name}` : `menambah ${vals.item_name} (${vals.qty} ${vals.unit})`,
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, delta, mark }: { id: string; delta?: number; mark?: "empty" }) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const cur = Number(item.quantity_decimal ?? item.current_stock ?? 0);
      const next = mark === "empty" ? 0 : Math.max(0, cur + (delta ?? 0));
      const { error } = await supabase.from("shopping_items").update({ quantity_decimal: next, current_stock: Math.floor(next), last_updated_by: profile?.id, last_updated_by_name: profile?.full_name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping", familyId] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shopping_items").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      const item = items.find((i) => i.id === id);
      qc.invalidateQueries({ queryKey: ["shopping", familyId] });
      toast.success(T("Dihapus"));
      if (item) {
        tryFeedInsert({
          family_id: familyId!, actor_id: profile?.id, actor_name: profile?.full_name ?? "",
          action_type: "update", entity_type: "shopping", description: `menghapus ${item.item_name}`,
        });
      }
    },
  });

  const filtered = items.filter((i: any) => {
    if (filter !== T("Semua") && i.category !== filter) return false;
    if (statusFilter !== T("Semua") && i.status !== statusFilter) return false;
    if (search && !i.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categoryChips = [T("Semua"), ...allCats];

  return (
    <>
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={T("Cari item...")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categoryChips.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border", filter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}>
              {c}
            </button>
          ))}
          <button onClick={() => setCatMgrOpen(true)} className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground whitespace-nowrap">+ {T("Kategori")}</button>
        </div>
        <div className="flex gap-2">
          {[T("Semua"), ...STATUSES].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border", statusFilter === s ? "bg-secondary border-primary" : "bg-card border-border text-muted-foreground")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 mb-24">
        {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">{T("Tidak ada item")}</p>}
        {filtered.map((item: any) => {
          const qty = Number(item.quantity_decimal ?? item.current_stock ?? 0);
          return (
            <div key={item.id} className="bg-card border border-border rounded-xl p-3 shadow-soft">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{item.item_name}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{item.category} · {T("min")} {item.min_stock} {item.unit}</p>
                  {item.last_updated_by_name && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{T("Diupdate oleh")} {item.last_updated_by_name} · {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true, locale: idLocale })}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty.mutate({ id: item.id, delta: -1 })}><Minus className="h-3 w-3" /></Button>
                  <span className="w-12 text-center font-bold text-sm">{qty} <span className="text-[10px] font-normal text-muted-foreground">{item.unit}</span></span>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty.mutate({ id: item.id, delta: 1 })}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
              <div className="flex gap-1 mt-2 pt-2 border-t border-border">
                <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => updateQty.mutate({ id: item.id, mark: "empty" })}>{T("Habiskan")}</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => setEdit(item)}><Edit2 className="h-3 w-3 mr-1" />{T("Edit")}</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => removeItem.mutate(item.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open || !!edit} onOpenChange={(v) => { if (!v) { setOpen(false); setEdit(null); } }}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-24 left-1/2 -translate-x-1/2 shadow-card rounded-full h-12 px-5" size="lg" onClick={() => setOpen(true)}>
            <Plus className="h-5 w-5 mr-1" /> {T("Tambah Stok")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? T("Edit stok") : T("Item baru")}</DialogTitle></DialogHeader>
          <StockForm initial={edit} categories={allCats} onSubmit={(v) => upsertItem.mutate(v)} busy={upsertItem.isPending} />
        </DialogContent>
      </Dialog>

      <CategoryManager open={catMgrOpen} onOpenChange={setCatMgrOpen} familyId={familyId!} categories={cats} />
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { T } = useLang();
  const map: Record<string, string> = {
    [T("Aman")]: "bg-success/15 text-success",
    [T("Menipis")]: "bg-warning/20 text-warning-foreground",
    [T("Habis")]: "bg-destructive/15 text-destructive",
  };
  return <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", map[status] ?? "bg-muted text-muted-foreground")}>{status}</span>;
}

function StockForm({ initial, categories, onSubmit, busy }: { initial: any; categories: string[]; onSubmit: (v: any) => void; busy: boolean }) {
  const { T } = useLang();
  const [item_name, setName] = useState(initial?.item_name ?? "");
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "Lainnya");
  const [qty, setQty] = useState<number>(Number(initial?.quantity_decimal ?? initial?.current_stock ?? 1));
  const [min, setMin] = useState<number>(initial?.min_stock ?? 1);
  const [unit, setUnit] = useState(initial?.unit ?? "pcs");

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ id: initial?.id, item_name, category, qty, min, unit }); }} className="space-y-3">
      <div><Label>{T("Nama item")}</Label><Input required value={item_name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>{T("Kategori")}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>{T("Satuan")}</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>{T("Jumlah")}</Label><Input required type="number" step="0.1" min={0} value={qty} onChange={(e) => setQty(parseFloat(e.target.value) || 0)} /></div>
        <div><Label>{T("Stok minimum")}</Label><Input required type="number" step="0.1" min={0} value={min} onChange={(e) => setMin(parseFloat(e.target.value) || 0)} /></div>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{T("Simpan")}</Button>
    </form>
  );
}

function CategoryManager({ open, onOpenChange, familyId, categories }: { open: boolean; onOpenChange: (v: boolean) => void; familyId: string; categories: any[] }) {
  const { T } = useLang();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const add = useMutation({
    mutationFn: async () => {
      if (!name.trim()) return;
      const { error } = await supabase.from("shopping_categories").insert({ family_id: familyId, name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["shopping-cats", familyId] }); toast.success(T("Kategori ditambah")); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shopping_categories").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping-cats", familyId] }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{T("Kelola kategori")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="flex gap-2">
            <Input placeholder={T("Nama kategori baru")} value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" disabled={!name.trim() || add.isPending}>{T("Tambah")}</Button>
          </form>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{T("Kategori bawaan tidak dapat dihapus.")}</p>
            {DEFAULT_CATEGORIES.map((c) => <div key={c} className="text-sm px-3 py-2 bg-secondary/40 rounded-lg">{c} <span className="text-[10px] text-muted-foreground ml-1">{T("bawaan")}</span></div>)}
            {categories.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-card border border-border rounded-lg">
                <span className="text-sm">{c.name}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => del.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WishlistTab() {
  const { T } = useLang();
  const familyId = useFamilyId();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["wishlist", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist_items").select("*").eq("family_id", familyId!).is("deleted_at", null).is("purchased_at", null).order("priority").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("wishlist_items").insert({ ...v, family_id: familyId! });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wishlist", familyId] }); toast.success(T("Wishlist ditambah")); setOpen(false); },
  });

  const buy = useMutation({
    mutationFn: async (item: any) => {
      await supabase.from("wishlist_items").update({ purchased_at: new Date().toISOString() }).eq("id", item.id);
      await supabase.from("shopping_items").insert({ family_id: familyId!, item_name: item.item_name, category: "Lainnya", quantity_decimal: 1, current_stock: 1, min_stock: 1, unit: "pcs", last_updated_by: profile?.id, last_updated_by_name: profile?.full_name });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wishlist", familyId] }); qc.invalidateQueries({ queryKey: ["shopping", familyId] }); toast.success(T("Dipindahkan ke stok")); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("wishlist_items").update({ deleted_at: new Date().toISOString() }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist", familyId] }),
  });

  return (
    <>
      <div className="space-y-2 mb-24">
        {items.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">{T("Belum ada wishlist")}</p>}
        {items.map((w: any) => (
          <div key={w.id} className="bg-card border border-border rounded-xl p-3 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{w.item_name}</p>
                  <PriorityBadge p={w.priority} />
                </div>
                <p className="text-xs text-primary font-medium mt-0.5">{formatRupiah(w.estimated_price ?? 0)}</p>
                {w.notes && <p className="text-[11px] text-muted-foreground mt-1">{w.notes}</p>}
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => del.mutate(w.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => buy.mutate(w)}>
              <ShoppingCart className="h-3.5 w-3.5 mr-1" /> {T("Sudah dibeli → pindah ke stok")}
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-24 left-1/2 -translate-x-1/2 shadow-card rounded-full h-12 px-5" size="lg"><Plus className="h-5 w-5 mr-1" /> {T("Tambah Wishlist")}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{T("Item wishlist baru")}</DialogTitle></DialogHeader>
          <WishlistForm onSubmit={(v) => add.mutate(v)} busy={add.isPending} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const map: Record<string, string> = { high: "bg-destructive/15 text-destructive", medium: "bg-warning/20 text-warning-foreground", low: "bg-muted text-muted-foreground" };
  return <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium uppercase", map[p] ?? map.medium)}>{p}</span>;
}

function WishlistForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const { T } = useLang();
  const [item_name, setName] = useState("");
  const [estimated_price, setPrice] = useState(0);
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ item_name, estimated_price, priority, notes }); }} className="space-y-3">
      <div><Label>{T("Nama item")}</Label><Input required value={item_name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>{T("Harga estimasi")}</Label><Input type="number" min={0} value={estimated_price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} /></div>
        <div><Label>{T("Prioritas")}</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="high">{T("tinggi")}</SelectItem><SelectItem value="medium">{T("sedang")}</SelectItem><SelectItem value="low">{T("rendah")}</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>{T("Catatan")}</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <DialogFooter><Button type="submit" className="w-full" disabled={busy}>{T("Simpan")}</Button></DialogFooter>
    </form>
  );
}