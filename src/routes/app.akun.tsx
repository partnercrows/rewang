import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Copy, LogOut, User as UserIcon, Users, Phone, MessageCircle, FileText,
  Plus, Trash2, ExternalLink, Camera, Heart, Settings as Cog, ShieldCheck, Crown,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";

export const Route = createFileRoute("/app/akun")({
  head: () => ({ meta: [{ title: "Akun — Rewang" }] }),
  component: AkunPage,
});

function AkunPage() {
  const { profile, family, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => { await signOut(); navigate({ to: "/login" }); };

  return (
    <MainLayout title="Akun">
      <ProfileSection />

      <FamilySection />

      <EmergencyContactsSection familyId={family?.id} />

      <DocumentsSection familyId={family?.id} />

      <WishlistShortcut familyId={family?.id} />

      <SettingsSection onSignOut={handleSignOut} />

      <div className="h-20" />
    </MainLayout>
  );
}

/* ============== PROFILE ============== */

function ProfileSection() {
  const { profile, refresh, session } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone_number ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone_number: phone }).eq("id", profile!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success("Profil tersimpan");
  };

  const uploadAvatar = async (file: File) => {
    if (!session?.user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", session.user.id);
      if (dbErr) throw dbErr;
      await refresh();
      toast.success("Avatar diperbarui");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground rounded-3xl p-5 mb-4 shadow-card">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-primary-foreground/20 flex items-center justify-center text-2xl font-bold backdrop-blur overflow-hidden">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(profile?.full_name)}
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-card text-foreground border-2 border-primary flex items-center justify-center shadow-md">
            <Camera className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold truncate">{profile?.full_name}</h2>
          <p className="text-xs opacity-90 truncate">{profile?.email}</p>
          {profile?.role && <span className="inline-flex items-center gap-1 text-[10px] mt-1 bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase">
            {profile.role === "admin" && <Crown className="h-3 w-3" />}{profile.role}
          </span>}
        </div>
      </div>
      <div className="space-y-2 bg-white/10 backdrop-blur rounded-2xl p-3">
        <div>
          <Label className="text-primary-foreground/80 text-xs">Nama lengkap</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white/95 text-foreground" />
        </div>
        <div>
          <Label className="text-primary-foreground/80 text-xs">No. Telepon</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white/95 text-foreground" />
        </div>
        <Button variant="secondary" onClick={save} disabled={busy} className="w-full">Simpan profil</Button>
      </div>
    </section>
  );
}

/* ============== FAMILY ============== */

function FamilySection() {
  const { family, profile } = useAuth();
  const qc = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ["family-members", family?.id],
    enabled: !!family?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles").select("id,full_name,email,avatar_url,role")
        .eq("family_id", family!.id).is("deleted_at", null);
      if (error) throw error;
      return data;
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["family-members"] }); toast.success("Role diperbarui"); },
  });

  const copyCode = () => {
    if (!family) return;
    navigator.clipboard.writeText(family.invite_code);
    toast.success("Kode disalin!");
  };

  const isAdmin = profile?.role === "admin";

  return (
    <section className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Keluarga</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{family?.family_name}</p>

      <div className="bg-gradient-to-br from-accent/40 to-secondary rounded-xl p-3 mb-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Kode undangan</p>
        <div className="flex items-center gap-2">
          <p className="font-mono text-2xl tracking-[0.3em] font-bold text-primary flex-1">{family?.invite_code ?? ""}</p>
          <Button size="icon" variant="outline" onClick={copyCode}><Copy className="h-4 w-4" /></Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">Bagikan ke anggota keluarga untuk bergabung</p>
      </div>

      <p className="text-xs font-semibold text-muted-foreground mb-2">Anggota ({members.length})</p>
      <div className="space-y-2">
        {members.map((m: any) => (
          <div key={m.id} className="flex items-center gap-3 bg-secondary/40 rounded-xl p-2.5">
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
              {m.avatar_url ? <img src={m.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(m.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.full_name}{m.id === profile?.id && " (kamu)"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
            </div>
            {isAdmin && m.id !== profile?.id ? (
              <Select value={m.role ?? "anggota"} onValueChange={(v) => updateRole.mutate({ id: m.id, role: v })}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="anggota">Anggota</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-full inline-flex items-center gap-1",
                m.role === "admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                {m.role === "admin" && <Crown className="h-2.5 w-2.5" />}{m.role ?? "anggota"}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============== EMERGENCY CONTACTS ============== */

const CONTACT_CATEGORIES = ["polisi", "pemadam", "rumah_sakit", "wifi", "saudara", "lainnya"];

function EmergencyContactsSection({ familyId }: { familyId?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: contacts = [] } = useQuery({
    queryKey: ["emergency_contacts", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts").select("*").eq("family_id", familyId!).is("deleted_at", null)
        .order("category");
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("emergency_contacts").insert({ ...v, family_id: familyId! });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["emergency_contacts", familyId] }); toast.success("Kontak ditambahkan"); setOpen(false); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("emergency_contacts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency_contacts", familyId] }),
  });

  return (
    <section className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><h3 className="font-semibold">Kontak darurat</h3></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Tambah</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Kontak darurat baru</DialogTitle></DialogHeader>
            <ContactForm onSubmit={(v) => add.mutate(v)} busy={add.isPending} />
          </DialogContent>
        </Dialog>
      </div>
      {contacts.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Belum ada kontak</p>}
      <div className="space-y-2">
        {contacts.map((c: any) => (
          <div key={c.id} className="border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{c.name}</p>
              <p className="text-[11px] text-muted-foreground capitalize">{String(c.category).replace("_", " ")} · {c.phone}</p>
              {c.notes && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{c.notes}</p>}
            </div>
            <Button asChild size="icon" variant="outline" className="h-8 w-8"><a href={`tel:${c.phone}`}><Phone className="h-4 w-4" /></a></Button>
            <Button asChild size="icon" variant="outline" className="h-8 w-8"><a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /></a></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => del.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("lainnya");
  const [notes, setNotes] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, phone, category, notes }); }} className="space-y-3">
      <div><Label>Nama</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><Label>Telepon</Label><Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="62812..." /></div>
      <div>
        <Label>Kategori</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CONTACT_CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Catatan (opsional)</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={busy}>Simpan</Button>
    </form>
  );
}

/* ============== DOCUMENTS ============== */

const DOC_CATEGORIES = ["KK", "BPJS", "STNK", "tagihan", "sertifikat", "lainnya"];

function DocumentsSection({ familyId }: { familyId?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("household_documents").select("*").eq("family_id", familyId!).is("deleted_at", null)
        .order("category");
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async (v: any) => {
      const { error } = await supabase.from("household_documents").insert({ ...v, family_id: familyId! });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", familyId] }); toast.success("Dokumen ditambahkan"); setOpen(false); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("household_documents").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", familyId] }),
  });

  const grouped = docs.reduce<Record<string, any[]>>((acc, d: any) => {
    (acc[d.category] ??= []).push(d); return acc;
  }, {});

  return (
    <section className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><h3 className="font-semibold">Dokumen rumah</h3></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Tambah</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah dokumen</DialogTitle></DialogHeader>
            <DocForm onSubmit={(v) => add.mutate(v)} busy={add.isPending} />
          </DialogContent>
        </Dialog>
      </div>
      {docs.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Belum ada dokumen. Tempel link Google Drive untuk arsip cepat.</p>}
      <div className="space-y-3">
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">{cat}</p>
            <div className="space-y-1.5">
              {list.map((d: any) => (
                <div key={d.id} className="border border-border rounded-xl p-3 flex items-center gap-3">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    {d.notes && <p className="text-[11px] text-muted-foreground truncate">{d.notes}</p>}
                  </div>
                  {d.drive_url && (
                    <Button asChild size="icon" variant="outline" className="h-8 w-8">
                      <a href={d.drive_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => del.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DocForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("lainnya");
  const [drive_url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, category, drive_url, notes }); }} className="space-y-3">
      <div><Label>Judul</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div>
        <Label>Kategori</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{DOC_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Link Google Drive</Label><Input value={drive_url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/..." /></div>
      <div><Label>Catatan (opsional)</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={busy}>Simpan</Button>
    </form>
  );
}

/* ============== WISHLIST SHORTCUT ============== */

function WishlistShortcut({ familyId }: { familyId?: string }) {
  const { data: count = 0 } = useQuery({
    queryKey: ["wishlist-count", familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { count: c } = await supabase.from("wishlist_items").select("*", { count: "exact", head: true })
        .eq("family_id", familyId!).is("deleted_at", null).is("purchased_at", null);
      return c ?? 0;
    },
  });

  return (
    <Link to="/app/belanja" className="block bg-gradient-to-br from-accent to-secondary rounded-2xl p-4 mb-4 shadow-soft active:scale-[0.99] transition">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-card flex items-center justify-center shadow-soft">
          <Heart className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Wishlist</p>
          <p className="text-xs text-muted-foreground">{count} item menunggu dibeli</p>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

/* ============== SETTINGS ============== */

function SettingsSection({ onSignOut }: { onSignOut: () => void }) {
  const [reminder, setReminder] = useState(true);
  const [notif, setNotif] = useState(true);

  return (
    <section className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-soft">
      <div className="flex items-center gap-2 mb-3">
        <Cog className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Pengaturan</h3>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40">
          <div>
            <p className="text-sm font-medium">Pengingat tagihan</p>
            <p className="text-[11px] text-muted-foreground">Tampilkan tagihan jatuh tempo</p>
          </div>
          <Switch checked={reminder} onCheckedChange={setReminder} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40">
          <div>
            <p className="text-sm font-medium">Notifikasi aktivitas</p>
            <p className="text-[11px] text-muted-foreground">Update keluarga di feed</p>
          </div>
          <Switch checked={notif} onCheckedChange={setNotif} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <p className="text-sm font-medium">Keamanan akun</p>
          </div>
          <span className="text-[11px] text-muted-foreground">Aktif</span>
        </div>
      </div>
      <Button variant="outline" className="w-full text-destructive hover:text-destructive mt-3" onClick={onSignOut}>
        <LogOut className="h-4 w-4 mr-2" /> Keluar
      </Button>
    </section>
  );
}
