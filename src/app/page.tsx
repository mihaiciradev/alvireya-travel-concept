import { BehindSection } from "@/components/sections/behind-section";
import { ClosingSection } from "@/components/sections/closing-section";
import { Destinations } from "@/components/sections/destinations";
import { Hero } from "@/components/sections/hero";
import { JourneySection } from "@/components/sections/journey-section";
import { PlannerSection } from "@/components/sections/planner-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";

export const ensureStatic = "navigation";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ALVIREYA",
  alternateName: "ALVIREYA — A Travel Experience Concept by WebbingHUB",
  url: site.url,
  description: site.description,
  inLanguage: "en",
  genre: "Website design concept",
  creator: { "@type": "Organization", name: site.studio.name, url: site.studio.url },
  publisher: { "@type": "Organization", name: site.studio.name, url: site.studio.url },
};

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-ink px-5 py-3 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Destinations />
        <PlannerSection />
        <JourneySection />
        <BehindSection />
        <ClosingSection />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
