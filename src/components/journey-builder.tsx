"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { destinations, getDestination, type DestinationId } from "@/content/destinations";
import { commonExtras, planningFee, signatureExtra, stays, type Extra } from "@/content/journey";
import { DESTINATION_EVENT } from "@/lib/events";
import { ArrowRight } from "./icons";

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

type Line = { label: string; detail: string; amount: number };

function Stepper({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div role="group" aria-label={label}>
      <p className="eyebrow text-[0.62rem] text-ink-muted">{label}</p>
      <div className="mt-3 flex w-fit items-center gap-2 rounded-full border border-ink/15 bg-paper p-1.5">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="grid h-10 w-10 place-items-center rounded-full text-xl text-ink transition-colors hover:bg-ink/10 disabled:opacity-30"
        >
          −
        </button>
        <output aria-live="polite" className="w-24 text-center text-[0.95rem] text-ink">
          {unit(value)}
        </output>
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="grid h-10 w-10 place-items-center rounded-full text-xl text-ink transition-colors hover:bg-ink/10 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div className="border-t border-ink/12 pt-7 first:border-none first:pt-0">
      <h3 className="flex items-baseline gap-4">
        <span className="eyebrow text-coral-deep">{number}</span>
        <span className="font-display text-[1.7rem] leading-none text-ink">{title}</span>
      </h3>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function JourneyBuilder() {
  const [destinationId, setDestinationId] = useState<DestinationId>("kyoto");
  const [stayId, setStayId] = useState(stays.kyoto[0].id);
  const [nights, setNights] = useState(6);
  const [travelers, setTravelers] = useState(2);
  const [extras, setExtras] = useState<string[]>(["signature", "transfers"]);
  const [requestState, setRequestState] = useState<"form" | "sent">("form");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const onSelect = (event: Event) => {
      const id = (event as CustomEvent<DestinationId>).detail;
      setDestinationId(id);
      setStayId(stays[id][0].id);
    };
    window.addEventListener(DESTINATION_EVENT, onSelect);
    return () => window.removeEventListener(DESTINATION_EVENT, onSelect);
  }, []);

  const destination = getDestination(destinationId);
  const stayOptions = stays[destinationId];
  const stay = stayOptions.find((item) => item.id === stayId) ?? stayOptions[0];
  const availableExtras: Extra[] = [signatureExtra[destinationId], ...commonExtras];
  const rooms = Math.ceil(travelers / 2);
  const stayTotal = stay.nightly * nights * rooms;

  const lines: Line[] = [
    {
      label: stay.name,
      detail: `${rooms} ${rooms === 1 ? "room" : "rooms"} × ${nights} nights × ${euro.format(stay.nightly)}`,
      amount: stayTotal,
    },
    ...availableExtras
      .filter((extra) => extras.includes(extra.id))
      .map((extra) => {
        if (extra.per === "person") {
          return { label: extra.label, detail: `${travelers} × ${euro.format(extra.price)}`, amount: extra.price * travelers };
        }
        if (extra.per === "stay-percent") {
          return { label: extra.label, detail: `${extra.price}% of the stay`, amount: Math.round((stayTotal * extra.price) / 100) };
        }
        return { label: extra.label, detail: "Per group", amount: extra.price };
      }),
    { label: "Planning and support", detail: "Shown up front, never hidden", amount: planningFee },
  ];

  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  function chooseDestination(id: DestinationId) {
    setDestinationId(id);
    setStayId(stays[id][0].id);
  }

  function toggleExtra(id: string) {
    setExtras((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function openRequest() {
    setRequestState("form");
    dialogRef.current?.showModal();
  }

  function onRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setRequestState("sent");
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
      <div className="space-y-12 lg:col-span-7">
        <Step number="01" title="Choose a place">
          <div role="radiogroup" aria-label="Destination" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {destinations.map((item) => (
              <label
                key={item.id}
                className="cursor-pointer rounded-2xl border border-ink/15 bg-paper px-4 py-3.5 transition-colors hover:border-ink/40 has-checked:border-ink has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-coral-deep"
              >
                <input
                  type="radio"
                  name="journey-destination"
                  value={item.id}
                  checked={destinationId === item.id}
                  onChange={() => chooseDestination(item.id)}
                  className="sr-only"
                />
                <span className="block font-display text-xl leading-tight">{item.name}</span>
                <span className="mt-0.5 block text-[0.78rem] opacity-70">{item.country}</span>
              </label>
            ))}
          </div>
        </Step>

        <Step number="02" title="Compare stays">
          <div role="radiogroup" aria-label={`Stays in ${destination.name}`} className="divide-y divide-ink/10 overflow-hidden rounded-3xl border border-ink/12 bg-paper">
            {stayOptions.map((item) => (
              <label
                key={item.id}
                className="grid cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-4 p-5 transition-colors hover:bg-paper-deep/50 has-checked:bg-mist has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-coral-deep md:p-6"
              >
                <input
                  type="radio"
                  name="journey-stay"
                  value={item.id}
                  checked={stay.id === item.id}
                  onChange={() => setStayId(item.id)}
                  className="mt-1.5 h-4 w-4 accent-ink"
                />
                <span>
                  <span className="block font-display text-[1.35rem] leading-tight text-ink">{item.name}</span>
                  <span className="mt-1 block text-[0.85rem] text-ink-soft">
                    {item.kind} · {item.setting}
                  </span>
                  <span className="mt-2 block text-[0.8rem] text-ink-muted">Best for: {item.bestFor}</span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-[1.35rem] text-ink">{euro.format(item.nightly)}</span>
                  <span className="eyebrow block text-[0.58rem] text-ink-muted">per room / night</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-[0.8rem] text-ink-muted">Fictional properties and example rates. No live availability is checked.</p>
        </Step>

        <Step number="03" title="Shape the trip">
          <div className="flex flex-wrap gap-8">
            <Stepper label="Nights" value={nights} min={3} max={12} unit={(value) => `${value} nights`} onChange={setNights} />
            <Stepper
              label="Travelers"
              value={travelers}
              min={1}
              max={6}
              unit={(value) => `${value} ${value === 1 ? "person" : "people"}`}
              onChange={setTravelers}
            />
          </div>
          <fieldset className="mt-8">
            <legend className="eyebrow text-[0.62rem] text-ink-muted">Add to the journey</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {availableExtras.map((extra) => (
                <label
                  key={extra.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/12 bg-paper p-4 transition-colors hover:border-ink/35 has-checked:border-ink/60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-coral-deep"
                >
                  <input
                    type="checkbox"
                    checked={extras.includes(extra.id)}
                    onChange={() => toggleExtra(extra.id)}
                    className="mt-1 h-4 w-4 accent-ink"
                  />
                  <span>
                    <span className="block text-[0.95rem] font-medium text-ink">{extra.label}</span>
                    <span className="block text-[0.8rem] text-ink-muted">{extra.detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Step>
      </div>

      <aside aria-labelledby="quote-title" className="lg:col-span-5">
        <div className="sticky top-24 overflow-hidden rounded-[2rem] bg-ink text-paper on-dark">
          <div className="flex items-start justify-between gap-4 p-7 pb-5 md:p-9 md:pb-6">
            <div>
              <p className="eyebrow text-gold">04 · Your quote</p>
              <h3 id="quote-title" className="mt-3 font-display text-[2rem] leading-none">
                {destination.name}
              </h3>
              <p className="mt-2 text-[0.85rem] text-paper/65">
                {nights} nights · {travelers} {travelers === 1 ? "traveler" : "travelers"} · {stay.name}
              </p>
            </div>
            <span className="eyebrow shrink-0 rounded-full border border-gold/50 px-2.5 py-1 text-[0.55rem] text-gold">
              Example
            </span>
          </div>

          <div className="hairline mx-7 text-paper md:mx-9" />

          <ul className="space-y-4 px-7 py-6 md:px-9">
            {lines.map((line) => (
              <li key={line.label} className="flex items-start justify-between gap-6">
                <span>
                  <span className="block text-[0.95rem]">{line.label}</span>
                  <span className="block text-[0.78rem] text-paper/55">{line.detail}</span>
                </span>
                <span className="font-mono text-[0.92rem] tabular-nums">{euro.format(line.amount)}</span>
              </li>
            ))}
          </ul>

          <div className="hairline mx-7 text-paper md:mx-9" />

          <div className="px-7 py-6 md:px-9">
            <div className="flex items-end justify-between gap-6">
              <span className="eyebrow text-paper/70">Example total</span>
              <span className="font-display text-[2.6rem] leading-none tabular-nums" aria-live="polite">
                {euro.format(total)}
              </span>
            </div>
            <p className="mt-3 text-[0.78rem] leading-relaxed text-paper/55">
              {euro.format(Math.round(total / travelers))} per person. Flights and local taxes not included.
              Fictional prices for demonstration, not an offer.
            </p>

            <button
              type="button"
              onClick={openRequest}
              className="group mt-7 flex h-14 w-full items-center justify-between rounded-full bg-paper pr-2 pl-6 text-[0.98rem] font-medium text-ink transition-colors hover:bg-white"
            >
              Request this journey
              <span className="grid h-10 w-10 place-items-center rounded-full bg-coral text-ink transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-5 w-5" />
              </span>
            </button>
            <ol className="mt-6 grid grid-cols-3 gap-3 text-[0.72rem] leading-snug text-paper/60">
              <li>
                <span className="block font-mono text-gold">1</span>A specialist reviews it
              </li>
              <li>
                <span className="block font-mono text-gold">2</span>Live prices confirmed
              </li>
              <li>
                <span className="block font-mono text-gold">3</span>You approve, then book
              </li>
            </ol>
          </div>
        </div>
      </aside>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,34rem)] rounded-[2rem] bg-paper p-0 text-ink shadow-2xl"
      >
        <div className="p-7 md:p-9">
          {requestState === "form" ? (
            <form onSubmit={onRequest}>
              <p className="eyebrow text-ink-muted">Concept demo</p>
              <h3 id={titleId} className="mt-3 font-display text-[2rem] leading-tight">
                Request {destination.name}
              </h3>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-soft">
                In a real build, this short form replaces a long email thread. Nothing you type here is
                sent or stored.
              </p>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-[0.85rem] font-medium">First name</span>
                  <input
                    name="name"
                    autoComplete="off"
                    className="mt-1.5 block h-12 w-full rounded-xl border border-ink/20 bg-white/60 px-4 text-[0.95rem] focus-visible:border-ink"
                  />
                </label>
                <label className="block">
                  <span className="text-[0.85rem] font-medium">Preferred month</span>
                  <select
                    name="month"
                    defaultValue="flexible"
                    className="mt-1.5 block h-12 w-full rounded-xl border border-ink/20 bg-white/60 px-4 text-[0.95rem]"
                  >
                    <option value="flexible">I&rsquo;m flexible</option>
                    {["March", "April", "May", "June", "September", "October", "November"].map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[0.85rem] font-medium">Anything we should know?</span>
                  <textarea
                    name="notes"
                    rows={3}
                    className="mt-1.5 block w-full rounded-xl border border-ink/20 bg-white/60 px-4 py-3 text-[0.95rem]"
                  />
                </label>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button type="submit" className="h-12 rounded-full bg-ink px-6 text-[0.95rem] font-medium text-paper hover:bg-night">
                  Send request (demo)
                </button>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="h-12 rounded-full px-5 text-[0.95rem] text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div role="status">
              <p className="eyebrow text-ink-muted">Nothing was sent</p>
              <h3 id={titleId} className="mt-3 font-display text-[2rem] leading-tight">
                This is where a real request would land.
              </h3>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
                In a production build, your agency would receive this request in its CRM with the full
                quote attached, the traveler would get an instant confirmation, and a specialist would
                be assigned to follow up.
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => dialogRef.current?.close()}
                className="mt-7 h-12 rounded-full bg-ink px-6 text-[0.95rem] font-medium text-paper hover:bg-night"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
