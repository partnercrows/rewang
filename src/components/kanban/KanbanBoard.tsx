import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn, daysUntil } from "@/lib/utils";

const STATUSES = ["To Do", "In Progress", "On Hold", "Done"] as const;
type Status = typeof STATUSES[number];

const COLUMN_STYLE: Record<Status, string> = {
  "To Do": "border-muted-foreground/30",
  "In Progress": "border-primary",
  "On Hold": "border-warning",
  "Done": "border-success",
};

async function tryFeedInsert(payload: Record<string, unknown>) {
  try { await supabase.from("activity_feed").insert(payload); } catch {}
}

export function KanbanBoard({ familyId }: { familyId: string }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: cards = [] } = useQuery({
    queryKey: ["kanban", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_boards")
        .select("*")
        .eq("family_id", familyId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addCard = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("kanban_boards").insert({ ...v, family_id: familyId });
      if (error) throw error;
    },
    onSuccess: (_data, v) => {
      qc.invalidateQueries({ queryKey: ["kanban", familyId] });
      toast.success("Tugas dibuat");
      setOpen(false);
      // Fire & forget feed insert
      tryFeedInsert({
        family_id: familyId, actor_id: profile?.id, actor_name: profile?.full_name,
        action_type: "task", entity_type: "kanban", description: `menambahkan tugas "${v.title}"`,
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const card = cards.find((c) => c.id === id);
      const { error } = await supabase.from("kanban_boards").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, { id, status }) => {
      qc.invalidateQueries({ queryKey: ["kanban", familyId] });
      const card = cards.find((c) => c.id === id);
      if (card) {
        tryFeedInsert({
          family_id: familyId, actor_id: profile?.id, actor_name: profile?.full_name,
          action_type: "task", entity_type: "kanban", description: `memindahkan "${card.title}" ke ${status}`,
        });
      }
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kanban_boards").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban", familyId] }),
  });

  return (
    <div>
      <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-3 snap-x">
        {STATUSES.map((s) => {
          const list = cards.filter((c) => c.status === s);
          return (
            <div key={s} className={cn("min-w-[80%] snap-start bg-secondary/50 rounded-2xl border-t-4 p-3", COLUMN_STYLE[s])}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{s}</h3>
                <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">Kosong</p>}
                {list.map((c) => (
                  <div key={c.id} className="bg-card border border-border rounded-lg p-3 shadow-soft">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{c.title}</p>
                      <button onClick={() => del.mutate(c.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                    {c.target_date && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        ⏰ {daysUntil(c.target_date) >= 0 ? `${daysUntil(c.target_date)} hari lagi` : `Telat ${-daysUntil(c.target_date)} hari`}
                      </p>
                    )}
                    <Select value={c.status as string} onValueChange={(v) => updateStatus.mutate({ id: c.id, status: v as Status })}>
                      <SelectTrigger className="h-7 text-xs mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full mt-2"><Plus className="h-4 w-4 mr-1" /> Tugas baru</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Tugas baru</DialogTitle></DialogHeader>
          <AddCardForm onSubmit={(v) => addCard.mutate(v)} busy={addCard.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddCardForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [category, setCat] = useState("Umum");
  const [target_date, setDate] = useState("");
  const [status, setStatus] = useState<Status>("To Do");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, description, category, target_date: target_date || null, status }); }} className="space-y-3">
      <div><Label>Judul</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div><Label>Deskripsi</Label><Textarea rows={2} value={description} onChange={(e) => setDesc(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Kategori</Label><Input value={category} onChange={(e) => setCat(e.target.value)} /></div>
        <div><Label>Target</Label><Input type="date" value={target_date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>
      <div>
        <Label>Status awal</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>Simpan</Button>
    </form>
  );
}
