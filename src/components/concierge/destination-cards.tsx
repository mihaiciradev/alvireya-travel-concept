import Image from "next/image";
import { getDestination, type DestinationId } from "@/content/destinations";
import { selectDestination, showInWindow } from "@/lib/events";
import { ArrowRight } from "../icons";

export function DestinationCards({ ids, active }: { ids: DestinationId[]; active: DestinationId | null }) {
  return (
    <ul className="concierge-cards -mx-1 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 sm:flex-wrap sm:overflow-visible">
      {ids.map((id, index) => {
        const destination = getDestination(id);
        const selected = active === id;
        return (
          <li
            key={id}
            style={{ animationDelay: `${index * 110}ms` }}
            className="concierge-card w-[16.5rem] shrink-0 snap-start sm:w-[17rem]"
          >
            <div
              data-selected={selected}
              className="flex h-full gap-4 rounded-[1.4rem] bg-paper/80 p-2.5 pr-4 ring-1 ring-ink/10 transition-[box-shadow,background-color] duration-300 data-[selected=true]:bg-white/70 data-[selected=true]:ring-ink/35"
            >
              <button
                type="button"
                onClick={() => showInWindow(id)}
                aria-pressed={selected}
                aria-label={`Show ${destination.name} in the window`}
                className="group relative h-[6.6rem] w-[4.8rem] shrink-0 overflow-hidden rounded-full bg-paper-deep ring-1 ring-ink/10"
              >
                <Image
                  src={destination.photo.src}
                  alt=""
                  fill
                  quality={55}
                  sizes="80px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35),inset_0_14px_20px_-12px_rgba(255,255,255,0.6)]" />
              </button>
              <div className="flex min-w-0 flex-col py-1">
                <p className="eyebrow text-[0.54rem] text-ink-muted">{destination.coordinates}</p>
                <p className="mt-1 font-display text-[1.3rem] leading-none text-ink">{destination.name}</p>
                <p className="mt-1 text-[0.78rem] leading-snug text-ink-muted">
                  <em className="font-display">{destination.mood}</em> · {destination.idealStay}
                </p>
                <a
                  href="#journey"
                  onClick={() => selectDestination(id)}
                  className="group mt-auto inline-flex w-fit items-center gap-1.5 border-b border-ink/40 pt-2 text-[0.8rem] font-medium text-ink hover:border-ink"
                >
                  Request a quote
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
