import { createContext, useContext, useState, type ReactNode } from "react";

type Lang = "id" | "en";

type Translations = Record<string, Record<Lang, string>>;

const t: Translations = {
  // --- Settings ---
  "Pengaturan": { id: "Pengaturan", en: "Settings" },
  "Mode gelap": { id: "Mode gelap", en: "Dark mode" },
  "Mode terang": { id: "Mode terang", en: "Light mode" },
  "Bahasa": { id: "Bahasa", en: "Language" },
  "Indonesia": { id: "Indonesia", en: "Indonesian" },
  "English": { id: "English", en: "English" },
  "Ubah kata sandi": { id: "Ubah kata sandi", en: "Change password" },
  "Kata sandi saat ini": { id: "Kata sandi saat ini", en: "Current password" },
  "Kata sandi baru": { id: "Kata sandi baru", en: "New password" },
  "Konfirmasi kata sandi baru": { id: "Konfirmasi kata sandi baru", en: "Confirm new password" },
  "Batal": { id: "Batal", en: "Cancel" },
  "Simpan": { id: "Simpan", en: "Save" },
  "Kata sandi berhasil diubah": { id: "Kata sandi berhasil diubah", en: "Password changed successfully" },
  "Kata sandi baru tidak cocok": { id: "Kata sandi baru tidak cocok", en: "New passwords do not match" },
  "Minimal 6 karakter": { id: "Minimal 6 karakter", en: "Min 6 characters" },
  "Pengingat tagihan": { id: "Pengingat tagihan", en: "Bill reminders" },
  "Tampilkan tagihan jatuh tempo": { id: "Tampilkan tagihan jatuh tempo", en: "Show due bills" },
  "Notifikasi aktivitas": { id: "Notifikasi aktivitas", en: "Activity notifications" },
  "Update keluarga di feed": { id: "Update keluarga di feed", en: "Family updates in feed" },
  "Keamanan akun": { id: "Keamanan akun", en: "Account security" },
  "Aktif": { id: "Aktif", en: "Active" },
  "Keluar": { id: "Keluar", en: "Sign out" },

  // --- Navigation ---
  "Beranda": { id: "Beranda", en: "Home" },
  "Belanja": { id: "Belanja", en: "Shopping" },
  "Keuangan": { id: "Keuangan", en: "Finance" },
  "Feed": { id: "Feed", en: "Feed" },
  "Akun": { id: "Akun", en: "Account" },

  // --- Home ---
  "Selamat pagi": { id: "Selamat pagi", en: "Good morning" },
  "Selamat siang": { id: "Selamat siang", en: "Good afternoon" },
  "Selamat sore": { id: "Selamat sore", en: "Good evening" },
  "Selamat malam": { id: "Selamat malam", en: "Good night" },
  "Stok menipis": { id: "Stok menipis", en: "Low stock" },
  "item": { id: "item", en: "item" },
  "Belum bayar": { id: "Belum bayar", en: "Unpaid" },
  "tagihan": { id: "tagihan", en: "bills" },
  "Hutang aktif": { id: "Hutang aktif", en: "Active debt" },
  "Piutang": { id: "Piutang", en: "Receivable" },
  "Tidak ada tagihan menunggu": { id: "Tidak ada tagihan menunggu", en: "No pending bills" },
  "Agenda bulan ini": { id: "Agenda bulan ini", en: "This month's agenda" },
  "Catatan rumah": { id: "Catatan rumah", en: "House notes" },
  "Pencapaian rumah": { id: "Pencapaian rumah", en: "Home achievements" },
  "Belum ada agenda bulan ini": { id: "Belum ada agenda bulan ini", en: "No agenda this month" },
  "Hari ini": { id: "Hari ini", en: "Today" },
  "Besok": { id: "Besok", en: "Tomorrow" },
  "hari lagi": { id: "hari lagi", en: "days left" },
  "Lihat kalender": { id: "Lihat kalender", en: "View calendar" },
  "Tulis catatan singkat...": { id: "Tulis catatan singkat...", en: "Write a quick note..." },
  "Tambah": { id: "Tambah", en: "Add" },
  "Belum ada catatan": { id: "Belum ada catatan", en: "No notes yet" },
  "Belum ada pencapaian — terus rapikan rumah ya": { id: "Belum ada pencapaian — terus rapikan rumah ya", en: "No achievements yet — keep tidying up the home" },
  "Semua tagihan bulan ini lunas": { id: "Semua tagihan bulan ini lunas", en: "All bills paid this month" },
  "Tidak ada stok habis minggu ini": { id: "Tidak ada stok habis minggu ini", en: "No out-of-stock items this week" },
  "Tidak ada hutang aktif": { id: "Tidak ada hutang aktif", en: "No active debts" },

  // --- Home > Aktivitas Hari Ini ---
  "Aktivitas Hari Ini": { id: "Aktivitas Hari Ini", en: "Today's Tasks" },
  "Lihat Semua": { id: "Lihat Semua", en: "View All" },
  "Prioritas": { id: "Prioritas", en: "Priority" },
  "Selesai": { id: "Selesai", en: "Done" },
  "Belum ada tugas hari ini": { id: "Belum ada tugas hari ini", en: "No tasks for today" },
  "sedang": { id: "sedang", en: "medium" },
  "tinggi": { id: "tinggi", en: "high" },
  "rendah": { id: "rendah", en: "low" },
  "Tambah tugas": { id: "Tambah tugas", en: "Add task" },
  "Berulang": { id: "Berulang", en: "Recurring" },
  "Tidak berulang": { id: "Tidak berulang", en: "One-time" },
  "Semua tugas berulang kembali kosong setiap pagi.": { id: "Semua tugas berulang kembali kosong setiap pagi.", en: "All recurring tasks reset every morning." },
  "aktif baru saja": { id: "aktif baru saja", en: "active just now" },
  "aktif beberapa menit lalu": { id: "aktif beberapa menit lalu", en: "active a few minutes ago" },
  "aktif hari ini": { id: "aktif hari ini", en: "active today" },
  "aktif kemarin": { id: "aktif kemarin", en: "active yesterday" },
  "Kamu": { id: "Kamu", en: "You" },
  "Tugas berulang": { id: "Tugas berulang", en: "Recurring task" },
  "Ditugaskan ke": { id: "Ditugaskan ke", en: "Assigned to" },
  "Tanpa anggota": { id: "Tanpa anggota", en: "No member" },
  "Catatan tugas (opsional)": { id: "Catatan tugas (opsional)", en: "Task notes (optional)" },

  // --- Feed ---
  "Aktivitas Keluarga": { id: "Aktivitas Keluarga", en: "Family Activity" },
  "Semua aktivitas anggota keluarga": { id: "Semua aktivitas anggota keluarga", en: "All family member activities" },
  "Belum ada aktivitas": { id: "Belum ada aktivitas", en: "No activity yet" },
  "Belum ada aktivitas. Mulai tambah data!": { id: "Belum ada aktivitas. Mulai tambah data!", en: "No activity yet. Start adding data!" },
  "Semua anggota": { id: "Semua anggota", en: "All members" },
  "Dari": { id: "Dari", en: "From" },
  "Sampai": { id: "Sampai", en: "To" },
  "Hapus tanggal": { id: "Hapus tanggal", en: "Clear dates" },
  "menambah": { id: "menambah", en: "added" },
  "mengubah stok": { id: "mengubah stok", en: "updated stock" },
  "menghapus": { id: "menghapus", en: "removed" },
  "menambah agenda": { id: "menambah agenda", en: "added agenda" },
  "melunasi tagihan": { id: "melunasi tagihan", en: "paid bill" },
  "mencatat": { id: "mencatat", en: "recorded" },

  // --- Belanja ---
  "Stok": { id: "Stok", en: "Stock" },
  "Wishlist": { id: "Wishlist", en: "Wishlist" },
  "Cari item...": { id: "Cari item...", en: "Search items..." },
  "Semua": { id: "Semua", en: "All" },
  "Tidak ada item": { id: "Tidak ada item", en: "No items" },
  "min": { id: "min", en: "min" },
  "Diupdate oleh": { id: "Diupdate oleh", en: "Updated by" },
  "Habiskan": { id: "Habiskan", en: "Use up" },
  "Edit": { id: "Edit", en: "Edit" },
  "Habis": { id: "Habis", en: "Empty" },
  "Menipis": { id: "Menipis", en: "Low" },
  "Aman": { id: "Aman", en: "Safe" },
  "Tambah Stok": { id: "Tambah Stok", en: "Add Stock" },
  "Item baru": { id: "Item baru", en: "New item" },
  "Edit stok": { id: "Edit stok", en: "Edit stock" },
  "Nama item": { id: "Nama item", en: "Item name" },
  "Kategori": { id: "Kategori", en: "Category" },
  "Satuan": { id: "Satuan", en: "Unit" },
  "Jumlah": { id: "Jumlah", en: "Quantity" },
  "Stok minimum": { id: "Stok minimum", en: "Min stock" },
  "Tersimpan": { id: "Tersimpan", en: "Saved" },
  "Dihapus": { id: "Dihapus", en: "Deleted" },
  "Kelola kategori": { id: "Kelola kategori", en: "Manage categories" },
  "Nama kategori baru": { id: "Nama kategori baru", en: "New category name" },
  "bawaan": { id: "bawaan", en: "default" },
  "Kategori ditambah": { id: "Kategori ditambah", en: "Category added" },
  "Kategori bawaan tidak dapat dihapus.": { id: "Kategori bawaan tidak dapat dihapus.", en: "Default categories cannot be deleted." },
  "Belum ada wishlist": { id: "Belum ada wishlist", en: "No wishlist yet" },
  "Tambah Wishlist": { id: "Tambah Wishlist", en: "Add Wishlist" },
  "Item wishlist baru": { id: "Item wishlist baru", en: "New wishlist item" },
  "Harga estimasi": { id: "Harga estimasi", en: "Estimated price" },
  "Wishlist ditambah": { id: "Wishlist ditambah", en: "Wishlist added" },
  "Dipindahkan ke stok": { id: "Dipindahkan ke stok", en: "Moved to stock" },
  "Sudah dibeli → pindah ke stok": { id: "Sudah dibeli → pindah ke stok", en: "Purchased → move to stock" },

  // --- Keuangan ---
  "Tagihan": { id: "Tagihan", en: "Bills" },
  "Hutang/Piutang": { id: "Hutang/Piutang", en: "Debts/Credits" },
  "Belum": { id: "Belum", en: "Unpaid" },
  "Jatuh tempo": { id: "Jatuh tempo", en: "Due" },
  "Lunas": { id: "Lunas", en: "Paid" },
  "Tidak ada tagihan": { id: "Tidak ada tagihan", en: "No bills" },
  "Tagihan Baru": { id: "Tagihan Baru", en: "New Bill" },
  "Tagihan baru": { id: "Tagihan baru", en: "New bill" },
  "Nama tagihan": { id: "Nama tagihan", en: "Bill name" },
  "Nominal (Rp)": { id: "Nominal (Rp)", en: "Amount (Rp)" },
  "Catatan (opsional)": { id: "Catatan (opsional)", en: "Notes (optional)" },
  "Tagihan berulang": { id: "Tagihan berulang", en: "Recurring bill" },
  "Tagihan ditambahkan": { id: "Tagihan ditambahkan", en: "Bill added" },
  "Tagihan dilunasi": { id: "Tagihan dilunasi", en: "Bill paid" },
  "Riwayat pembayaran": { id: "Riwayat pembayaran", en: "Payment history" },
  "Belum ada": { id: "Belum ada", en: "None yet" },
  "Laporan Tagihan": { id: "Laporan Tagihan", en: "Bill Report" },
  "Keluarga": { id: "Keluarga", en: "Family" },
  "belum": { id: "belum", en: "not yet" },
  "PDF diunduh": { id: "PDF diunduh", en: "PDF downloaded" },
  "Hutang / Piutang baru": { id: "Hutang / Piutang baru", en: "New Debt / Credit" },
  "Catat Baru": { id: "Catat Baru", en: "New Record" },
  "Disimpan": { id: "Disimpan", en: "Saved" },
  "Belum ada catatan keuangan": { id: "Belum ada catatan keuangan", en: "No records yet" },
  "Terbayar": { id: "Terbayar", en: "Paid" },
  "bulan lagi": { id: "bulan lagi", en: "months left" },
  "sisa": { id: "sisa", en: "remaining" },
  "Tambah cicilan": { id: "Tambah cicilan", en: "Add installment" },
  "Cicilan dicatat": { id: "Cicilan dicatat", en: "Installment recorded" },
  "Cicilan/bln": { id: "Cicilan/bln", en: "Installment/mo" },
  "Nama": { id: "Nama", en: "Name" },
  "No. WhatsApp": { id: "No. WhatsApp", en: "WhatsApp No." },
  "Alamat (opsional)": { id: "Alamat (opsional)", en: "Address (optional)" },
  "Total (Rp)": { id: "Total (Rp)", en: "Total (Rp)" },
  "Tanggal mulai": { id: "Tanggal mulai", en: "Start date" },
  "Jenis": { id: "Jenis", en: "Type" },
  "Catatan": { id: "Catatan", en: "Notes" },

  // --- Kalender ---
  "Kalender": { id: "Kalender", en: "Calendar" },
  "agenda tersimpan": { id: "agenda tersimpan", en: "saved events" },
  "Tambah agenda": { id: "Tambah agenda", en: "Add event" },
  "Pilih tanggal": { id: "Pilih tanggal", en: "Select date" },
  "Tidak ada agenda di tanggal ini": { id: "Tidak ada agenda di tanggal ini", en: "No events on this date" },
  "Agenda dihapus": { id: "Agenda dihapus", en: "Event deleted" },
  "Agenda ditambahkan": { id: "Agenda ditambahkan", en: "Event added" },
  "Simpan agenda": { id: "Simpan agenda", en: "Save event" },
  "Judul": { id: "Judul", en: "Title" },
  "Tanggal": { id: "Tanggal", en: "Date" },
  "Misal: Arisan RT": { id: "Misal: Arisan RT", en: "e.g.: Neighborhood gathering" },

  // --- Akun ---
  "Profil tersimpan": { id: "Profil tersimpan", en: "Profile saved" },
  "Avatar diperbarui": { id: "Avatar diperbarui", en: "Avatar updated" },
  "Nama lengkap": { id: "Nama lengkap", en: "Full name" },
  "No. Telepon": { id: "No. Telepon", en: "Phone number" },
  "Simpan profil": { id: "Simpan profil", en: "Save profile" },
  "Kode undangan": { id: "Kode undangan", en: "Invite code" },
  "Bagikan ke anggota keluarga untuk bergabung": { id: "Bagikan ke anggota keluarga untuk bergabung", en: "Share with family members to join" },
  "Anggota": { id: "Anggota", en: "Members" },
  "Kontak darurat": { id: "Kontak darurat", en: "Emergency contacts" },
  "Kontak darurat baru": { id: "Kontak darurat baru", en: "New emergency contact" },
  "Belum ada kontak": { id: "Belum ada kontak", en: "No contacts yet" },
  "Kontak ditambahkan": { id: "Kontak ditambahkan", en: "Contact added" },
  "Telepon": { id: "Telepon", en: "Phone" },
  "Dokumen rumah": { id: "Dokumen rumah", en: "House documents" },
  "Tambah dokumen": { id: "Tambah dokumen", en: "Add document" },
  "Dokumen ditambahkan": { id: "Dokumen ditambahkan", en: "Document added" },
  "Belum ada dokumen. Tempel link Google Drive untuk arsip cepat.": { id: "Belum ada dokumen. Tempel link Google Drive untuk arsip cepat.", en: "No documents yet. Paste Google Drive link for quick archive." },
  "Role diperbarui": { id: "Role diperbarui", en: "Role updated" },
  "Kode disalin!": { id: "Kode disalin!", en: "Code copied!" },
  "item menunggu dibeli": { id: "item menunggu dibeli", en: "items waiting to be bought" },
  "Ingatkan (hari sebelum)": { id: "Ingatkan (hari sebelum)", en: "Remind (days before)" },

  // --- Keuangan extended ---
  "Semua Tipe": { id: "Semua Tipe", en: "All Types" },
  "Hapus": { id: "Hapus", en: "Delete" },

  // --- Misc ---
  "Kembali ke beranda": { id: "Kembali ke beranda", en: "Back to home" },
  "Halaman tidak ditemukan": { id: "Halaman tidak ditemukan", en: "Page not found" },
  "Halaman yang Anda cari tidak tersedia.": { id: "Halaman yang Anda cari tidak tersedia.", en: "The page you are looking for is not available." },
  "Halaman gagal dimuat": { id: "Halaman gagal dimuat", en: "Page failed to load" },
  "Ada yang salah. Coba muat ulang.": { id: "Ada yang salah. Coba muat ulang.", en: "Something went wrong. Try reloading." },
  "Coba lagi": { id: "Coba lagi", en: "Try again" },

  // --- greetings ---
  "Halo,": { id: "Halo,", en: "Hello," },

};

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  T: (key: string, enFallback?: string) => string;
}>({ lang: "id", setLang: () => {}, T: (k) => k });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rewang-lang") as Lang | null;
      if (saved) return saved;
    }
    return "id";
  });

  const T = (key: string, enFallback?: string) => {
    if (lang === "id") return key;
    return t[key]?.en ?? enFallback ?? key;
  };

  const changeLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("rewang-lang", l);
  };

  return <LangContext.Provider value={{ lang, setLang: changeLang, T }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}