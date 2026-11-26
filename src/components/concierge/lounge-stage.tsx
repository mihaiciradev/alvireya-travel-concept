import Image from "next/image";
import { scenarios } from "@/content/concierge";
import { destinations, getDestination, heroPhoto, type DestinationId } from "@/content/destinations";
import type { Profile } from "@/lib/concierge";
import { AlvireyaLogo } from "../brand";

function briefRows(profile: Profile) {
  const style = scenarios.find((item) => item.id === profile.style)?.label;
  return [
    { label: "Feeling", value: style },
    { label: "When", value: profile.when },
    { label: "Travellers", value: profile.party },
    { label: "Budget", value: profile.budget },
  ];
}

export function LoungeStage({ focus, profile }: { focus: DestinationId | null; profile: Profile }) {
  const destination = focus ? getDestination(focus) : null;
  const rows = briefRows(profile);
  const known = rows.filter((row) => row.value).length;

  return (
    <div className="lounge-stage relative isolate h-full overflow-hidden bg-night text-paper">
      <Image
        src={heroPhoto.src}
        alt=""
        fill
        quality={60}
        sizes="(min-width: 1024px) 45vw, 100vw"
        data-active={!destination}
        className="stage-photo object-cover"
      />
      {destinations.map((item) => (
        <Image
          key={item.id}
          src={item.photo.src}
          alt=""
          fill
          quality={60}
          sizes="(min-width: 1024px) 45vw, 100vw"
          data-active={item.id === focus}
          className="stage-photo object-cover"
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,24,36,0.7),transparent_75%)] lg:hidden" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,24,36,0.55)_0%,rgba(12,24,36,0)_28%,rgba(12,24,36,0)_45%,rgba(12,24,36,0.82)_100%)]" />

      <div className="lounge-stage-copy relative flex h-full [text-shadow:0_1px_14px_rgba(12,24,36,0.45)] flex-col justify-between p-5 pr-16 md:p-8 lg:p-10">
        <div className="flex items-center gap-3">
          <AlvireyaLogo className="text-paper" />
          <span className="eyebrow hidden rounded-full border border-paper/30 px-2.5 py-1 text-[0.54rem] text-paper/85 sm:inline">
            Concierge
          </span>
        </div>

        <div>
          <div key={focus ?? "none"} className="stage-title">
            <p className="eyebrow text-[0.6rem] text-paper/75">
              {destination ? `${destination.country} · ${destination.coordinates}` : "Window seat · your next place"}
            </p>
            <p className="headline mt-2 text-[clamp(2.2rem,6vw,5.4rem)] text-paper">
              {destination ? destination.name : "Where to?"}
            </p>
            <p className="mt-1 font-display text-[1.05rem] text-paper/85 italic lg:text-[1.3rem]">
              {destination ? destination.mood : "Tell me how it should feel."}
            </p>
          </div>

          <div className="lounge-brief mt-6 hidden rounded-[1.4rem] bg-paper/95 p-1.5 text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] lg:block">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <p className="eyebrow text-[0.56rem] text-ink-muted">Your brief</p>
              <p className="eyebrow text-[0.56rem] text-ink-muted">{known} of 4 noted</p>
            </div>
            <dl className="grid grid-cols-4 border-t border-dashed border-ink/20">
              {rows.map((row) => (
                <div key={row.label} className="px-4 py-3 not-last:border-r not-last:border-dashed not-last:border-ink/15">
                  <dt className="eyebrow text-[0.52rem] text-ink-muted">{row.label}</dt>
                  <dd
                    key={row.value ?? "empty"}
                    className={`brief-value mt-1 truncate font-display text-[1.02rem] ${row.value ? "text-ink" : "text-ink/30"}`}
                  >
                    {row.value ?? "Listening"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {known > 0 ? (
            <p className="mt-3 flex flex-wrap gap-1.5 lg:hidden">
              {rows
                .filter((row) => row.value)
                .map((row) => (
                  <span key={row.label} className="rounded-full bg-paper/90 px-2.5 py-1 text-[0.72rem] text-ink">
                    {row.value}
                  </span>
                ))}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
