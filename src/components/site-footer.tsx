import { destinations, heroPhoto } from "@/content/destinations";
import { navigation, site } from "@/lib/site";
import { VoyraMark } from "./icons";

const credits = [
  { place: "Hero coastline", credit: heroPhoto.credit },
  ...destinations.map((destination) => ({ place: destination.name, credit: destination.photo.credit })),
];

export function SiteFooter() {
  return (
    <footer className="on-dark bg-ink text-paper">
      <div className="mx-auto max-w-[1440px] px-5 pt-20 pb-10 md:px-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="flex items-center gap-2">
              <VoyraMark className="h-7 w-7" />
              <span className="font-display text-2xl tracking-[0.18em]">VOYRA</span>
            </p>
            <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-paper/70">
              A travel experience concept by{" "}
              <a href={site.studio.url} className="text-paper underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                WebbingHUB
              </a>
              . VOYRA is not a travel agency and does not sell travel. Destinations are real; hotels,
              itineraries and prices are fictional examples.
            </p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3">
            <h2 className="eyebrow text-paper/50">Explore</h2>
            <ul className="mt-5 space-y-3 text-[0.95rem]">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-paper/80 hover:text-paper">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={site.studio.contactUrl} className="text-paper/80 hover:text-paper">
                  Contact WebbingHUB
                </a>
              </li>
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <h2 className="eyebrow text-paper/50">Photography</h2>
            <ul className="mt-5 space-y-2 text-[0.85rem] text-paper/65">
              {credits.map((item) => (
                <li key={item.place}>
                  {item.place}:{" "}
                  <a href={item.credit.url} className="text-paper/85 underline decoration-paper/30 underline-offset-4 hover:decoration-paper">
                    {item.credit.name}
                  </a>{" "}
                  on Unsplash
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-paper/15 pt-6 text-[0.8rem] text-paper/50 sm:flex-row sm:justify-between">
          <p>© 2026 WebbingHUB. Concept work.</p>
          <p>voyra.webbinghub.io</p>
        </div>
      </div>
    </footer>
  );
}
