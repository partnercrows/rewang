import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { loading, session, profile } = useAuth();
  const search = Route.useSearch() as Record<string, string>;
  const { error, error_code, error_description } = search;

  // Update last_active_at every 5 minutes while user is online
  useEffect(() => {
    if (!session?.user) return;
    const update = () => {
      supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", session.user.id).then(({ error }) => {
        if (error) console.error("Failed to update last_active_at:", error);
      });
    };
    update(); // update immediately on mount
    const interval = setInterval(update, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  // If there's an OAuth error in the URL, show it before redirecting
  if (error && !session && !loading) {
    return <OAuthErrorPage error={error} errorCode={error_code} errorDescription={error_description} />;
  }

  // Keep showing spinner until auth state is fully resolved (session + profile loaded)
  // This prevents premature redirects during auth state transitions
  if (loading || (session && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!profile?.family_id) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function OAuthErrorPage({ error, errorCode, errorDescription }: { error?: string; errorCode?: string; errorDescription?: string }) {
  const description = errorDescription ? decodeURIComponent(errorDescription) : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/40 to-accent/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive shadow-soft mb-3">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-destructive">Login Gagal</h1>
          <p className="text-muted-foreground mt-1 text-sm">Google Sign-In mengalami kendala.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-3">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-sm">
            <p className="font-semibold text-destructive mb-1">{errorCode || error}</p>
            {description && (
              <p className="text-muted-foreground text-xs leading-relaxed break-words">{description}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Ini biasanya terjadi karena konfigurasi Google Cloud Console yang belum lengkap.
            Pastikan <strong>Authorized redirect URIs</strong> di Google Cloud Console sudah mencantumkan:
          </p>
          <code className="block bg-muted rounded-lg p-2 text-xs break-all select-all">
            https://ovvxvinihfkmwirntont.supabase.co/auth/v1/callback
          </code>

          <div className="flex gap-2 pt-2">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/login">Coba Lagi</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/login">Login dengan Email</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
