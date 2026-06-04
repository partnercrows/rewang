import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const DEFAULT_CATEGORIES = ["Sarapan", "Makan Siang", "Makan Malam", "Kue", "Minuman", "Lainnya"];

type RecipeRow = Tables<"recipes">;

export const Route = createFileRoute("/app/resep/$resepId")({
  head: () => ({ meta: [{ title: "Detail Resep — Rewang" }] }),
  component: ResepDetailPage,
});

function ResepDetailPage() {
  const { T } = useLang();
  const { family, profile } = useAuth();
  const familyId = family?.id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { resepId } = Route.useParams();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCategory, setFormCategory] = useState(DEFAULT_CATEGORIES[0]);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe", resepId],
    enabled: !!resepId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", resepId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Resep tidak ditemukan");
      return data as RecipeRow;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("recipes")
        .update({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          image_url: formImageUrl.trim() || null,
          category: formCategory,
          updated_at: new Date().toISOString(),
          last_updated_by: profile?.id,
          last_updated_by_name: profile?.full_name,
        } as any)
        .eq("id", resepId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipe", resepId] });
      qc.invalidateQueries({ queryKey: ["recipes", familyId] });
      toast.success(T("Resep diperbarui"));
      setEditOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("recipes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", resepId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes", familyId] });
      toast.success(T("Resep dihapus"));
      navigate({ to: "/app/resep" as any });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDelete = () => {
    setConfirmDelete(true);
  };

  const openEditDialog = () => {
    if (!recipe) return;
    setFormTitle(recipe.title ?? "");
    setFormDescription(recipe.description ?? "");
    setFormImageUrl(recipe.image_url ?? "");
    setFormCategory(recipe.category ?? DEFAULT_CATEGORIES[0]);
    setEditOpen(true);
  };

  if (isLoading) {
    return (
      <MainLayout title={T("Detail Resep")}>
        <div className="text-center py-12 text-muted-foreground text-sm">{T("Memuat...")}</div>
      </MainLayout>
    );
  }

  if (!recipe) {
    return (
      <MainLayout title={T("Detail Resep")}>
        <div className="text-center py-12 text-muted-foreground text-sm">{T("Resep tidak ditemukan")}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={T("Detail Resep")}>
      {/* Back button */}
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => navigate({ to: "/app/resep" as any })}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        {T("Kembali ke Resep")}
      </Button>

      {/* Image with overlay */}
      {recipe.image_url ? (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-muted">
          <img src={recipe.image_url} alt={recipe.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/80 text-white w-fit mb-1.5">
              {recipe.category}
            </span>
            <h1 className="text-lg font-extrabold text-white drop-shadow-lg">{recipe.title}</h1>
            <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
              <span>{recipe.created_by_name ?? T("Anggota")}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(recipe.created_at), { addSuffix: true, locale: idLocale })}</span>
              {recipe.updated_at && recipe.updated_at !== recipe.created_at && (
                <>
                  <span>·</span>
                  <span>{T("Diperbarui")} {formatDistanceToNow(new Date(recipe.updated_at), { addSuffix: true, locale: idLocale })}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
            {recipe.category}
          </span>
          <h1 className="text-xl font-extrabold mb-2">{recipe.title}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <span>{recipe.created_by_name ?? T("Anggota")}</span>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(recipe.created_at), { addSuffix: true, locale: idLocale })}</span>
            {recipe.updated_at && recipe.updated_at !== recipe.created_at && (
              <>
                <span>·</span>
                <span>{T("Diperbarui")} {formatDistanceToNow(new Date(recipe.updated_at), { addSuffix: true, locale: idLocale })}</span>
              </>
            )}
          </div>
        </>
      )}

      {/* Description */}
      {recipe.description ? (
        <div className="prose prose-sm max-w-full overflow-hidden mb-6">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{recipe.description}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic mb-6">{T("Belum ada deskripsi")}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={openEditDialog}>
          <Edit2 className="h-4 w-4 mr-1" />
          {T("Edit")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending} className="text-destructive border-destructive/30 hover:bg-destructive/10">
          <Trash2 className="h-4 w-4 mr-1" />
          {deleteMutation.isPending ? T("Menghapus...") : T("Hapus")}
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{T("Edit Resep")}</DialogTitle>
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
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{T("Batal")}</Button>
            <Button
              disabled={!formTitle.trim() || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? T("Menyimpan...") : T("Simpan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={T("Yakin ingin menghapus resep ini?")}
        confirmLabel={T("Hapus")}
        onConfirm={() => deleteMutation.mutate()}
      />
    </MainLayout>
  );
}