import Image from "next/image";
import { destinations } from "@/content/destinations";
import { DestinationStage } from "../destination-stage";
import { ArrowRight } from "../icons";
import { PlanLink } from "../plan-link";
import { SectionIntro } from "../section-intro";

export function Destinations() {
  return (
    <section
      id="destinations"
      aria-labelledby="destinations-title"
      className="relative bg-(--tint,var(--color-paper)) transition-colors duration-1000"
    >
      <div className="mx-auto max-w-[1440px] px-5 pt-24 pb-10 md:px-10 md:pt-36">
        <SectionIntro
          index="01"
          label="Destinations"
          titleId="destinations-title"
          title={
            <>
              Four places. <em className="font-light">Four ways</em> to feel something.
            </>
          }
        >
          A short, considered list instead of a thousand offers. Each place is chosen for a mood,
          told as a story, and ready to become a journey.
        </SectionIntro>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-6 px-5 pb-24 md:px-10 md:pb-36 lg:grid-cols-12">
        <div className="hidden lg:col-span-6 lg:block">
          <DestinationStage
            items={destinations.map(({ id, name, country, coordinates, tint, photo }) => ({
              id,
              name,
              country,
              coordinates,
              tint,
              photo,
            }))}
          />
        </div>

        <div className="lg:col-span-6 lg:col-start-7 lg:pl-[6%]">
          {destinations.map((destination, index) => (
            <article
              key={destination.id}
              id={`destination-${destination.id}`}
              data-chapter={destination.id}
              aria-labelledby={`destination-${destination.id}-name`}
              className="reveal flex flex-col justify-center border-t border-ink/10 py-14 first:border-none lg:min-h-[88svh] lg:border-none lg:py-20"
            >
              <div className="relative mb-9 aspect-[4/5] overflow-hidden rounded-[1.75rem] sm:aspect-[16/11] lg:hidden">
                <Image
                  src={destination.photo.src}
                  alt={destination.photo.alt}
                  fill
                  quality={68}
                  fetchPriority="low"
                  sizes="(min-width: 640px) 90vw, 92vw"
                  className="object-cover"
                />
              </div>

              <p className="eyebrow flex flex-wrap gap-x-4 gap-y-1 text-ink-muted">
                <span>
                  {String(index + 1).padStart(2, "0")} / {String(destinations.length).padStart(2, "0")}
                </span>
                <span aria-hidden="true">·</span>
                <span>{destination.coordinates}</span>
              </p>

              <h3
                id={`destination-${destination.id}-name`}
                className="headline mt-5 text-[clamp(3rem,9vw,5.6rem)] text-ink"
              >
                {destination.name}
              </h3>
              <p
                className="mt-3 font-display text-[1.6rem] italic font-light"
                style={{ color: destination.accent }}
              >
                {destination.mood}, {destination.country}
              </p>

              <p className="mt-8 max-w-xl text-[1.25rem] leading-snug font-medium text-ink md:text-[1.35rem]">
                {destination.headline}
              </p>
              <p className="mt-4 max-w-xl text-[1.02rem] leading-relaxed text-ink-soft">{destination.story}</p>

              <dl className="mt-9 grid max-w-xl grid-cols-1 gap-x-6 gap-y-5 border-t border-dashed border-ink/25 pt-6 sm:grid-cols-3">
                <div>
                  <dt className="eyebrow text-[0.62rem] text-ink-muted">Best time</dt>
                  <dd className="mt-1.5 text-[0.95rem] text-ink">{destination.bestTime}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-[0.62rem] text-ink-muted">Ideal stay</dt>
                  <dd className="mt-1.5 text-[0.95rem] text-ink">{destination.idealStay}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-[0.62rem] text-ink-muted">Pace</dt>
                  <dd className="mt-1.5 text-[0.95rem] text-ink">{destination.pace}</dd>
                </div>
              </dl>

              <PlanLink
                destination={destination.id}
                className="group mt-10 inline-flex w-fit items-center gap-3 border-b border-ink pb-1.5 text-[0.98rem] font-medium text-ink"
              >
                Shape a journey to {destination.name}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </PlanLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
