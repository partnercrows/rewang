# Rewang — Expansion Plan

Skala besar. Saya pecah jadi beberapa migrasi DB + refactor tiap halaman. Saya ringkas inti yang akan dibangun supaya jelas sebelum dieksekusi.

## 1. Database changes (1 migrasi gabungan)

Tabel baru (semua punya `family_id`, `deleted_at`, RLS `family_id = current_family_id()`, GRANT authenticated/service_role):

- **wishlist_items** — item_name, estimated_price, priority (low/med/high), notes, purchased_at
- **agenda_events** — title, event_date, event_type (ulang_tahun/kajian/janji/sekolah/pengingat), notes
- **quick_notes** — content, is_pinned, created_by
- **emergency_contacts** — name, phone, category, notes
- **household_documents** — title, category (KK/BPJS/STNK/tagihan/sertifikat), drive_url, notes
- **bill_payments** — bill_id, paid_at, amount (untuk recurring history)

Alter tabel existing:
- `shopping_items`: tambah `unit` (kg/liter/pcs/botol/tabung), `quantity_decimal` numeric (ganti current_stock jadi numeric), `last_updated_by` uuid, `is_wishlist` boolean (atau pisah tabel — pakai tabel terpisah)
- `bills`: tambah `bill_type` (listrik/internet/air/sekolah/pajak/subscription/lainnya), `notes`, `reminder_days` int, `paid_at` timestamp
- `debts_credits`: tambah `paid_amount` numeric (computed dari installment_logs sebenarnya)
- `profiles`: tambah `role` (admin/anggota) — default admin untuk pembuat keluarga
- Kategori belanja CRUD → tabel `shopping_categories` (family_id, name, color)

Functions: trigger update stock status (aman/menipis/habis) saat quantity berubah.

## 2. Pages

### `/app` (Home) — rebuild
- Header: nama + avatar + sapaan waktu (Selamat pagi/siang/sore/malam)
- Summary cards (2x2): stok menipis, tagihan belum bayar, total hutang, total piutang — clickable
- Upcoming bill card: nama, nominal, due, countdown, recurring badge, tombol "Lunasi" + "Detail"
- Family Agenda: 3 agenda terdekat dengan countdown
- Quick Notes: list catatan, pin/hapus, tambah inline
- Highlights: badge otomatis ("Semua tagihan lunas bulan ini", "Tidak ada stok habis minggu ini")
- FAB quick-add: bottom sheet dengan 5 opsi (stok/tagihan/agenda/tugas/catatan)

### `/app/belanja` — tabs Stok + Wishlist
- Stok: tabs kategori (CRUD kategori), search, filter status, item dengan unit + decimal quantity, +/- quantity, edit modal, last updated info
- Wishlist: list dengan harga estimasi, prioritas badge, action "beli" → pindah ke stok, hapus

### `/app/keuangan` — tabs Tagihan + Hutang/Piutang
- Tagihan: filter (semua/belum/jatuh tempo/lunas), badge status, countdown, recurring auto-renewal saat ditandai lunas, edit/delete, tombol export PDF (jsPDF) bulanan
- Hutang/Piutang: card dengan progress bar % lunas, tombol "Tambah cicilan", history cicilan, WhatsApp shortcut (wa.me), kontak

### `/app/feed`
- Filter chips: kategori + member + range tanggal
- Activity sentence ringkas dengan icon kategori
- Realtime sudah ada, tambah pagination/infinite scroll (limit 50, load more)

### `/app/akun` — rebuild
- Profile section: avatar upload (Supabase Storage bucket `avatars`), edit nama/phone
- Family: invite code besar (copy), member list dengan role badge, role change (admin only), remove member
- Emergency contacts: CRUD list dengan tombol call & WhatsApp
- Documents: list per kategori dengan link Drive, tambah link
- Wishlist shortcut card
- Settings: logout, info reminder

## 3. Komponen baru
`QuickAddSheet`, `AgendaList`, `QuickNotesCard`, `HighlightsCard`, `WishlistTab`, `BillCard`, `DebtCard`, `EmergencyContactCard`, `DocumentCard`, `RoleBadge`.

## 4. Storage
Bucket `avatars` (public) untuk upload foto profil.

## 5. Out of scope (akan saya catat tapi tidak dibangun di iterasi ini)
- Google Drive OAuth integration penuh — pakai link manual dulu
- Notifikasi push — UI settings saja
- Export PDF lanjutan (yearly/custom range) — bulanan dulu
- Email reminder otomatis

## Urutan eksekusi
1. Migrasi DB (1 call) — tunggu approval
2. Setelah approve: storage bucket avatars + types regen otomatis
3. Build halaman secara paralel (Home, Belanja, Keuangan, Feed, Akun) + komponen baru
4. Smoke test build

Konfirmasi untuk lanjut dengan migrasi DB?
