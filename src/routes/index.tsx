import { createFileRoute } from "@tanstack/react-router";
import { DownloadHeader } from "@/components/landing/DownloadHeader";
import { DownloadHero } from "@/components/landing/DownloadHero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { ClosingCTA } from "@/components/landing/ClosingCTA";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Rewang - Biar Urusan Rumah, Nggak Jadi Beban Pikiran",
      },
    ],
  }),
  component: DownloadPage,
});

function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#fef9ef] font-body">
      <DownloadHeader />
      <main>
        <DownloadHero />
        <FeatureGrid />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}
