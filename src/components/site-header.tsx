import { navigation } from "@/lib/site";
import { VoyraMark } from "./icons";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="site-header fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:h-[4.5rem] md:px-10">
        <a href="#top" className="flex items-center gap-2 text-ink" aria-label="VOYRA, back to top">
          <VoyraMark className="h-6 w-6" />
          <span className="font-display text-[1.35rem] font-medium tracking-[0.18em]">VOYRA</span>
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-9 text-[0.92rem] text-ink-soft">
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="transition-colors hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href="#behind"
          className="eyebrow hidden rounded-full border border-ink/15 px-3.5 py-2 text-[0.66rem] text-ink-soft transition-colors hover:border-ink/40 hover:text-ink lg:inline-flex"
        >
          A concept by WebbingHUB
        </a>

        <MobileNav />
      </div>
    </header>
  );
}
