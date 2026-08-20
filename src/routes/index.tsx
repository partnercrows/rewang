import { createFileRoute } from "@tanstack/react-router";
import { DownloadHeader } from "@/components/landing/DownloadHeader";
import { DownloadHero } from "@/components/landing/DownloadHero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { BenefitSection } from "@/components/landing/BenefitSection";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { TrustSection } from "@/components/landing/TrustSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
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
        <ProblemSection />
        <BenefitSection />
        <ProductShowcase />
        <TrustSection />
        <HowItWorks />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}
