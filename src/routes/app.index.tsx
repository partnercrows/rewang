import { createFileRoute, Link } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah, daysUntil, initials } from "@/lib/utils";
import { ShoppingBasket, Wallet, ReceiptText, AlertTriangle, TrendingDown, Calendar } from "lucide-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Beranda — Rumahku" }] }),
  component: BerandaPage,
});

function BerandaPage() {
  const { profile, family } = useAuth();
  const familyId = family?.id;

  const { data: stats } = useQuery({
    queryKey: ["beranda-stats", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const [items, bills, debts] = await Promise.all([
        supabase.from("shopping_items").select("status").eq("family_id", familyId!).is("deleted_at", null),
        supabase.from("bills").select("nominal,due_date,is_paid").eq("family_id", familyId!).is("deleted_at", null).eq("is_paid", false),
        supabase.from("debts_credits").select("type,total_amount").eq("family_id", familyId!).is("deleted_at", null),
      ]);
      const lowStock = (items.data ?? []).filter((i) => i.status !== "Aman").length;
      const upcomingBills = (bills.data ?? []).filter((b) => daysUntil(b.due_date) <= 30);
      const totalDue = upcomingBills.reduce((s, b) => s + Number(b.nominal), 0);
      const hutang = (debts.data ?? []).filter((d) => d.type === "hutang").reduce((s, d) => s + Number(d.total_amount), 0);
      const piutang = (debts.data ?? []).filter((d) => d.type === "piutang").reduce((s, d) => s + Number(d.total_amount), 0);
      return { lowStock, totalDue, upcomingBills: upcomingBills.length, hutang, piutang };
    },
  });

  const { data: nextBill } = useQuery({
    queryKey: ["next-bill", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("bills")
        .select("id,bill_name,nominal,due_date")
        .eq("family_id", familyId!)
        .is("deleted_at", null)
        .eq("is_paid", false)
        .order("due_date", { ascending: true })
        .limit(1);
      return data?.[0] ?? null;
    },
  });

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-muted-foreground">Halo,</p>
          <h1 className="text-2xl font-bold tracking-tight">{profile?.full_name?.split(" ")[0]} 👋</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{family?.family_name}</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
          {initials(profile?.full_name)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Link to="/app/belanja" className="bg-card border border-border rounded-2xl p-4 shadow-soft hover:shadow-card transition">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBasket className="h-5 w-5 text-primary" />
            {stats?.lowStock ? (
              <span className="text-[10px] bg-warning/20 text-warning-foreground px-2 py-0.5 rounded-full font-medium">{stats.lowStock} perlu</span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">Stok</p>
          <p className="text-lg font-bold">{stats?.lowStock ?? 0} item menipis</p>
        </Link>
        <Link to="/app/keuangan" className="bg-card border border-border rounded-2xl p-4 shadow-soft hover:shadow-card transition">
          <div className="flex items-center justify-between mb-2">
            <ReceiptText className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">Tagihan bulan ini</p>
          <p className="text-lg font-bold">{formatRupiah(stats?.totalDue ?? 0)}</p>
        </Link>
        <Link to="/app/keuangan" className="bg-card border border-border rounded-2xl p-4 shadow-soft hover:shadow-card transition">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-xs text-muted-foreground">Total hutang</p>
          <p className="text-lg font-bold">{formatRupiah(stats?.hutang ?? 0)}</p>
        </Link>
        <Link to="/app/keuangan" className="bg-card border border-border rounded-2xl p-4 shadow-soft hover:shadow-card transition">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="h-5 w-5 text-success" />
          </div>
          <p className="text-xs text-muted-foreground">Total piutang</p>
          <p className="text-lg font-bold">{formatRupiah(stats?.piutang ?? 0)}</p>
        </Link>
      </div>

      {nextBill && (
        <div className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground rounded-2xl p-4 mb-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4" />
            <p className="text-xs uppercase tracking-wide opacity-90">Tagihan terdekat</p>
          </div>
          <h3 className="text-lg font-bold">{nextBill.bill_name}</h3>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold">{formatRupiah(nextBill.nominal)}</span>
            <span className="text-sm font-medium">{daysUntil(nextBill.due_date)} hari lagi</span>
          </div>
        </div>
      )}

      {stats && stats.lowStock > 0 && (
        <div className="bg-warning/15 border border-warning/30 rounded-xl p-3 mb-5 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Beberapa stok perlu diisi ulang</p>
            <Link to="/app/belanja" className="text-xs text-primary font-medium hover:underline">Lihat daftar belanja →</Link>
          </div>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold">Papan tugas</h2>
        <span className="text-xs text-muted-foreground">Geser horizontal</span>
      </div>
      <KanbanBoard familyId={familyId!} />
    </MainLayout>
  );
}
