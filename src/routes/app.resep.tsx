import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { useMutation, useQueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ChevronLeft, Upload, X } from "lucide-react";
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
    // fallback: return original file if compression fails
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
    // Extract path from public URL: https://xxx.supabase.co/storage/v1/object/public/recipe-images/familyId/file.jpg
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/public\/recipe-images\/(.+)$/);
    if (pathMatch?.[1]) {
      await supabase.storage.from("recipe-images").remove([decodeURIComponent(pathMatch[1])]);
    }
  } catch {
    // ignore cleanup errors
  }
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
  const fileRef = useRef<HTMLInputElement>(null);

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
  const [formCategory, setFormCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null); // existing image URL or object URL

  const limits = useSubscriptionGate();

  const { data: recipeCount, isLoading: countLoading } = useQuery({
    queryKey: ["recipes", familyId, "count"],
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("recipes")
        .select("*", { count: "exact", head: true })
        .eq("family_id", familyId!)
        .is("deleted_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

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
    staleTime: 5 * 60 * 1000,
  });

  const allItems = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      // Safety net: cek limit lagi sebelum insert berdasarkan tier
      if (!editData?.id) {
        if (limits.tier === "none" || !limits.isActive) {
          throw new Error(T("Anda belum berlangganan. Upgrade untuk menambah resep."));
        }
        if (limits.tier === "starter") {
          const { count: currentCount, error: countErr } = await supabase
            .from("recipes")
            .select("*", { count: "exact", head: true })
            .eq("family_id", familyId!)
            .is("deleted_at", null);
          if (countErr) throw countErr;
          if ((currentCount ?? 0) >= limits.maxFavoriteRecipes) {
            throw new Error(T("Batas 10 resep tercapai. Upgrade ke Family untuk resep tak terbatas."));
          }
        }
      }

      // Generate a temporary ID for new recipes (needed for upload path)
      const recipeId = editData?.id || crypto.randomUUID();

      // Upload image if a new file is selected
      let imageUrl = editData?.image_url ?? null;
      if (formImageFile) {
        // Delete old image if editing
        if (editData?.id && editData.image_url) {
          await deleteOldRecipeImage(editData.image_url);
        }
        const compressed = await compressImage(formImageFile);
        imageUrl = await uploadRecipeImage(familyId!, recipeId, compressed);
      } else if (formImagePreview === null && editData?.id && editData.image_url) {
        // User removed the image (preview cleared)
        await deleteOldRecipeImage(editData.image_url);
        imageUrl = null;
      }

      const payload: any = {
        family_id: familyId!,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        image_url: imageUrl,
        category: formCategory,
        last_updated_by: profile?.id,
        last_updated_by_name: profile?.full_name,
      };
      if (editData?.id) {
        payload.updated_at = new Date().toISOString();
        const { error } = await supabase.from("recipes").update(payload).eq("id", editData.id);
        if (error) throw error;
      } else {
        payload.id = recipeId;
        payload.created_by = profile?.id;
        payload.created_by_name = profile?.full_name;
        const { error } = await supabase.from("recipes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes", familyId] });
      qc.invalidateQueries({ queryKey: ["recipes", familyId, "count"] });
      toast.success(T("Tersimpan"));
      setOpen(false);
      setEditData(null);
      setFormTitle("");
      setFormDescription("");
      setFormCategory(DEFAULT_CATEGORIES[0]);
      setFormImageFile(null);
      setFormImagePreview(null);
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

  const isAtLimit = limits.tier === "starter" && (recipeCount ?? 0) >= limits.maxFavoriteRecipes;

  const openAdd = () => {
    if (limits.tier === "none" || !limits.isActive) {
      toast.error(T("Anda belum berlangganan. Upgrade untuk menambah resep."));
      return;
    }
    if (countLoading) {
      toast.error(T("Memuat data..."));
      return;
    }
    if (isAtLimit) {
      toast.error(T("Batas 10 resep tercapai. Upgrade ke Family untuk resep tak terbatas."));
      return;
    }
    setEditData(null);
    setFormTitle("");
    setFormDescription("");
    setFormCategory(DEFAULT_CATEGORIES[0]);
    setFormImageFile(null);
    setFormImagePreview(null);
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditData(item);
    setFormTitle(item.title ?? "");
    setFormDescription(item.description ?? "");
    setFormCategory(item.category ?? DEFAULT_CATEGORIES[0]);
    setFormImageFile(null);
    setFormImagePreview(item.image_url ?? null);
    setOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormImageFile(file);
    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setFormImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    setFormImageFile(null);
    if (formImagePreview && !editData?.image_url) {
      URL.revokeObjectURL(formImagePreview);
    }
    setFormImagePreview(null);
  };

  const handleCardClick = (id: string) => {
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
          <Button size="icon" onClick={openAdd} className="shrink-0" disabled={limits.tier === "none" || !limits.isActive || countLoading || isAtLimit}>
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
              {T(c)}
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
                <p className="text-xs text-primary font-semibold mb-0.5">{T(item.category)}</p>
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
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditData(null); setFormImageFile(null); setFormImagePreview(null); } }}>
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
                    <SelectItem key={c} value={c}>{T(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{T("Gambar")}</Label>
              {formImagePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={formImagePreview} alt="Preview" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <Upload className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm">{T("Upload gambar")}</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <Label>{T("Deskripsi")}</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={T("Bahan, langkah, dsb...")}
                rows={20}
                className="min-h-[400px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditData(null); setFormImageFile(null); setFormImagePreview(null); }}>{T("Batal")}</Button>
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