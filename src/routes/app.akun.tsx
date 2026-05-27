import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, LogOut, User as UserIcon, Users } from "lucide-react";
import { initials } from "@/lib/utils";

export const Route = createFileRoute("/app/akun")({
  head: () => ({ meta: [{ title: "Akun — Rumahku" }] }),
  component: AkunPage,
});

function AkunPage() {
  const { profile, family, signOut, refresh } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone_number ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone_number: phone }).eq("id", profile!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success("Profil tersimpan");
  };

  const copyCode = () => {
    if (!family) return;
    navigator.clipboard.writeText(family.invite_code);
    toast.success("Kode disalin!");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <MainLayout title="Akun">
      <div className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground rounded-2xl p-5 mb-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xl font-bold backdrop-blur">
            {initials(profile?.full_name)}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate">{profile?.full_name}</h2>
            <p className="text-xs opacity-90 truncate">{profile?.email}</p>
          </div>
        </div>
      </div>

      <section className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Keluarga</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{family?.family_name}</p>
        <Label className="text-xs">Kode undangan</Label>
        <div className="flex gap-2 mt-1">
          <Input readOnly value={family?.invite_code ?? ""} className="font-mono tracking-widest text-center font-bold" />
          <Button variant="outline" onClick={copyCode}><Copy className="h-4 w-4" /></Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Bagikan kode ini ke anggota keluarga untuk bergabung.</p>
      </section>

      <section className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <UserIcon className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Profil</h3>
        </div>
        <div className="space-y-3">
          <div><Label>Nama lengkap</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>No. Telepon</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <Button onClick={save} disabled={busy} className="w-full">Simpan</Button>
        </div>
      </section>

      <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleSignOut}>
        <LogOut className="h-4 w-4 mr-2" /> Keluar
      </Button>
    </MainLayout>
  );
}
