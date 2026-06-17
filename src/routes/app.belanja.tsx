import { createFileRoute, Link } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Minus, Search, Edit2, ShoppingCart, Star, Package, UtensilsCrossed, Image as ImageIcon, Lock, Upload, X } from "lucide-react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { cn, formatRupiah } from "@/lib/utils";
import { useCurrencyInput } from "@/hooks/useCurrencyInput";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

async function tryFeedInsert(payload: any) {
  try { await supabase.from("activity_feed").insert(payload as any); } catch {}
}

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: file.type || "image/jpeg",
  };
  try {
    return await imageCompression(file, options);
  } catch {
    return file;
  }
}

async function uploadRecipeImage(familyId: string, recipeId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${familyId}/${recipeId}-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("recipe-images")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
  return data.publicUrl;
}

async function deleteOldRecipeImage(imageUrl: string | null) {
  if (!imageUrl) return;
  try {
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/public\/recipe-images\/(.+)$/);
    if (pathMatch?.[1]) {
      await supabase.storage.from("recipe-images").remove([decodeURIComponent(pathMatch[1])]);
    }
  } catch {
    // ignore cleanup errors
  }
}

export const Route = createFileRoute("/app/belanja")({
  head: () => ({ meta: [{ title: "Belanja — Rewang" }] }),
  component: BelanjaPage,
});

const DEFAULT_CATEGORIES = ["Groceries", "Home Care", "Hair Care", "Bayi", "Dapur", "Lainnya"];
const UNITS = ["pcs", "kg", "liter", "botol", "tabung"];
const RECIPES_PER_PAGE = 12;

function BelanjaPage() {
  const { T } = useLang();
  const limits = useSubscriptionGate();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const wishlistParam = params.get("tab") === "wishlist";
  const initialTab = wishlistParam && !limits.canAccessWishlist ? "stock" : params.get("tab") === "wishlist" ? "wishlist" : params.get("tab") === "recipe" ? "recipe" : "stock";
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <MainLayout title={T("Belanja")}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock" className="data-[state=active]:font-extrabold data-[state=active]:scale-[1.02] data-[state=active]:shadow-md transition-all"><Package className="h-4 w-4 mr-2" />{T("Stok")}</TabsTrigger>
          <TabsTrigger value="recipe" className="data-[state=active]:font-extrabold data-[state=active]:scale-[1.02] data-[state=active]:shadow-md transition-all"><UtensilsCrossed className="h-4 w-4 mr-2" />{T("Resep")}</TabsTrigger>
          <TabsTrigger value="wishlist" className="data-[state=active]:font-extrabold data-[state=active]:scale-[1.02] data-[state=active]:shadow-md transition-all"><Star className="h-4 w-4 mr-2" />{T("Wishlist")}</TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-4"><StockTab /></TabsContent>
        <TabsContent value="recipe" className="mt-4"><RecipeTab /></TabsContent>
        <TabsContent value="wishlist" className="mt-4">{limits.canAccessWishlist ? <WishlistTab /> : <WishlistPaywall />}</TabsContent>
      </Tabs>
    </MainLayout>
  );
}

function WishlistPaywall() {
  const { T } = useLang();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold mb-2">{T("Fitur Premium", "Premium Feature")}</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        {T(
          "Wishlist tersedia untuk paket Family. Upgrade sekarang untuk mengelola wishlist belanja keluarga.",
          "Wishlist is available for Family plan. Upgrade now to manage family shopping wishlist."
        )}
      </p>
      <Button asChild className="rounded-xl">
        <Link to="/aktivasi">{T("Upgrade ke Family", "Upgrade to Family")}</Link>
      </Button>
    </div>
  );
}

function useFamilyId() {
  const { family } = useAuth();
  return family?.id;
}

// ==================== STOCK TAB ====================

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
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<any>(null);

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
        <p className="text-xs font-semibold text-muted-foreground mb-0.5">{T("Kategori")}</p>
        <div className="flex gap-2 flex-wrap">
          {categoryChips.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border", filter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}>
              {c}
            </button>
          ))}
          <button onClick={() => setCatMgrOpen(true)} className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground whitespace-nowrap">+ {T("Kategori")}</button>
        </div>
        <p className="text-xs font-semibold text-muted-foreground mb-0.5 mt-1">{T("Ketersediaan")}</p>
        <div className="flex gap-2">
          {[T("Semua"), ...STATUSES].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border", statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}>
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
                  <div className="mt-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                      <span>{qty}/{item.min_stock} {item.unit}</span>
                      <span>{Math.min(100, Math.round((qty / Math.max(item.min_stock, qty, 1)) * 100))}%</span>
                    </div>
<div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", (() => { if (qty <= 0) return "bg-destructive"; else if (qty <= item.min_stock) return "bg-warning"; else return "bg-success"; })())} style={{ width: `${Math.min(100, Math.round((qty / Math.max(item.min_stock, qty, 1)) * 100))}%` }} />
                    </div>
                  </div>
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
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setConfirmDeleteItem(item)}><Trash2 className="h-3 w-3" /></Button>
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

      <CategoryManager open={catMgrOpen} onOpenChange={setCatMgrOpen} familyId={familyId!} categories={cats} type="shopping" />

      <ConfirmDialog
        open={!!confirmDeleteItem}
        onOpenChange={() => setConfirmDeleteItem(null)}
        title={T("Hapus item ini?")}
        onConfirm={() => removeItem.mutate(confirmDeleteItem.id)}
      />
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
  const [qty, setQty] = useState(initial ? String(initial.quantity_decimal ?? initial.current_stock ?? "") : "");
  const [min, setMin] = useState(initial ? String(initial.min_stock ?? "") : "");
  const [unit, setUnit] = useState(initial?.unit ?? "pcs");

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ id: initial?.id, item_name, category, qty: parseFloat(qty) || 0, min: parseFloat(min) || 0, unit }); }} className="space-y-3">
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
        <div><Label>{T("Jumlah")}</Label><Input required type="number" step="0.1" min={0} placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
        <div><Label>{T("Stok minimum")}</Label><Input required type="number" step="0.1" min={0} placeholder="0" value={min} onChange={(e) => setMin(e.target.value)} /></div>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{T("Simpan")}</Button>
    </form>
  );
}

// ==================== RECIPE TAB ====================

function RecipeTab() {
  const { T } = useLang();
  const familyId = useFamilyId();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>(T("Semua"));
  const [catMgrOpen, setCatMgrOpen] = useState(false);
  const [confirmDeleteRecipe, setConfirmDeleteRecipe] = useState<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data: cats = [] } = useQuery({
    queryKey: ["recipe-cats", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data } = await (supabase.from as any)("recipe_categories").select("*").eq("family_id", familyId!).is("deleted_at", null).order("name");
      return data ?? [];
    },
  });

  const allCats = useMemo(() => cats.map((c: any) => c.name), [cats]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["recipes", familyId, debouncedSearch, filterCat],
    enabled: !!familyId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      let q = supabase
        .from("recipes")
        .select("*", { count: "exact" })
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + RECIPES_PER_PAGE - 1);

      if (debouncedSearch) q = q.ilike("title", `%${debouncedSearch}%`);
      if (filterCat !== T("Semua")) q = q.eq("category", filterCat);

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], nextPage: pageParam + RECIPES_PER_PAGE, hasMore: (count ?? 0) > pageParam + RECIPES_PER_PAGE };
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextPage : undefined),
  });

  const recipes = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      }, { threshold: 0.1 });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const upsertRecipe = useMutation({
    mutationFn: async (vals: any) => {
      const recipeId = vals.id || crypto.randomUUID();

      // Handle image upload
      let imageUrl = vals.existing_image_url ?? null;
      if (vals.image_file) {
        // Delete old image if editing
        if (vals.id && vals.existing_image_url) {
          await deleteOldRecipeImage(vals.existing_image_url);
        }
        const compressed = await compressImage(vals.image_file);
        imageUrl = await uploadRecipeImage(familyId!, recipeId, compressed);
      } else if (vals.remove_image && vals.id && vals.existing_image_url) {
        // User removed the image
        await deleteOldRecipeImage(vals.existing_image_url);
        imageUrl = null;
      }

      const payload: any = {
        family_id: familyId!,
        title: vals.title,
        category: vals.category,
        image_url: imageUrl,
        description: vals.description || null,
        last_updated_by: profile?.id,
        last_updated_by_name: profile?.full_name,
      };
      if (vals.id) {
        payload.updated_at = new Date().toISOString();
        const { error } = await supabase.from("recipes").update(payload).eq("id", vals.id);
        if (error) throw error;
      } else {
        payload.id = recipeId;
        payload.created_by = profile?.id;
        payload.created_by_name = profile?.full_name;
        const { error } = await supabase.from("recipes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_data, vals) => {
      qc.invalidateQueries({ queryKey: ["recipes", familyId] });
      toast.success(T("Resep tersimpan"));
      setOpen(false);
      setEdit(null);
      tryFeedInsert({
        family_id: familyId!, actor_id: profile?.id, actor_name: profile?.full_name ?? "",
        action_type: "create", entity_type: "recipe",
        description: vals.id ? `mengubah resep ${vals.title}` : `menambah resep ${vals.title}`,
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      const recipe = recipes.find((r: any) => r.id === id);
      qc.invalidateQueries({ queryKey: ["recipes", familyId] });
      qc.invalidateQueries({ queryKey: ["beranda-stats", familyId] });
      toast.success(T("Resep dihapus"));
      setDetail(null);
      if (recipe) {
        tryFeedInsert({
          family_id: familyId!, actor_id: profile?.id, actor_name: profile?.full_name ?? "",
          action_type: "delete", entity_type: "recipe", description: `menghapus resep ${recipe.title}`,
        });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const categoryChips = [T("Semua"), ...allCats];

  return (
    <>
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={T("Cari resep...")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <p className="text-xs font-semibold text-muted-foreground mb-0.5">{T("Kategori")}</p>
        <div className="flex gap-2 flex-wrap">
          {categoryChips.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border", filterCat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}>
              {c}
            </button>
          ))}
          <button onClick={() => setCatMgrOpen(true)} className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground whitespace-nowrap">+ {T("Kategori")}</button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 mb-24">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && <p className="text-center py-12 text-destructive text-sm">{T("Gagal memuat resep")}</p>}

      {!isLoading && !isError && recipes.length === 0 && (
        <div className="text-center py-16 mb-24">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">{T("Belum ada resep")}</p>
          <p className="text-muted-foreground text-xs mt-1">{T("Tambahkan resep masakan favorit keluarga")}</p>
        </div>
      )}

      {!isLoading && !isError && recipes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-24">
          {recipes.map((recipe: any, i: number) => {
            const isLast = i === recipes.length - 1;
            return (
              <div
                key={recipe.id}
                ref={isLast ? lastItemRef : undefined}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-soft cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() => setDetail(recipe)}
              >
                <div className="aspect-square bg-muted relative">
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {recipe.category && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-background/80 backdrop-blur text-foreground">
                      {recipe.category}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="font-semibold text-sm line-clamp-2 leading-tight">{recipe.title}</p>
                  {recipe.last_updated_by_name && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{T("Diupdate oleh")} {recipe.last_updated_by_name}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(recipe.created_at), { addSuffix: true, locale: idLocale })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFetchingNextPage && (
        <div className="flex justify-center mb-24 pb-4">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* FAB Tambah Resep */}
      <Dialog open={open || !!edit} onOpenChange={(v) => { if (!v) { setOpen(false); setEdit(null); } }}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-24 left-1/2 -translate-x-1/2 shadow-card rounded-full h-12 px-5" size="lg" onClick={() => setOpen(true)}>
            <Plus className="h-5 w-5 mr-1" /> {T("Tambah Resep")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit ? T("Edit resep") : T("Resep baru")}</DialogTitle></DialogHeader>
          <RecipeForm initial={edit} categories={allCats} onSubmit={(v) => upsertRecipe.mutate(v)} busy={upsertRecipe.isPending} />
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
          {detail && (
            <>
              {detail.image_url ? (
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  <img src={detail.image_url} alt={detail.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
                    {detail.category && (
                      <span className="inline-block w-fit px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/20 backdrop-blur text-white mb-1.5">
                        {detail.category}
                      </span>
                    )}
                    <h2 className="text-xl font-bold text-white">{detail.title}</h2>
                  </div>
                </div>
              ) : (
                <DialogHeader className="space-y-1.5 p-4 pb-0">
                  {detail.category && (
                    <span className="inline-block w-fit px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                      {detail.category}
                    </span>
                  )}
                  <DialogTitle className="text-lg">{detail.title}</DialogTitle>
                </DialogHeader>
              )}
              <div className="space-y-3 p-4">
                {detail.description && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">{T("Deskripsi")}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.description}</p>
                  </div>
                )}
                {detail.last_updated_by_name && (
                  <p className="text-[11px] text-muted-foreground">{T("Diupdate oleh")} {detail.last_updated_by_name}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {T("Dibuat")} {formatDistanceToNow(new Date(detail.created_at), { addSuffix: true, locale: idLocale })}
                  {detail.updated_at && detail.updated_at !== detail.created_at && ` · ${T("Diupdate")} ${formatDistanceToNow(new Date(detail.updated_at), { addSuffix: true, locale: idLocale })}`}
                </p>
              </div>
              <div className="flex gap-2 p-4 pt-0">
                <Button variant="outline" className="flex-1" onClick={() => { setEdit(detail); setDetail(null); }}>
                  <Edit2 className="h-4 w-4 mr-1" /> {T("Edit")}
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => setConfirmDeleteRecipe(detail)}>
                  <Trash2 className="h-4 w-4 mr-1" /> {T("Hapus")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CategoryManager open={catMgrOpen} onOpenChange={setCatMgrOpen} familyId={familyId!} categories={cats} type="recipe" />

      <ConfirmDialog
        open={!!confirmDeleteRecipe}
        onOpenChange={() => setConfirmDeleteRecipe(null)}
        title={T("Hapus resep ini?")}
        onConfirm={() => deleteRecipe.mutate(confirmDeleteRecipe.id)}
      />
    </>
  );
}

function RecipeForm({ initial, categories, onSubmit, busy }: { initial: any; categories: string[]; onSubmit: (v: any) => void; busy: boolean }) {
  const { T } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url ?? null); // existing URL or object URL
  const [removeImage, setRemoveImage] = useState(false);
  const [description, setDescription] = useState(initial?.description ?? "");

  // Sync category when categories load after dialog opens
  useEffect(() => {
    if (!initial?.category && categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories, initial, category]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
    // Reset input value so picking the same file again triggers onChange
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setRemoveImage(true);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({
        id: initial?.id,
        title,
        category,
        image_file: imageFile,
        existing_image_url: initial?.image_url ?? null,
        remove_image: removeImage,
        description,
      });
    }} className="space-y-3">
      <div><Label>{T("Judul")}</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={T("Nama resep")} /></div>
      <div><Label>{T("Kategori")}</Label>
        {categories.length > 0 ? (
          <Select value={category && categories.includes(category) ? category : categories[0]} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder={T("Pilih kategori")} /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={T("Nama kategori")} />
        )}
      </div>
      <div>
        <Label>{T("Gambar")}</Label>
        {imagePreview ? (
          <div className="relative mt-1.5 rounded-lg overflow-hidden border border-border">
            <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 rounded-full bg-destructive/80 text-white hover:bg-destructive transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1.5 w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">{T("Upload Gambar")}</span>
            <span className="text-xs">{T("JPG, PNG, WebP (max 5MB)")}</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <div><Label>{T("Deskripsi")}</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={T("Bahan, langkah memasak...")} /></div>
      <Button type="submit" className="w-full" disabled={busy}>{T("Simpan")}</Button>
    </form>
  );
}

// ==================== WISHLIST TAB ====================

function WishlistTab() {
  const { T } = useLang();
  const familyId = useFamilyId();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmDeleteWishlist, setConfirmDeleteWishlist] = useState<any>(null);

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
      const { error } = await supabase.from("wishlist_items").insert({ ...v, family_id: familyId!, last_updated_by: profile?.id, last_updated_by_name: profile?.full_name });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wishlist", familyId] }); toast.success(T("Wishlist ditambah")); setOpen(false); },
  });

  const buy = useMutation({
    mutationFn: async (item: any) => {
      await supabase.from("wishlist_items").update({ purchased_at: new Date().toISOString(), last_updated_by: profile?.id, last_updated_by_name: profile?.full_name }).eq("id", item.id);
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
                {w.last_updated_by_name && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{T("Diupdate oleh")} {w.last_updated_by_name}</p>
                )}
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setConfirmDeleteWishlist(w)}><Trash2 className="h-4 w-4" /></Button>
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

      <ConfirmDialog
        open={!!confirmDeleteWishlist}
        onOpenChange={() => setConfirmDeleteWishlist(null)}
        title={T("Hapus item ini?")}
        onConfirm={() => del.mutate(confirmDeleteWishlist.id)}
      />
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
  const priceInput = useCurrencyInput();
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ item_name, estimated_price: priceInput.value, priority, notes }); }} className="space-y-3">
      <div><Label>{T("Nama item")}</Label><Input required value={item_name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>{T("Harga estimasi")}</Label><Input type="text" inputMode="numeric" ref={priceInput.inputRef} value={priceInput.displayValue} onChange={priceInput.handleChange} onBlur={priceInput.handleBlur} placeholder="0" /></div>
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

// ==================== CATEGORY MANAGER (shared) ====================

function CategoryManager({ open, onOpenChange, familyId, categories, type }: { open: boolean; onOpenChange: (v: boolean) => void; familyId: string; categories: any[]; type: "shopping" | "recipe" }) {
  const { T } = useLang();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<any>(null);
  const tableName = type === "recipe" ? "recipe_categories" : "shopping_categories";
  const queryKey = type === "recipe" ? ["recipe-cats", familyId] : ["shopping-cats", familyId];

  const add = useMutation({
    mutationFn: async () => {
      if (!name.trim()) return;
      const { error } = await (supabase.from as any)(tableName).insert({ family_id: familyId, name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey }); toast.success(T("Kategori ditambah")); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)(tableName).update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
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
            {type === "shopping" && <p className="text-xs text-muted-foreground">{T("Kategori bawaan tidak dapat dihapus.")}</p>}
            {type === "shopping" && DEFAULT_CATEGORIES.map((c) => <div key={c} className="text-sm px-3 py-2 bg-secondary/40 rounded-lg">{c} <span className="text-[10px] text-muted-foreground ml-1">{T("bawaan")}</span></div>)}
            {categories.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{T("Belum ada kategori")}</p>}
            {categories.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-card border border-border rounded-lg">
                <span className="text-sm">{c.name}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setConfirmDeleteCategory(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>

      <ConfirmDialog
        open={!!confirmDeleteCategory}
        onOpenChange={() => setConfirmDeleteCategory(null)}
        title={T("Hapus kategori ini?")}
        onConfirm={() => del.mutate(confirmDeleteCategory.id)}
      />
    </Dialog>
  );
}