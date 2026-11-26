import { getImageProps } from "next/image";
import { heroPhoto } from "@/content/destinations";
import { Concierge } from "../concierge/concierge";
import { PlaneStage } from "../hero-plane/plane-stage";
import { BoardingDestination, HeroWindowCaption, HeroWindowView } from "../hero-window";
import { ArrowDown } from "../icons";

const boarding = [
  { label: "From", value: "Here" },
  { label: "To", value: <BoardingDestination fallback="Somewhere new" /> },
  { label: "Seat", value: "Window" },
];

function heroImage() {
  const common = { alt: heroPhoto.alt, fetchPriority: "high" as const, loading: "eager" as const };
  const {
    props: { srcSet: desktop },
  } = getImageProps({
    ...common,
    src: `${heroPhoto.src}?ar=3:4`,
    width: 1200,
    height: 1600,
    quality: 68,
    sizes: "(min-width: 1440px) 560px, 40vw",
  });
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({
    ...common,
    src: `${heroPhoto.src}?ar=16:10`,
    width: 1600,
    height: 1000,
    quality: 55,
    sizes: "(min-width: 640px) 92vw, 80vw",
  });
  return { desktop, mobile, rest };
}

export function Hero() {
  const photo = heroImage();
  return (
    <section
      id="top"
      data-hero
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-24 pb-14 md:pt-28 lg:min-h-[max(100svh,760px)] lg:pb-10"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col px-5 md:px-10 lg:grid lg:grid-cols-12 lg:gap-6">
        <div className="contents lg:relative lg:z-30 lg:col-span-7 lg:flex lg:flex-col lg:pt-[4vh]">
          <p className="eyebrow hero-rise order-1 text-ink-muted">Journeys designed around how you feel</p>

          <h1
            id="hero-title"
            className="headline hero-title hero-rise order-2 mt-5 text-[clamp(3rem,12.5vw,8.4rem)] text-ink md:mt-6 lg:text-[clamp(4.2rem,6.6vw,7.2rem)]"
          >
            The world is <em className="font-light text-sky-deep">closer</em>
            <br className="hidden sm:block" /> than it looks.
          </h1>

          <div className="hero-lede order-3">
            <div className="overflow-hidden">
              <p className="hero-rise-late mt-6 max-w-[34rem] text-[1.02rem] leading-relaxed text-ink-soft md:mt-7 md:text-[1.15rem]">
                Tell ALVIREYA how you want the trip to feel. It answers like a good travel designer would,
                then hands you the details.
              </p>
            </div>
          </div>

          <div className="hero-rise-late order-4 mt-7 md:mt-8 lg:max-w-[min(38rem,calc(45vw-40px))]">
            <Concierge />
            <div className="hero-links mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.88rem] text-ink-soft">
              <a href="#destinations" className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-ink hover:underline">
                Browse the four destinations
                <ArrowDown className="h-3.5 w-3.5" />
              </a>
              <a href="#planner" className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-ink hover:underline">
                Or use the guided planner
                <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <dl className="order-6 mt-14 hidden max-w-lg grid-cols-3 border-t border-dashed border-ink/25 pt-5 lg:mt-auto lg:mb-[4vh] lg:grid">
            {boarding.map((item) => (
              <div key={item.label}>
                <dt className="eyebrow text-[0.62rem] text-ink-muted">{item.label}</dt>
                <dd className="mt-1.5 font-display text-xl text-ink">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative order-5 mt-10 lg:order-none lg:col-span-5 lg:mt-0">
          <div className="relative mx-auto aspect-[16/11] w-full sm:aspect-[16/10] md:aspect-[2/1] lg:aspect-auto lg:h-[min(80svh,780px)]">
            <div className="hero-window porthole absolute inset-0 bg-paper-deep p-2.5 shadow-[inset_0_2px_8px_rgba(16,32,47,0.18),0_40px_80px_-40px_rgba(16,32,47,0.45)] md:p-3.5">
              <div className="porthole relative h-full w-full overflow-hidden">
                <picture>
                  <source media="(min-width: 1024px)" srcSet={photo.desktop} sizes="(min-width: 1440px) 560px, 40vw" />
                  <source srcSet={photo.mobile} sizes="(min-width: 640px) 92vw, 80vw" />
                  <img {...photo.rest} alt={heroPhoto.alt} className="absolute inset-0 h-full w-full object-cover" />
                </picture>
                <HeroWindowView />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                  <span className="cloud cloud-a" />
                  <span className="cloud cloud-b" />
                  <span className="cloud cloud-c" />
                </div>
                <div className="porthole pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35),inset_0_30px_60px_-30px_rgba(255,255,255,0.5)]" />
              </div>
            </div>

            <div
              data-plane-anchor
              className="absolute top-[6%] left-[-3%] aspect-[4/3] w-[38%] max-w-[260px] md:top-[10%] md:w-[30%] lg:top-[30%] lg:left-[-30%] lg:w-[50%]"
            >
              <div className="plane-poster absolute inset-0 bg-[url(/images/alvireya-plane.webp)] bg-contain bg-center bg-no-repeat" />
            </div>
          </div>
          <p className="eyebrow mt-4 hidden text-center text-[0.62rem] text-ink-muted sm:block lg:mt-5 lg:text-right">
            <HeroWindowCaption fallback="Window seat · a coastline, seen from above" />
          </p>
        </div>
      </div>

      <PlaneStage />
    </section>
  );
}
