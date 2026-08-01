import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

// Bounce page for Google OAuth (Workspace Sharing / Picker spike, Rewang Mobile).
// Google's Web-client OAuth policy blocks redirecting straight to a custom URI scheme
// (rewang://...) - it requires an https redirect_uri. This page is that https landing
// spot: it reads whatever query params Google appended (code, picked_file_ids, error,
// state, ...) and immediately re-redirects into the app's custom scheme, unchanged.
export const Route = createFileRoute("/oauthredirect")({
  head: () => ({ meta: [{ title: "Membuka Rewang..." }] }),
  component: OAuthRedirectPage,
});

function OAuthRedirectPage() {
  const search = Route.useSearch() as Record<string, string>;

  const appUrl = useMemo(() => {
    const params = new URLSearchParams(search);
    return `rewang://oauthredirect?${params.toString()}`;
  }, [search]);

  useEffect(() => {
    window.location.href = appUrl;
  }, [appUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fef9ef] font-body px-4">
      <div className="max-w-sm text-center">
        <img src="/rewang.png" alt="Rewang" className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
        <p className="text-[#2d4a22] font-semibold">Membuka aplikasi Rewang...</p>
        <p className="mt-2 text-sm text-[#6b7d6a]">
          Kalau tidak otomatis terbuka,{" "}
          <a href={appUrl} className="underline text-[#2d6a4f] font-medium">
            ketuk di sini
          </a>
          .
        </p>
      </div>
    </div>
  );
}
