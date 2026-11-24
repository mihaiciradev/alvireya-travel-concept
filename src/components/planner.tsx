"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getDestination, type Interest } from "@/content/destinations";
import { selectDestination } from "@/lib/events";
import {
  budgets,
  interests,
  moods,
  seasons,
  sketchJourney,
  type PlannerInput,
  type PlannerResult,
} from "@/lib/planner";
import { ArrowRight } from "./icons";

const steps = ["Reading your preferences", "Matching four destinations", "Drafting the days"];
const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const chipBase =
  "relative flex cursor-pointer items-center border border-ink/15 bg-paper/60 text-ink-soft transition-colors hover:border-ink/40 has-checked:border-ink has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-coral-deep";
const chip = `${chipBase} justify-center rounded-full`;

export function Planner() {
  const [input, setInput] = useState<PlannerInput>({
    mood: "wander",
    season: "autumn",
    budget: "elevated",
    travelers: 2,
    interests: ["nature", "skies"],
  });
  const [status, setStatus] = useState<"idle" | "thinking" | "done">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<PlannerResult | null>(null);
  const timers = useRef<number[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  function toggleInterest(id: Interest) {
    setInput((current) => ({
      ...current,
      interests: current.interests.includes(id)
        ? current.interests.filter((item) => item !== id)
        : [...current.interests, id],
    }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    timers.current.forEach((timer) => window.clearTimeout(timer));
    const next = sketchJourney(input);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setResult(next);
      setStatus("done");
      return;
    }

    setStatus("thinking");
    setStep(0);
    timers.current = [
      window.setTimeout(() => setStep(1), 450),
      window.setTimeout(() => setStep(2), 900),
      window.setTimeout(() => {
        setResult(next);
        setStatus("done");
        if (window.innerWidth < 1024) {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 1350),
    ];
  }

  const destination = result ? getDestination(result.destinationId) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
      <form onSubmit={onSubmit} className="lg:col-span-5" aria-describedby="planner-note">
        <fieldset>
          <legend className="eyebrow text-ink-muted">1 · How do you want to feel?</legend>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {moods.map((mood) => (
              <label
                key={mood.id}
                className="group relative flex cursor-pointer flex-col rounded-2xl border border-ink/15 bg-paper/60 p-4 transition-colors hover:border-ink/40 has-checked:border-ink has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-coral-deep"
              >
                <input
                  type="radio"
                  name="mood"
                  value={mood.id}
                  checked={input.mood === mood.id}
                  onChange={() => setInput((current) => ({ ...current, mood: mood.id }))}
                  className="sr-only"
                />
                <span className="font-display text-[1.45rem] leading-none">{mood.label}</span>
                <span className="mt-2 text-[0.8rem] leading-snug opacity-90">{mood.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="eyebrow text-ink-muted">2 · When?</legend>
          <div className="mt-4 grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            {seasons.map((season) => (
              <label key={season.id} className={`${chip} px-2 py-2.5 text-[0.92rem] sm:px-4`}>
                <input
                  type="radio"
                  name="season"
                  value={season.id}
                  checked={input.season === season.id}
                  onChange={() => setInput((current) => ({ ...current, season: season.id }))}
                  className="sr-only"
                />
                {season.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="eyebrow text-ink-muted">3 · Budget per person (example ranges)</legend>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {budgets.map((budget) => (
              <label key={budget.id} className={`${chipBase} justify-between rounded-2xl px-4 py-3 text-[0.92rem] sm:flex-col sm:justify-center sm:px-2 sm:text-center`}>
                <input
                  type="radio"
                  name="budget"
                  value={budget.id}
                  checked={input.budget === budget.id}
                  onChange={() => setInput((current) => ({ ...current, budget: budget.id }))}
                  className="sr-only"
                />
                <span className="font-medium">{budget.label}</span>
                <span className="mt-0.5 text-[0.78rem] opacity-90">{budget.range}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-8 grid gap-8 sm:grid-cols-[auto_1fr] sm:gap-10">
          <fieldset>
            <legend className="eyebrow text-ink-muted">4 · Travelers</legend>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-ink/15 bg-paper/60 p-1.5 w-fit">
              <button
                type="button"
                aria-label="Fewer travelers"
                disabled={input.travelers <= 1}
                onClick={() => setInput((current) => ({ ...current, travelers: current.travelers - 1 }))}
                className="grid h-10 w-10 place-items-center rounded-full text-xl text-ink transition-colors hover:bg-ink/10 disabled:opacity-30"
              >
                −
              </button>
              <output aria-live="polite" className="w-20 text-center text-[0.95rem] text-ink">
                {input.travelers} {input.travelers === 1 ? "person" : "people"}
              </output>
              <button
                type="button"
                aria-label="More travelers"
                disabled={input.travelers >= 8}
                onClick={() => setInput((current) => ({ ...current, travelers: current.travelers + 1 }))}
                className="grid h-10 w-10 place-items-center rounded-full text-xl text-ink transition-colors hover:bg-ink/10 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow text-ink-muted">5 · What matters most?</legend>
            <div className="mt-4 flex flex-wrap gap-2">
              {interests.map((interest) => (
                <label key={interest.id} className={`${chip} px-3.5 py-2 text-[0.85rem]`}>
                  <input
                    type="checkbox"
                    name="interests"
                    value={interest.id}
                    checked={input.interests.includes(interest.id)}
                    onChange={() => toggleInterest(interest.id)}
                    className="sr-only"
                  />
                  {interest.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <button
          type="submit"
          disabled={status === "thinking"}
          className="group mt-10 inline-flex h-14 w-full items-center justify-between gap-3 rounded-full bg-ink pr-2 pl-7 text-[0.98rem] font-medium text-paper transition-colors hover:bg-night disabled:opacity-70 sm:w-auto"
        >
          {status === "done" ? "Sketch it again" : "Sketch my journey"}
          <span className="grid h-10 w-10 place-items-center rounded-full bg-sky text-ink transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="h-5 w-5" />
          </span>
        </button>
        <p id="planner-note" className="mt-4 max-w-md text-[0.82rem] leading-relaxed text-ink-muted">
          Simulated demo. A fixed set of rules runs in your browser, no AI model is involved, and
          nothing you choose is stored or sent anywhere.
        </p>
      </form>

      <div ref={resultRef} className="scroll-mt-24 lg:col-span-7">
        <div
          aria-live="polite"
          aria-busy={status === "thinking"}
          className="relative min-h-[34rem] overflow-hidden rounded-[2rem] bg-paper shadow-[0_50px_90px_-50px_rgba(16,32,47,0.5)] ring-1 ring-ink/5"
        >
          {status === "idle" ? (
            <div className="flex h-full min-h-[34rem] flex-col justify-between p-8 md:p-12">
              <p className="eyebrow text-ink-muted">Your journey sketch</p>
              <div>
                <p className="headline max-w-md text-[clamp(2rem,4vw,3rem)] text-ink/85">
                  Tell us how you want to feel. <em className="font-light">We&rsquo;ll draw the first lines.</em>
                </p>
                <ul className="mt-10 space-y-4" aria-hidden="true">
                  {[72, 88, 64, 80].map((width, index) => (
                    <li key={width} className="flex items-center gap-4">
                      <span className="eyebrow w-14 text-[0.6rem] text-ink-muted">Day {index + 1}</span>
                      <span className="hairline flex-1 text-ink" style={{ maxWidth: `${width}%` }} />
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[0.85rem] text-ink-muted">Choose a mood, a season and what matters, then press sketch.</p>
            </div>
          ) : null}

          {status === "thinking" ? (
            <div className="flex min-h-[34rem] flex-col justify-center p-8 md:p-12">
              <p className="sr-only">Sketching your journey</p>
              <ol className="space-y-5">
                {steps.map((label, index) => (
                  <li
                    key={label}
                    className={`flex items-center gap-4 font-display text-2xl transition-opacity duration-300 ${index <= step ? "opacity-100" : "opacity-25"}`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${index < step ? "bg-sky-deep" : index === step ? "thinking-dot bg-coral" : "bg-ink/20"}`}
                    />
                    {label}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {status === "done" && result && destination ? (
            <article aria-label={`Journey sketch: ${destination.name}`}>
              <div className="relative h-56 md:h-64">
                <Image
                  src={destination.photo.src}
                  alt={destination.photo.alt}
                  fill
                  quality={68}
                  sizes="(min-width: 1024px) 52vw, 92vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,24,36,0.7),transparent_60%)]" />
                <p className="eyebrow absolute top-5 left-6 rounded-full bg-paper/90 px-3 py-1.5 text-[0.6rem] text-ink">
                  Simulated sketch
                </p>
                <div className="absolute right-6 bottom-5 left-6 text-paper md:right-10 md:left-10">
                  <p className="eyebrow text-paper/80">
                    {result.nights} nights · {input.travelers} {input.travelers === 1 ? "traveler" : "travelers"}
                  </p>
                  <h3 className="headline mt-2 text-[clamp(2.4rem,5vw,3.6rem)]">
                    {destination.name}, <em className="font-light">{destination.mood.toLowerCase()}</em>
                  </h3>
                </div>
              </div>

              <div className="grid gap-10 p-6 md:grid-cols-[1fr_1.25fr] md:p-10">
                <div>
                  <h4 className="eyebrow text-ink-muted">Why this fits</h4>
                  <ul className="mt-4 space-y-3.5">
                    {result.reasons.map((reason) => (
                      <li key={reason} className="flex gap-3 text-[0.95rem] leading-snug text-ink-soft">
                        <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
                        {reason}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 rounded-2xl bg-mist p-5">
                    <p className="eyebrow text-[0.6rem] text-ink-muted">Example estimate, per person</p>
                    <p className="mt-2 font-display text-[1.9rem] leading-none text-ink">
                      {euro.format(result.estimate.low)}–{euro.format(result.estimate.high)}
                    </p>
                    <p className="mt-2 text-[0.78rem] leading-snug text-ink-muted">
                      Illustrative only. Excludes flights. Not based on live prices or availability.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="eyebrow text-ink-muted">A first draft of the days</h4>
                  <ol className="mt-4 border-l border-dashed border-ink/25">
                    {result.days.map((day) => (
                      <li key={day.label + day.title} className="relative pb-6 pl-6 last:pb-0">
                        <span aria-hidden="true" className="absolute top-1.5 -left-[5px] h-2.5 w-2.5 rounded-full border-2 border-paper bg-sky-deep" />
                        <p className="eyebrow text-[0.6rem] text-ink-muted">{day.label}</p>
                        <p className="mt-1 font-medium text-ink">{day.title}</p>
                        <p className="mt-1 text-[0.9rem] leading-snug text-ink-soft">{day.detail}</p>
                      </li>
                    ))}
                  </ol>
                  <a
                    href="#journey"
                    onClick={() => selectDestination(destination.id)}
                    className="group mt-8 inline-flex items-center gap-3 border-b border-ink pb-1.5 text-[0.95rem] font-medium text-ink"
                  >
                    Turn this into a quote
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </div>
  );
}
