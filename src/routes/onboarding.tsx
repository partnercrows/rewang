import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, type Family } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateInviteCode } from "@/lib/utils";
import { toast } from "sonner";
import { Home, Loader2, Users, Plus, LogOut } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Mulai — Rumahku" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { session, profile, loading, refresh, setFamilyDirect, signOut } = useAuth();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" search={{}} replace />;
  if (profile?.family_id) return <Navigate to="/app" search={{}} replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const invite_code = generateInviteCode();
    const { data: newFamily, error } = await supabase.rpc("create_family", {
      _family_name: familyName,
      _invite_code: invite_code,
    });
    if (error) {
      setBusy(false);
      return toast.error(error.message ?? "Gagal membuat keluarga");
    }
    const famData = newFamily as Family | null;
    if (famData?.id) {
      // Directly update state with the returned family data instead of polling DB
      setFamilyDirect(famData);
      toast.success(`Keluarga "${familyName}" dibuat!`);
      navigate({ to: "/app", search: {} });
    } else {
      // Fallback: try polling refresh (shouldn't normally reach here)
      await new Promise((r) => setTimeout(r, 500));
      let updatedProfile: Awaited<ReturnType<typeof refresh>> = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        updatedProfile = await refresh();
        if (updatedProfile?.family_id) break;
        await new Promise((r) => setTimeout(r, 300));
      }
      if (updatedProfile?.family_id) {
        toast.success(`Keluarga "${familyName}" dibuat!`);
        navigate({ to: "/app", search: {} });
      } else {
        setBusy(false);
        toast.error("Gagal memuat data keluarga, coba refresh halaman.");
      }
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const code = inviteCode.trim().toUpperCase();
    const { error } = await supabase.rpc("join_family_by_code", {
      _invite_code: code,
    });
    if (error) {
      setBusy(false);
      return toast.error(error.message?.includes("not found") ? "Kode undangan tidak ditemukan" : error.message);
    }
    // Small delay to let the DB trigger fully propagate before refresh
    await new Promise((r) => setTimeout(r, 500));
    let updatedProfile: Awaited<ReturnType<typeof refresh>> = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      updatedProfile = await refresh();
      if (updatedProfile?.family_id) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    if (updatedProfile?.family_id) {
      toast.success("Bergabung ke keluarga!");
      navigate({ to: "/app", search: {} });
    } else {
      setBusy(false);
      toast.error("Gagal memuat data keluarga, coba refresh halaman.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/40 to-accent/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft mb-3">
            <Home className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Halo, {profile?.full_name?.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground mt-1 text-sm">Mulai dengan membuat atau bergabung ke keluarga.</p>
        </div>

        {mode === "choose" && (
          <>
            <div className="grid gap-3">
              <button
                onClick={() => setMode("create")}
                className="bg-card border border-border rounded-2xl p-5 text-left shadow-soft hover:shadow-card transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Buat keluarga baru</h3>
                    <p className="text-sm text-muted-foreground">Mulai grup rumah tangga Anda</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setMode("join")}
                className="bg-card border border-border rounded-2xl p-5 text-left shadow-soft hover:shadow-card transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Gabung dengan kode</h3>
                    <p className="text-sm text-muted-foreground">Masuk ke keluarga yang sudah ada</p>
                  </div>
                </div>
              </button>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-5 text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" /> Keluar
            </Button>
          </>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-3">
            <Label htmlFor="fname">Nama keluarga</Label>
            <Input id="fname" required value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Keluarga Wijaya" />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setMode("choose")}>Batal</Button>
              <Button type="submit" className="flex-1" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Buat
              </Button>
            </div>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-3">
            <Label htmlFor="code">Kode undangan</Label>
            <Input
              id="code"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="text-center text-lg tracking-widest font-mono"
              maxLength={10}
            />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setMode("choose")}>Batal</Button>
              <Button type="submit" className="flex-1" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Gabung
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}