// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    server: {
      port: 5173,
      strictPort: true,
    },
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        // Inject the service worker registration script into the HTML
        injectRegister: "auto",
        // Ensure the service worker is served at the root so it can control the whole scope
        base: "/",
        // Include assets from the build
        includeAssets: ["favicon.ico", "rewang.svg", "pwa-144x144.png", "pwa-180x180.png", "pwa-192x192.png", "pwa-512x512.png"],
        devOptions: {
          enabled: true,
        },
        manifest: {
          name: "Rewang - Kolaborasi Rumah Tangga",
          short_name: "Rewang",
          description:
            "Aplikasi kolaborasi rumah tangga: stok belanja, tagihan, hutang-piutang, dan papan tugas keluarga dalam satu aplikasi.",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          display_override: ["standalone", "fullscreen"],
          prefer_related_applications: false,
          orientation: "portrait",
          scope: "/app",
          start_url: "/app",
          lang: "id",
          categories: ["lifestyle", "productivity", "utilities"],
          shortcuts: [
            {
              name: "Papan Tugas",
              short_name: "Tugas",
              description: "Lihat papan tugas keluarga",
              url: "/app/tugas",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
            },
            {
              name: "Belanja",
              short_name: "Belanja",
              description: "Kelola daftar belanja",
              url: "/app/belanja",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
            },
            {
              name: "Kalender",
              short_name: "Kalender",
              description: "Kalender kegiatan keluarga",
              url: "/app/kalender",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
            },
          ],
          icons: [
            {
              src: "/pwa-144x144.png",
              sizes: "144x144",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              // Cache app shell (JS/CSS/HTML) with StaleWhileRevalidate
              urlPattern: ({ request }: { request: Request }) =>
                request.destination === "script" ||
                request.destination === "style" ||
                request.destination === "document",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "app-shell",
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
          ],
        },
      }),
    ],
  },
  nitro: {
    preset: "vercel",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
