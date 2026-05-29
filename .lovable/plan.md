# Lanjutan: Beranda, Akun, Keuangan

## 1. Beranda (`src/routes/app.index.tsx`) — refine UI
Layout sesuai spek:
- **Header greeting** (sudah ada) — pertahankan, sapaan + avatar
- **4 summary cards** grid 2x2: stok menipis 📦, tagihan belum bayar 💳, hutang aktif 💸, piutang 🪙. Soft background per kategori (primary/15, warning/15, destructive/10, success/15), rounded-2xl, ikon kecil + judul + angka tebal. Tappable → navigate ke modul terkait
- **Highlight card "Tagihan Terdekat"** — gradient hijau (primary → primary-glow), nama tagihan kiri + nominal + countdown kanan, tombol Lunasi & Detail
- **Agenda Bulan Ini** — list ringkas dengan ikon kiri (per event_type) + countdown kanan, tombol "Lihat Kalender" (link ke `/app/akun` agenda section atau modal)
- **Catatan Rumah** — sticky notes warna warm (bg-accent/secondary), pin/hapus inline, max 4
- **Pencapaian Rumah** — pills otomatis: "Semua tagihan bulan ini lunas" jika tidak ada unpaid bulan ini, "Tidak ada stok habis minggu ini" jika count habis = 0. Subtle outline pills
- **FAB Tambah Cepat** (sudah ada `QuickAddSheet`) — tetap

Hapus KanbanBoard dari home (pindah ke quick add menu saja). Tambahkan link "Lihat Kalender" → arahkan ke section agenda di Akun atau tampilkan modal list semua agenda bulan ini.

## 2. Keuangan (`src/routes/app.keuangan.tsx`) — rebuild
Tabs: **Tagihan** | **Hutang/Piutang**

**Tab Tagihan:**
- Filter chips: Semua / Belum Bayar / Jatuh Tempo (≤7 hari & belum) / Lunas
- Card per bill: nama + bill_type badge (warna per jenis), nominal, countdown, recurring badge (🔄), status badge
- Aksi: Lunasi (insert `bill_payments` + update `is_paid`+`paid_at`; jika recurring → auto buat tagihan baru due_date + interval), Edit, Hapus
- Tombol "Export PDF Bulanan" → pakai `jspdf` + `jspdf-autotable`, daftar tagihan bulan berjalan
- Section "History Pembayaran" (collapsible): list `bill_payments` terbaru

**Tab Hutang/Piutang:**
- Toggle: Hutang / Piutang
- Card: nama orang, total, paid (sum installment_logs), progress bar, sisa, tombol "Tambah Cicilan", "WhatsApp" (wa.me/phone), expand history cicilan
- Form tambah hutang/piutang (sheet)

Komponen baru: `BillCard`, `DebtCard`, `BillTypeBadge`, `InstallmentSheet`.
Dependencies tambahan: `jspdf`, `jspdf-autotable`.

## 3. Akun (`src/routes/app.akun.tsx`) — rebuild
Sections (accordion / stacked cards):
- **Profile**: avatar (upload ke bucket `avatars`, path `${user.id}/avatar.png`), nama, telepon
- **Keluarga**: invite code besar + copy, list member (`profiles` where family_id) dengan RoleBadge (admin/anggota), admin bisa ubah role member lain
- **Kontak Darurat** (`emergency_contacts` CRUD): nama, phone, kategori (polisi/pemadam/wifi/rs/saudara/lainnya), notes. Aksi: Call (tel:), WhatsApp (wa.me)
- **Dokumen Rumah** (`household_documents` CRUD): title, kategori (KK/BPJS/STNK/tagihan/sertifikat/lainnya), drive_url (paste link Google Drive), notes. Group by kategori, klik buka link
- **Wishlist Shortcut**: card mini → total wishlist + tombol ke `/app/belanja?tab=wishlist`
- **Pengaturan**: logout, info reminder (placeholder switch)

Komponen baru: `EmergencyContactCard`, `DocumentCard`, `RoleBadge`, `AvatarUploader`.

## Urutan eksekusi
1. `bun add jspdf jspdf-autotable`
2. Rebuild `app.index.tsx` (Beranda baru)
3. Rebuild `app.keuangan.tsx` + komponen Bill/Debt
4. Rebuild `app.akun.tsx` + komponen Akun
5. Smoke test build

Tidak ada perubahan database — semua tabel sudah tersedia dari migrasi sebelumnya.

Lanjut eksekusi?
