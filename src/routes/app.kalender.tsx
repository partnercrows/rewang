import { createFileRoute } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIBUR_NASIONAL } from "@/lib/holidays";

export const Route = createFileRoute("/app/kalender")({
  head: () => ({ meta: [{ title: "Kalender — Rewang" }] }),
  component: KalenderPage,
});

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function KalenderPage() {
  const { T } = useLang();
  const familyId = useAuth().family?.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const range = getMonthRange(year, month);

  const { data: events = [] } = useQuery({
    queryKey: ["calendar", familyId, range.start, range.end],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_events")
        .select("*")
        .eq("family_id", familyId!)
        .gte("event_date", range.start)
        .lte("event_date", range.end)
        .is("deleted_at", null)
        .order("event_date");
      if (error) throw error;
      return data;
    },
  });

  const addEvent = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("agenda_events").insert({ ...v, family_id: familyId! });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar", familyId] });
      qc.invalidateQueries({ queryKey: ["home-agenda", familyId] });
      qc.invalidateQueries({ queryKey: ["feed", familyId] });
      toast.success(T("Agenda ditambahkan"));
      setOpen(false);
    },
  });

  const delEvent = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("agenda_events").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar", familyId] });
      qc.invalidateQueries({ queryKey: ["home-agenda", familyId] });
      qc.invalidateQueries({ queryKey: ["feed", familyId] });
      toast.success(T("Agenda dihapus"));
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!familyId) return;
    const ch = supabase
      .channel(`calendar-${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agenda_events", filter: `family_id=eq.${familyId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["calendar", familyId] });
          qc.invalidateQueries({ queryKey: ["home-agenda", familyId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [familyId, qc]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const eventsByDate: Record<string, any[]> = {};
  events.forEach((e: any) => {
    const d = e.event_date;
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(e);
  });

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  // Helper: check if a date is weekend (Sabtu=6, Minggu=0)
  const isWeekend = (y: number, m: number, d: number) => {
    const dayOfWeek = new Date(y, m, d).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const todayEvents = (eventsByDate[selectedDate || todayStr] || []).sort(
    (a, b) => (a.created_at || "").localeCompare(b.created_at || "")
  );

  // Check if there is holiday info to show below calendar
  const selectedLibur = selectedDate ? LIBUR_NASIONAL[selectedDate] : LIBUR_NASIONAL[todayStr];
  const todayLibur = LIBUR_NASIONAL[todayStr];

  return (
    <MainLayout title={T("Kalender")}>
      <div className="flex items-center justify-between mb-4 gap-1">
        <Button variant="ghost" size="icon" onClick={() => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); }}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-bold">{monthNames[month]}</h2>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="h-8 w-[5.5rem] rounded-md border-0 bg-secondary px-2 text-sm font-semibold cursor-pointer focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 41 }, (_, i) => 2010 + i).map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={() => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); }}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center mb-1.5">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, idx) => (
          <div key={d} className={cn("text-[10px] font-semibold py-1", (idx === 0 || idx === 6) ? "text-red-500" : "text-muted-foreground")}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasEvents = eventsByDate[dateStr]?.length > 0;
          const eventCount = eventsByDate[dateStr]?.length || 0;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const weekend = isWeekend(year, month, day);
          const isLibur = !!LIBUR_NASIONAL[dateStr];
          const isRed = weekend || isLibur;
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={cn(
                "relative aspect-square rounded-md flex flex-col items-center justify-center transition-all min-w-0 overflow-hidden border-2 border-transparent",
                "text-[10px] leading-tight",
                isToday && "bg-primary/10 font-extrabold",
                isSelected && "bg-primary text-primary-foreground",
                !isToday && !isSelected && "hover:bg-secondary",
                hasEvents && !isSelected && "border-amber-400",
                hasEvents && isSelected && "border-amber-300",
              )}
            >
              <span className={cn("text-[10px] leading-none", isRed && !isSelected && "text-red-500 font-semibold")}>{day}</span>
              <div className="flex gap-0.5 mt-0.5">
                {hasEvents && <span className={cn("w-1 h-1 rounded-full shrink-0", isSelected ? "bg-primary-foreground" : "bg-amber-500")} />}
                {isLibur && <span className={cn("w-1 h-1 rounded-full shrink-0", isSelected ? "bg-primary-foreground" : "bg-red-500")} />}
              </div>
            </button>
          );
        })}
      </div>

      {(selectedLibur || todayLibur) && (
        <div className="mt-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">🔴 {selectedLibur || todayLibur}</p>
          <p className="text-[10px] text-red-500 dark:text-red-400/80 mt-0.5">{T("Libur Nasional")}</p>
        </div>
      )}

      <div className="mt-5 mb-24">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">
            {selectedDate
              ? `${selectedDate}`
              : todayEvents.length > 0
                ? `${T("Hari ini")} — ${todayStr}`
                : `${T("Agenda")} — ${todayStr}`}
          </h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl">
                <Plus className="h-4 w-4 mr-1" /> {T("Tambah")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{T("Tambah agenda")}</DialogTitle></DialogHeader>
              <AddEventForm
                initialDate={selectedDate || todayStr}
                onSubmit={(v) => addEvent.mutate(v)}
                busy={addEvent.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {todayEvents.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">
            {T("Tidak ada agenda di tanggal ini")}
          </p>
        ) : (
          <div className="space-y-2 max-h-[calc(100dvh-28rem)] overflow-y-auto pr-1">
            {todayEvents.map((ev: any) => {
              const d = new Date(ev.event_date);
              const diff = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={ev.id} className="flex items-start gap-3 bg-card border border-border rounded-xl p-3 shadow-soft">
                  <div className="w-12 shrink-0 text-center pt-0.5">
                    <p className="text-2xl font-extrabold leading-none">{d.getDate()}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{monthNames[d.getMonth()].slice(0, 3)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{ev.title}</p>
                    {ev.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.notes}</p>
                    )}
                    <p className="text-lg font-bold leading-none">
                      {diff === 0 ? T("Hari ini") : diff === 1 ? T("Besok") : diff}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() => delEvent.mutate(ev.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </MainLayout>
  );
}

function AddEventForm({
  initialDate,
  onSubmit,
  busy,
}: {
  initialDate: string;
  onSubmit: (v: any) => void;
  busy: boolean;
}) {
  const { T } = useLang();
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [eventDate, setDate] = useState(initialDate);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, notes: description, event_date: eventDate });
      }}
      className="space-y-3"
    >
      <div>
        <Label>{T("Judul")}</Label>
        <Input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={T("Misal: Arisan RT")}
        />
      </div>
      <div>
        <Label>{T("Catatan")}</Label>
        <Input value={description} onChange={(e) => setDesc(e.target.value)} placeholder={T("Catatan (opsional)")} />
      </div>
      <div>
        <Label>{T("Tanggal")}</Label>
        <Input type="date" value={eventDate} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy || !title.trim()}>
        {T("Simpan agenda")}
      </Button>
    </form>
  );
}