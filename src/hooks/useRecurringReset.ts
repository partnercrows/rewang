import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Auto-reset recurring tasks when a new day arrives.
 * Finds recurring tasks where is_done=true and done_at is not today,
 * then resets them to is_done=false, done_at=null.
 */
export function useRecurringReset(familyId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!familyId) return;

    const resetRecurringTasks = async () => {
      const todayStr = new Date().toISOString().slice(0, 10);

      try {
        // Fetch recurring tasks that are marked done on a previous day
        const { data, error } = await (supabase as any)
          .from("daily_tasks")
          .select("id,done_at")
          .eq("family_id", familyId)
          .eq("is_recurring", true)
          .eq("is_done", true)
          .is("deleted_at", null);

        if (error) return;

        const toReset = (data ?? []).filter((t: any) => {
          if (!t.done_at) return false;
          return t.done_at.slice(0, 10) !== todayStr;
        });

        if (toReset.length === 0) return;

        // Reset all in parallel
        await Promise.all(
          toReset.map((t: any) =>
            (supabase as any)
              .from("daily_tasks")
              .update({ is_done: false, done_at: null })
              .eq("id", t.id)
          )
        );

        // Invalidate queries so UI refreshes
        qc.invalidateQueries({ queryKey: ["daily-tasks", familyId] });
        qc.invalidateQueries({ queryKey: ["daily-tasks-all", familyId] });
      } catch {
        // Silently ignore
      }
    };

    // Run on mount
    resetRecurringTasks();

    // Also run every 60 seconds (in case app is left open overnight)
    const interval = setInterval(resetRecurringTasks, 60_000);
    return () => clearInterval(interval);
  }, [familyId, qc]);
}