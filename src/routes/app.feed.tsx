import { createFileRoute } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { initials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export const Route = createFileRoute("/app/feed")({
  head: () => ({ meta: [{ title: "Feed — Rumahku" }] }),
  component: FeedPage,
});

function FeedPage() {
  const { family } = useAuth();
  const familyId = family?.id;
  const qc = useQueryClient();

  const { data: feed = [] } = useQuery({
    queryKey: ["feed", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_feed")
        .select("*")
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!familyId) return;
    const ch = supabase
      .channel(`feed-${familyId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_feed", filter: `family_id=eq.${familyId}` }, () => {
        qc.invalidateQueries({ queryKey: ["feed", familyId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [familyId, qc]);

  return (
    <MainLayout title="Aktivitas Keluarga">
      <div className="space-y-2">
        {feed.length === 0 && (
          <p className="text-center py-12 text-muted-foreground text-sm">Belum ada aktivitas. Mulai tambah data!</p>
        )}
        {feed.map((f) => (
          <div key={f.id} className="bg-card border border-border rounded-xl p-3 flex gap-3 shadow-soft">
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
              {initials(f.actor_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{f.actor_name ?? "Seseorang"}</span>{" "}
                <span className="text-muted-foreground">{f.description}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(f.created_at), { addSuffix: true, locale: idLocale })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
