import Image from "next/image";
import { site } from "@/lib/site";
import { ArrowRight, ArrowUpRight } from "../icons";

export function ClosingSection() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-5 pt-24 pb-28 md:px-10 md:pt-36 md:pb-40">
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 600 260"
            fill="none"
            className="pointer-events-none absolute -top-10 right-0 hidden w-[44%] md:block"
          >
            <path
              d="M10 240 C 160 250 300 200 380 130 S 520 30 560 40"
              stroke="var(--color-coral)"
              strokeWidth="2"
              strokeLinecap="round"
              className="contrail-path"
            />
          </svg>
          <div className="reveal absolute -top-16 right-[-2%] w-[30%] max-w-[300px] min-w-[160px] md:-top-24 md:right-[2%]">
            <Image
              src="/images/voyra-plane.webp"
              alt=""
              width={640}
              height={480}
              unoptimized
              className="h-auto w-full -scale-x-100 rotate-[6deg]"
            />
          </div>

          <p className="eyebrow text-ink-muted">05 · Your turn</p>
          <h2
            id="contact-title"
            className="headline reveal mt-8 max-w-[14ch] text-[clamp(3rem,9vw,8rem)] text-ink"
          >
            Imagine what we could build for <em className="font-light text-sky-deep">your</em> travel agency.
          </h2>
        </div>

        <div className="mt-14 grid gap-10 border-t border-ink/15 pt-10 lg:grid-cols-12">
          <div className="space-y-5 text-[1.08rem] leading-relaxed text-ink-soft lg:col-span-6">
            <p>
              VOYRA is a concept. Its destinations are real places, but its hotels, prices and planner
              are illustrations. The approach behind it is real.
            </p>
            <p>
              WebbingHUB designs and engineers travel websites around a specific business: its
              destinations, its suppliers, its team and the systems it already runs, from supplier APIs
              to the CRM.
            </p>
          </div>
          <div className="flex flex-col items-start gap-5 lg:col-span-5 lg:col-start-8">
            <a
              href={site.studio.contactUrl}
              className="group inline-flex min-h-16 w-full items-center justify-between gap-4 rounded-full bg-ink py-2 pr-2 pl-7 text-[1.05rem] font-medium text-paper transition-colors hover:bg-night sm:w-auto"
            >
              Let&rsquo;s build your agency&rsquo;s next chapter
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-coral text-ink transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-5 w-5" />
              </span>
            </a>
            <a
              href={site.studio.url}
              className="inline-flex items-center gap-2 border-b border-ink/40 pb-1 text-[0.98rem] text-ink hover:border-ink"
            >
              Explore WebbingHUB
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
