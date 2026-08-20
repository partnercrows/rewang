export function getWaAccessUrl() {
  const base = "https://wa.me/6281294097650";
  const text =
    "Halo, saya mau coba Rewang untuk atur rumah tangga saya. Boleh minta akses awalnya?";
  return `${base}?text=${encodeURIComponent(text)}`;
}
