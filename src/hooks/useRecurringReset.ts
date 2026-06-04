import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function addYears(date: Date, n: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + n);
  return d;
}

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
        qc.invalidateQueries({ queryKey: ["tasks", familyId] });
        // Also optimistic-update: immediately mark as un-done in any cached data
        for (const queryKey of [["daily-tasks", familyId], ["daily-tasks-all", familyId], ["tasks", familyId]]) {
          qc.setQueryData(queryKey, (old: any) => {
            if (!Array.isArray(old)) return old;
            return old.map((t: any) => {
              if (toReset.some((r: any) => r.id === t.id)) {
                return { ...t, is_done: false, done_at: null };
              }
              return t;
            });
          });
        }
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

/**
 * Auto-reset recurring bills when their due date has passed.
 * For paid recurring bills whose due_date (plus interval) is in the past,
 * resets is_paid=false and advances the due_date to the next period.
 */
export function useRecurringBillReset(familyId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!familyId) return;

    const resetRecurringBills = async () => {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      try {
        const { data, error } = await supabase
          .from("bills")
          .select("id,bill_name,due_date,is_paid,recurrence_interval,paid_at")
          .eq("family_id", familyId)
          .eq("is_recurring", true)
          .is("deleted_at", null);

        if (error || !data) return;

        const toReset: any[] = [];

        for (const bill of data) {
          // Only reset unpaid bills whose due date has passed (they were presumably paid before but need resetting)
          // Or paid bills whose next due date is already in the past
          const dueDate = new Date(bill.due_date);
          const interval = bill.recurrence_interval || "monthly";

          if (bill.is_paid) {
            // Paid: advance due_date until it's in the future
            let nextDue = new Date(dueDate);
            const maxIter = 24; // safety limit
            let iter = 0;
            while (nextDue <= now && iter < maxIter) {
              if (interval === "yearly") {
                nextDue = addYears(nextDue, 1);
              } else {
                nextDue = addMonths(nextDue, 1);
              }
              iter++;
            }
            if (iter > 0) {
              toReset.push({ ...bill, next_due_date: nextDue.toISOString().slice(0, 10) });
            }
          } else {
            // Unpaid & overdue: also advance the due_date to the next period
            // But only if the bill was already paid before (has paid_at) — for truly new bills we don't touch
            if (dueDate < now && bill.paid_at) {
              let nextDue = new Date(dueDate);
              const maxIter = 24;
              let iter = 0;
              while (nextDue <= now && iter < maxIter) {
                if (interval === "yearly") {
                  nextDue = addYears(nextDue, 1);
                } else {
                  nextDue = addMonths(nextDue, 1);
                }
                iter++;
              }
              if (iter > 0) {
                toReset.push({ ...bill, next_due_date: nextDue.toISOString().slice(0, 10) });
              }
            }
          }
        }

        if (toReset.length === 0) return;

        await Promise.all(
          toReset.map((b: any) =>
            supabase
              .from("bills")
              .update({
                is_paid: false,
                paid_at: null,
                due_date: b.next_due_date,
              })
              .eq("id", b.id)
          )
        );

        qc.invalidateQueries({ queryKey: ["bills", familyId] });
        qc.invalidateQueries({ queryKey: ["beranda-stats", familyId] });
        qc.invalidateQueries({ queryKey: ["next-bill", familyId] });
      } catch {
        // Silently ignore
      }
    };

    resetRecurringBills();
    const interval = setInterval(resetRecurringBills, 60_000);
    return () => clearInterval(interval);
  }, [familyId, qc]);
}
