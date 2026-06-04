import { createFileRoute, Link } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import {
  Check, Circle, User, Flame, Sparkles, Plus, ChevronLeft, ListChecks,
  Trash2, Clock, Search, Repeat, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export const Route = createFileRoute("/app/tugas")({
  head: () => ({ meta: [{ title: "Tugas — Rewang" }] }),
  component: TugasPage,
});

const PRIORITY_CONFIG: Record<string, { icon: any; color: string }> = {
  high: { icon: Flame, color: "text-red-500 bg-red-50 dark:bg-red-950/30" },
  normal: { icon: Circle, color: "text-slate-400 bg-slate-50 dark:bg-slate-800/30" },
  low: { icon: Circle, color: "text-slate-300 bg-slate-50 dark:bg-slate-800/30" },
};

function TugasPage() {
  const { profile, family } = useAuth();
  const { lang, T } = useLang();
  const familyId = family?.id;
  const qc = useQueryClient();
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "done">("all");
  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch members for name lookup
  const { data: members = [] } = useQuery({
    queryKey: ["family-members", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name")
        .eq("family_id", familyId!)
        .is("deleted_at", null);
      return data ?? [];
    },
  });

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return null;
    if (memberId === profile?.id) return T("Kamu", "You");
    const m = members.find((m: any) => m.id === memberId);
    return m?.full_name?.split(" ")[0] ?? null;
  };

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["daily-tasks-all", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("daily_tasks")
        .select("*")
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleDone = useMutation({
    mutationFn: async (task: any) => {
      const newDone = !task.is_done;
      const updates: any = {
        is_done: newDone,
        done_at: newDone ? new Date().toISOString() : null,
        done_by: newDone ? profile?.id : null,
      };
      await (supabase as any).from("daily_tasks").update(updates).eq("id", task.id);

      // Activity feed (fire & forget — jangan blocking)
      if (newDone) {
        (async () => {
          try {
            await supabase.from("activity_feed").insert({
              family_id: familyId!,
              actor_id: profile?.id,
              actor_name: profile?.full_name ?? "",
              action_type: "complete_task",
              entity_type: "daily_task",
              description: `menyelesaikan tugas "${task.title}"`,
            });
          } catch { /* ignore */ }
        })();
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-tasks-all", familyId] });
      qc.invalidateQueries({ queryKey: ["daily-tasks", familyId] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("daily_tasks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-tasks-all", familyId] });
      qc.invalidateQueries({ queryKey: ["daily-tasks", familyId] });
      toast.success(T("Dihapus", "Deleted"));
    },
  });

  // Filter logic
  let filtered = tasks;
  if (filterStatus === "active") filtered = filtered.filter((t: any) => !t.is_done);
  if (filterStatus === "done") filtered = filtered.filter((t: any) => t.is_done);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((t: any) => t.title?.toLowerCase().includes(q));
  }

  return (
    <MainLayout>
      {/* Header */}
      <header className="flex items-center gap-2 mb-5">
        <Button asChild variant="ghost" size="icon" className="h-9 w-9">
          <Link to="/app">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{T("Aktivitas Hari Ini", "Today's Tasks")}</h1>
          <p className="text-[11px] text-muted-foreground">
            {tasks.length} {lang === "id" ? "tugas" : "tasks"}
          </p>
        </div>
        <AddTaskDialog
          familyId={familyId!}
          profile={profile}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["daily-tasks-all", familyId] });
            qc.invalidateQueries({ queryKey: ["daily-tasks", familyId] });
          }}
        />
      </header>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={T("Cari tugas...", "Search tasks...")}
            className="pl-9 bg-card"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-[110px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{T("Semua", "All")}</SelectItem>
            <SelectItem value="active">{T("Aktif", "Active")}</SelectItem>
            <SelectItem value="done">{T("Selesai", "Done")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-3 flex gap-2 animate-pulse shadow-soft"
            >
              <div className="h-5 w-5 rounded-full bg-muted shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2 mt-1" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-card border border-dashed border-border rounded-2xl">
          <ListChecks className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? T("Tidak ada tugas ditemukan", "No tasks found")
              : T("Belum ada tugas hari ini", "No tasks yet")}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((t: any) => {
            const isDone = t.is_done;
            const prio = PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.normal;
            const PrioIcon = prio.icon;

            return (
              <div
                key={t.id}
                className={cn(
                  "bg-card border rounded-xl p-3 flex items-start gap-2.5 shadow-soft transition active:scale-[0.99]",
                  isDone
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10"
                    : "border-border",
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleDone.mutate(t)}
                  disabled={toggleDone.isPending}
                  className={cn(
                    "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    isDone
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-muted-foreground/30 hover:border-primary",
                  )}
                >
                  {isDone && <Check className="h-3 w-3" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium leading-snug",
                      isDone && "line-through text-muted-foreground",
                    )}
                  >
                    {t.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {t.assigned_to && getMemberName(t.assigned_to) && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <User className="h-3 w-3" />
                        {getMemberName(t.assigned_to)}
                      </span>
                    )}
                    {t.is_recurring && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        <Repeat className="h-3 w-3" />
                        {T("Berulang", "Recurring")}
                      </span>
                    )}
                    {t.priority && t.priority !== "normal" && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium",
                          prio.color,
                        )}
                      >
                        <PrioIcon className="h-3 w-3" />
                        {t.priority === "high" ? "🔥" : ""}
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ {T("Selesai", "Done")}
                      </span>
                    )}
                  </div>
                  {t.notes && (
                    <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-2">
                      {t.notes}
                    </p>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => setConfirmDeleteTask(t)}
                  disabled={del.isPending}
                  className="text-muted-foreground/40 hover:text-destructive shrink-0 mt-0.5 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={!!confirmDeleteTask}
        onOpenChange={(v) => { if (!v) setConfirmDeleteTask(null); }}
        title="Hapus tugas ini?"
        confirmLabel="Hapus"
        onConfirm={() => { if (confirmDeleteTask) del.mutate(confirmDeleteTask.id); setConfirmDeleteTask(null); }}
        isLoading={del.isPending}
      />
    </MainLayout>
  );
}

function AddTaskDialog({
  familyId,
  profile,
  onSuccess,
}: {
  familyId: string;
  profile: any;
  onSuccess: () => void;
}) {
  const { T } = useLang();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("normal");
  const [isRecurring, setIsRecurring] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    const { error } = await (supabase as any).from("daily_tasks").insert({
      family_id: familyId,
      title: title.trim(),
      notes: notes.trim() || null,
      priority,
      is_recurring: isRecurring,
      is_done: false,
      created_by: profile?.id,
    });
    if (error) {
      toast.error("Gagal menambah tugas");
      setBusy(false);
      return;
    }
    // Success — close dialog & reset form FIRST
    toast.success(T("Tugas ditambahkan", "Task added"));
    setTitle("");
    setNotes("");
    setPriority("normal");
    setIsRecurring(false);
    setOpen(false);
    onSuccess();
    setBusy(false);
    // Activity feed (fire & forget — jangan blocking)
    (async () => {
      try {
        await supabase.from("activity_feed").insert({
          family_id: familyId,
          actor_id: profile?.id,
          actor_name: profile?.full_name ?? "",
          action_type: "create_task",
          entity_type: "daily_task",
          description: `menambahkan tugas "${title.trim()}"${isRecurring ? " (berulang)" : ""}`,
        });
      } catch { /* ignore */ }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl shrink-0">
          <Plus className="h-4 w-4 mr-1" /> {T("Tambah", "Add")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{T("Tambah Tugas", "Add Task")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>{T("Judul", "Title")}</Label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={T("Nama tugas...", "Task name...")}
            />
          </div>
          <div>
            <Label>{T("Catatan", "Notes")}</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={T("Opsional", "Optional")}
            />
          </div>
          <div>
            <Label>{T("Prioritas", "Priority")}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">🔥 {T("tinggi", "high")}</SelectItem>
                <SelectItem value="normal">⚡ {T("normal", "normal")}</SelectItem>
                <SelectItem value="low">○ {T("rendah", "low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label className="text-sm">{T("Tugas Berulang", "Recurring Task")}</Label>
              <p className="text-[11px] text-muted-foreground">
                {T("Muncul setiap hari", "Appears every day")}
              </p>
            </div>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>
          <Button type="submit" className="w-full" disabled={busy || !title.trim()}>
            {T("Simpan", "Save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}