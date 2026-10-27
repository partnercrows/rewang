import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/Hero";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { Achievements } from "@/components/landing/Achievements";
import { Steps } from "@/components/landing/Steps";
import { Privacy } from "@/components/landing/Privacy";
import { FAQ } from "@/components/landing/FAQ";
import { ClosingCTA } from "@/components/landing/ClosingCTA";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Rewang — Aplikasi urusan rumah tangga keluarga",
      },
    ],
  }),
  component: DownloadPage,
});

function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#F8F5EC] font-body text-[#14211E]">
      <main>
        <Hero />
        <FeaturesBento />
        <Achievements />
        <Steps />
        <Privacy />
        <FAQ />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}
