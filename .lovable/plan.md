## Masalah
RLS policy memanggil `current_family_id()`, tapi role `authenticated` tidak punya EXECUTE permission pada function tersebut → semua query ke `profiles`, `families`, dll. mengembalikan 403 `permission denied for function current_family_id`.

## Perbaikan
Jalankan migration singkat:

```sql
GRANT EXECUTE ON FUNCTION public.current_family_id() TO authenticated, anon, service_role;
```

Tidak ada perubahan kode frontend yang diperlukan. Setelah migration disetujui, onboarding (buat/gabung keluarga) dan load profile akan berfungsi normal.