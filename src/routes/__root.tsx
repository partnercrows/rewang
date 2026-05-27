import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak tersedia.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Halaman gagal dimuat</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ada yang salah. Coba muat ulang.</p>
        <div className="mt-6 flex gap-2 justify-center">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Coba lagi
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "Rewang App - Kolaborasi Rumah Tangga" },
      {
        name: "description",
        content:
          "Aplikasi kolaborasi rumah tangga: stok belanja, tagihan, hutang-piutang, dan papan tugas keluarga dalam satu aplikasi.",
      },
      { name: "theme-color", content: "#7d9b76" },
      { property: "og:title", content: "Rewang App - Kolaborasi Rumah Tangga" },
      { property: "og:description", content: "Rewang membantu urusan rumah tangga jadi lebih sat-set. Atur belanja rutin, countdown tagihan, catatan cicilan, dan tugas keluarga dalam satu aplikasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Rewang App - Kolaborasi Rumah Tangga" },
      { name: "description", content: "Rewang membantu urusan rumah tangga jadi lebih sat-set. Atur belanja rutin, countdown tagihan, catatan cicilan, dan tugas keluarga dalam satu aplikasi." },
      { name: "twitter:description", content: "Rewang membantu urusan rumah tangga jadi lebih sat-set. Atur belanja rutin, countdown tagihan, catatan cicilan, dan tugas keluarga dalam satu aplikasi." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/39ee2285-3dff-4d79-aa24-8a67fc193ce4" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/39ee2285-3dff-4d79-aa24-8a67fc193ce4" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
