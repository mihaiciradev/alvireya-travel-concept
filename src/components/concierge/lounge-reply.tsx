import Image from "next/image";
import { scenarios, type Suggestion } from "@/content/concierge";
import { getDestination, type DestinationId } from "@/content/destinations";
import { where, type Reply } from "@/lib/concierge";
import { ArrowRight } from "../icons";

type Props = {
  reply: Reply;
  latest: boolean;
  focus: DestinationId | null;
  onSuggest: (suggestion: Suggestion) => void;
  onFocus: (id: DestinationId) => void;
};

function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <span key={index} className="word-rise" style={{ animationDelay: `${index * 45}ms` }}>
          {word}{" "}
        </span>
      ))}
    </>
  );
}

function Welcome({ onSuggest }: { onSuggest: Props["onSuggest"] }) {
  return (
    <ul className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {scenarios.map((scenario, index) => (
        <li key={scenario.id} className="fade-rise" style={{ animationDelay: `${250 + index * 60}ms` }}>
          <button
            type="button"
            onClick={() => onSuggest({ kind: "scenario", id: scenario.id, label: scenario.prompt })}
            className="group relative flex h-full w-full flex-col overflow-hidden rounded-[1.25rem] bg-white/50 p-2 text-left ring-1 ring-ink/10 transition-[box-shadow,background-color] duration-300 hover:bg-white hover:ring-ink/30"
          >
            <span className="relative block aspect-[16/10] overflow-hidden rounded-[0.9rem]">
              <Image
                src={scenario.image.src}
                style={{ objectPosition: scenario.image.position }}
                alt=""
                fill
                sizes="(min-width: 640px) 200px, 45vw"
                quality={55}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </span>
            <span className="flex items-center justify-between gap-2 px-1.5 pt-2.5 pb-1">
              <span className="font-display text-[1.15rem] leading-none text-ink">{scenario.label}</span>
              <ArrowRight className="h-4 w-4 -translate-x-1 text-ink-muted opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Postcards({ reply, focus, onSuggest, onFocus }: Omit<Props, "latest">) {
  return (
    <ul className="lounge-cards -mx-6 mt-7 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] md:overflow-visible md:px-0">
      {reply.picks.map((pick, index) => {
        const destination = getDestination(pick.id);
        const selected = focus === pick.id;
        return (
          <li
            key={pick.id}
            className="fade-rise w-[15.5rem] shrink-0 snap-start md:w-auto"
            style={{ animationDelay: `${350 + index * 120}ms` }}
          >
            <button
              type="button"
              onClick={() => onFocus(pick.id)}
              aria-pressed={selected}
              className="group relative block aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] text-left ring-1 ring-ink/10 transition-shadow duration-500 data-[on=true]:shadow-[0_0_0_2px_var(--color-paper),0_0_0_3.5px_var(--color-ink)]"
              data-on={selected}
            >
              <Image
                src={destination.photo.src}
                alt={destination.photo.alt}
                fill
                sizes="(min-width: 768px) 240px, 62vw"
                quality={62}
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
              />
              <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,24,36,0.78),transparent_55%)]" />
              <span className="absolute right-4 bottom-4 left-4 text-paper">
                <span className="eyebrow block text-[0.52rem] text-paper/75">{destination.coordinates}</span>
                <span className="mt-1 block font-display text-[1.7rem] leading-none">{destination.name}</span>
              </span>
            </button>
            <p className="mt-3 text-[0.86rem] leading-snug text-ink-soft">{pick.why}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.8rem] font-medium whitespace-nowrap">
              <button
                type="button"
                onClick={() => onSuggest({ kind: "outline", destination: pick.id, label: `Sketch five days ${where(pick.id)}` })}
                className="border-b border-ink/40 pb-0.5 text-ink hover:border-ink"
              >
                Five-day sketch
              </button>
              <button
                type="button"
                onClick={() => onSuggest({ kind: "quote", destination: pick.id, label: `Request a quote for ${destination.name}` })}
                className="text-ink-muted hover:text-ink"
              >
                Request a quote
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Outline({ reply }: { reply: Reply }) {
  if (!reply.outline) return null;
  const destination = getDestination(reply.outline.destination);
  return (
    <div className="mt-7 grid gap-6 sm:grid-cols-[1fr_9rem]">
      <ol className="relative border-l border-dashed border-ink/25">
        {reply.outline.days.map((day, index) => (
          <li key={day.label} className="fade-rise relative pb-5 pl-6 last:pb-0" style={{ animationDelay: `${300 + index * 90}ms` }}>
            <span aria-hidden="true" className="absolute top-1.5 -left-[5px] h-2.5 w-2.5 rounded-full border-2 border-paper bg-sky-deep" />
            <p className="eyebrow text-[0.56rem] text-ink-muted">{day.label}</p>
            <p className="mt-1 font-display text-[1.15rem] leading-snug text-ink">{day.title}</p>
            <p className="mt-1 text-[0.88rem] leading-snug text-ink-soft">{day.detail}</p>
          </li>
        ))}
      </ol>
      <div className="fade-rise relative hidden aspect-[3/4] overflow-hidden rounded-full ring-1 ring-ink/10 sm:block" style={{ animationDelay: "250ms" }}>
        <Image src={destination.photo.src} alt="" fill sizes="144px" quality={60} className="object-cover" />
      </div>
    </div>
  );
}

function Brief({ reply }: { reply: Reply }) {
  if (!reply.brief) return null;
  const profile = reply.brief;
  const rows = [
    { label: "Feeling", value: scenarios.find((item) => item.id === profile.style)?.label },
    { label: "Destination", value: profile.destination ? getDestination(profile.destination).name : undefined },
    { label: "When", value: profile.when },
    { label: "Travellers", value: profile.party },
    { label: "Budget", value: profile.budget },
  ];
  return (
    <div className="lounge-ticket fade-rise relative mt-7 flex overflow-hidden rounded-[1.5rem] bg-white/70 ring-1 ring-ink/10" style={{ animationDelay: "250ms" }}>
      <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-3 md:p-6">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="eyebrow text-[0.54rem] text-ink-muted">{row.label}</dt>
            <dd className={`mt-1 font-display text-[1.15rem] ${row.value ? "text-ink" : "text-ink/30 italic"}`}>{row.value ?? "To discuss"}</dd>
          </div>
        ))}
      </dl>
      <div className="lounge-stub relative hidden w-28 shrink-0 flex-col items-center justify-center gap-2 border-l border-dashed border-ink/25 text-center sm:flex">
        <span className="eyebrow text-[0.5rem] text-ink-muted">Hand over to</span>
        <span className="font-display text-[0.98rem] leading-tight text-ink">Travel designer</span>
        <span className="eyebrow text-[0.5rem] text-ink-muted">+ CRM</span>
      </div>
    </div>
  );
}

export function LoungeReply({ reply, latest, focus, onSuggest, onFocus }: Props) {
  return (
    <article className="lounge-reply" aria-label={reply.headline}>
      <p className="eyebrow fade-rise flex items-center gap-2 text-[0.6rem] text-ink-muted">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-coral" />
        {reply.eyebrow}
      </p>
      <h3 className="headline mt-3 text-[clamp(1.9rem,3.6vw,2.7rem)] text-ink">
        <Words text={reply.headline} />
      </h3>
      {reply.body.map((paragraph, index) => (
        <p
          key={index}
          className="fade-rise mt-4 max-w-[34rem] text-[0.98rem] leading-[1.7] text-ink-soft"
          style={{ animationDelay: `${200 + index * 80}ms` }}
        >
          {paragraph}
        </p>
      ))}

      {reply.tone === "welcome" ? <Welcome onSuggest={onSuggest} /> : null}
      {reply.picks.length ? <Postcards reply={reply} focus={focus} onSuggest={onSuggest} onFocus={onFocus} /> : null}
      <Outline reply={reply} />
      <Brief reply={reply} />

      {latest && reply.tone !== "welcome" && reply.next.length ? (
        <div className="fade-rise mt-7" style={{ animationDelay: "520ms" }}>
          <p className="eyebrow text-[0.56rem] text-ink-muted">Where next</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {reply.next.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => onSuggest(suggestion)}
                className="group inline-flex items-center gap-2 rounded-full border border-ink/18 bg-paper py-2 pr-3 pl-4 text-[0.86rem] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                {suggestion.label}
                <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
