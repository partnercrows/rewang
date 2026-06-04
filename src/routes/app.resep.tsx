import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ChevronLeft } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const PAGE_SIZE = 12;

const DEFAULT_CATEGORIES = ["Sarapan", "Makan Siang", "Makan Malam", "Kue", "Minuman", "Lainnya"];

async function tryFeedInsert(payload: Record<string, unknown>) {
  try { await supabase.from("activity_feed").insert(payload as any); } catch { /* ignore */ }
}

export const Route = createFileRoute("/app/resep")({
  head: () => ({ meta: [{ title: "Resep — Rewang" }] }),
  component: ResepListPage,
});

function ResepListPage() {
  const { T } = useLang();
  const { family, profile } = useAuth();
  const familyId = family?.id;
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>(T("Semua"));
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCategory, setFormCategory] = useState(DEFAULT_CATEGORIES[0]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["recipes", familyId, filterCat, search],
    enabled: !!familyId,
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("recipes")
        .select("*", { count: "exact" })
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (filterCat !== T("Semua")) {
        query = query.eq("category", filterCat);
      }
      if (search) {
        const escaped = search.replace(/[%_]/g, "\\$&");
        query = query.ilike("title", `%${escaped}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0, nextPage: pageParam + 1 };
    },
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.count / PAGE_SIZE);
      return lastPage.nextPage < totalPages ? lastPage.nextPage : undefined;
    },
    initialPageParam: 0,
  });

  const allItems = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        family_id: familyId!,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        image_url: formImageUrl.trim() || null,
        category: formCategory,
        last_updated_by: profile?.id,
        last_updated_by_name: profile?.full_name,
      };
      if (editData?.id) {
        payload.updated_at = new Date().toISOString();
        const { error } = await supabase.from("recipes").update(payload).eq("id", editData.id);
        if (error) throw error;
      } else {
        payload.created_by = profile?.id;
        payload.created_by_name = profile?.full_name;
        const { error } = await supabase.from("recipes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes", familyId] });
      toast.success(T("Tersimpan"));
      setOpen(false);
      setEditData(null);
      setFormTitle("");
      setFormDescription("");
      setFormImageUrl("");
      setFormCategory(DEFAULT_CATEGORIES[0]);
      tryFeedInsert({
        family_id: familyId!,
        actor_id: profile?.id,
        actor_name: profile?.full_name ?? "",
        action_type: "create",
        entity_type: "recipe",
        description: editData ? `mengubah resep ${formTitle}` : `menambah resep ${formTitle}`,
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const categoryChips = [T("Semua"), ...DEFAULT_CATEGORIES];

  const openAdd = () => {
    setEditData(null);
    setFormTitle("");
    setFormDescription("");
    setFormImageUrl("");
    setFormCategory(DEFAULT_CATEGORIES[0]);
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditData(item);
    setFormTitle(item.title ?? "");
    setFormDescription(item.description ?? "");
    setFormImageUrl(item.image_url ?? "");
    setFormCategory(item.category ?? DEFAULT_CATEGORIES[0]);
    setOpen(true);
  };

  const handleCardClick = (id: string) => {
    // dynamically navigate to detail
    navigate({ to: "/app/resep/$resepId" as any, params: { resepId: id } as any });
  };

  return (
    <MainLayout title={T("Resep")}>
      <div className="space-y-3 mb-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate({ to: "/app" })}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={T("Cari resep...")} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <Button size="icon" onClick={openAdd} className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs font-semibold text-muted-foreground mb-0.5">{T("Kategori")}</p>
        <div className="flex gap-2 flex-wrap">
          {categoryChips.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border",
                filterCat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground text-sm">{T("Memuat...")}</div>
      )}

      {isError && (
        <div className="text-center py-12 text-destructive text-sm">
          {T("Gagal memuat resep")}
          {error instanceof Error && <span className="block text-xs mt-1 opacity-70">{error.message}</span>}
        </div>
      )}

      {!isLoading && !isError && allItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">{T("Belum ada resep")}</div>
      )}

      {!isLoading && !isError && allItems.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-24">
          {allItems.map((item: any) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item.id)}
              className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    {T("Tanpa Gambar")}
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs text-primary font-semibold mb-0.5">{item.category}</p>
                <p className="text-sm font-bold line-clamp-2 leading-snug">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: idLocale })}
                </p>
                {item.last_updated_by_name && (
                  <p className="text-[10px] text-muted-foreground">
                    {T("Diupdate oleh")} {item.last_updated_by_name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isError && hasNextPage && (
        <div className="flex justify-center mb-24">
          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? T("Memuat...") : T("Muat Lebih")}
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditData(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editData ? T("Edit Resep") : T("Tambah Resep")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{T("Judul")}</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder={T("Nama resep...")} />
            </div>
            <div>
              <Label>{T("Kategori")}</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{T("Gambar (URL)")}</Label>
              <Input value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>{T("Deskripsi")}</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={T("Bahan, langkah, dsb...")}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditData(null); }}>{T("Batal")}</Button>
            <Button
              disabled={!formTitle.trim() || upsertMutation.isPending}
              onClick={() => upsertMutation.mutate()}
            >
              {upsertMutation.isPending ? T("Menyimpan...") : T("Simpan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}