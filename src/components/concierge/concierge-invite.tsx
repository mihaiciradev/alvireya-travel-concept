"use client";

import Image from "next/image";
import { Suspense, lazy, useCallback, useRef, useState, type FormEvent } from "react";
import { disclosure, scenarios, type Suggestion } from "@/content/concierge";
import { getDestination, type DestinationId } from "@/content/destinations";
import { ArrowRight } from "../icons";

const Lounge = lazy(() => import("./concierge-lounge"));

export type LoungeRequest = { id: number; input: string | Suggestion };
export type LoungeSummary = { turns: number; destination: DestinationId | null };

export function ConciergeInvite() {
  const originRef = useRef<HTMLFormElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [request, setRequest] = useState<LoungeRequest | null>(null);
  const [summary, setSummary] = useState<LoungeSummary>({ turns: 0, destination: null });

  const prefetch = () => void import("./concierge-lounge");
  const close = useCallback(() => setOpen(false), []);

  function launch(input?: string | Suggestion) {
    if (input) setRequest({ id: Date.now(), input });
    setMounted(true);
    setOpen(true);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    launch(text || undefined);
    setDraft("");
  }

  const resume = summary.turns > 0 ? (summary.destination ? getDestination(summary.destination) : null) : null;

  return (
    <div className="concierge-invite" onPointerEnter={prefetch} onFocus={prefetch}>
      <form
        ref={originRef}
        onSubmit={onSubmit}
        className="invite-field group relative flex items-center gap-3 rounded-full bg-[#fbf8f2] py-2 pr-2 pl-5 shadow-[0_24px_50px_-30px_rgba(16,32,47,0.5)] ring-1 ring-ink/10 transition-shadow focus-within:ring-ink/35 md:pl-6"
      >
        <label htmlFor="concierge-invite" className="sr-only">
          Describe the holiday you are dreaming of
        </label>
        <span aria-hidden="true" className="invite-pulse relative grid h-2 w-2 shrink-0 place-items-center rounded-full bg-coral" />
        <input
          id="concierge-invite"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={280}
          autoComplete="off"
          enterKeyHint="go"
          placeholder="Describe your dream holiday"
          className="min-w-0 flex-1 bg-transparent py-2 font-display text-[1.08rem] text-ink italic outline-none placeholder:text-ink/45 md:text-[1.22rem]"
        />
        <button
          type="submit"
          aria-label="Open the concierge"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper transition-colors hover:bg-coral-deep md:h-12 md:w-12"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>

      <div className="mt-5">
        <span className="eyebrow block pl-1 text-[0.58rem] text-ink-muted">Or begin with a feeling</span>
        <div className="invite-moods -mr-5 mt-2.5 flex gap-1.5 overflow-x-auto pr-5 sm:mr-0 sm:grid sm:max-w-[30rem] sm:grid-cols-3 sm:overflow-visible sm:pr-0">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => launch({ kind: "scenario", id: scenario.id, label: scenario.prompt })}
              className="group flex shrink-0 items-center gap-2 rounded-full border border-ink/12 bg-paper/70 py-1 pr-3.5 pl-1 text-[0.82rem] text-ink-soft transition-colors hover:border-ink hover:bg-ink hover:text-paper"
            >
              <span className="relative h-6 w-6 overflow-hidden rounded-full">
                <Image src={scenario.image.src}
                style={{ objectPosition: scenario.image.position }} alt="" fill sizes="24px" quality={55} className="object-cover" />
              </span>
              {scenario.label}
            </button>
          ))}
        </div>
      </div>

      {resume || summary.turns > 0 ? (
        <button
          type="button"
          onClick={() => launch()}
          className="group mt-4 inline-flex items-center gap-2 text-[0.88rem] font-medium text-sky-deep underline-offset-4 hover:underline"
        >
          Continue your conversation{resume ? ` · ${resume.name}` : ""}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      ) : null}

      <p className="mt-4 max-w-md text-[0.74rem] leading-relaxed text-ink-muted">{disclosure}</p>

      {mounted ? (
        <Suspense fallback={null}>
          <Lounge open={open} originRef={originRef} request={request} onClose={close} onSummary={setSummary} />
        </Suspense>
      ) : null}
    </div>
  );
}
