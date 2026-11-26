"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { disclosure, type Suggestion } from "@/content/concierge";
import type { DestinationId } from "@/content/destinations";
import { respond, welcome, type Profile, type Turn } from "@/lib/concierge";
import { selectDestination, showInWindow } from "@/lib/events";
import { ArrowRight } from "../icons";
import type { LoungeRequest, LoungeSummary } from "./concierge-invite";
import { LoungeReply } from "./lounge-reply";
import { LoungeStage } from "./lounge-stage";

type Props = {
  open: boolean;
  originRef: RefObject<HTMLElement | null>;
  request: LoungeRequest | null;
  onClose: () => void;
  onSummary: (summary: LoungeSummary) => void;
};

const greeting = welcome();
const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";

function windowFrom(origin: HTMLElement | null) {
  const rect = origin?.getBoundingClientRect();
  if (!rect) return "inset(40% 30% 40% 30% round 2rem)";
  const right = window.innerWidth - rect.right;
  const bottom = window.innerHeight - rect.bottom;
  return `inset(${rect.top}px ${right}px ${bottom}px ${rect.left}px round ${rect.height / 2}px)`;
}

function prefersReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function ConciergeLounge({ open, originRef, request, onClose, onSummary }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handled = useRef<number | null>(null);
  const timer = useRef<number | null>(null);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [profile, setProfile] = useState<Profile>({});
  const [pending, setPending] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [focus, setFocus] = useState<DestinationId | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const reduced = prefersReduced();

    if (open && !dialog.open) {
      dialog.showModal();
      dialog.dataset.state = "open";
      if (reduced) dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      else
        dialog.animate([{ clipPath: windowFrom(originRef.current) }, { clipPath: "inset(0px 0px 0px 0px round 0px)" }], {
          duration: 950,
          easing: EASE,
        });
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        inputRef.current?.focus({ preventScroll: true });
      }
    }

    if (!open && dialog.open) {
      dialog.dataset.state = "closing";
      const animation = reduced
        ? dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" })
        : dialog.animate([{ clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: windowFrom(originRef.current) }], {
            duration: 700,
            easing: EASE,
            fill: "forwards",
          });
      animation.onfinish = () => {
        dialog.close();
        animation.cancel();
        dialog.dataset.state = "closed";
        if (document.activeElement === document.body) {
          originRef.current?.querySelector("input")?.focus({ preventScroll: true });
        }
      };
    }
  }, [open, originRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [onClose]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    onSummary({ turns: turns.length, destination: focus });
  }, [turns.length, focus, onSummary]);

  useEffect(() => {
    if (focus) showInWindow(focus);
  }, [focus]);

  const reveal = useCallback(() => {
    requestAnimationFrame(() => {
      const scroller = scrollRef.current;
      const last = scroller?.querySelector<HTMLElement>("[data-turn]:last-of-type");
      if (!scroller || !last) return;
      scroller.scrollTo({ top: last.offsetTop - 24, behavior: prefersReduced() ? "auto" : "smooth" });
    });
  }, []);

  const ask = useCallback(
    (input: string | Suggestion) => {
      if (pending) return;
      if (typeof input !== "string" && input.kind === "quote") {
        selectDestination(input.destination);
        setFocus(input.destination);
        onClose();
        window.setTimeout(() => document.getElementById("journey")?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth" }), 760);
        return;
      }
      const result = respond(input, profile);
      setPending(result.said);
      setDraft("");
      reveal();
      timer.current = window.setTimeout(
        () => {
          setTurns((list) => [...list, result]);
          setProfile(result.profile);
          if (result.reply.focus) setFocus(result.reply.focus);
          setPending(null);
          setAnnouncement(`${result.reply.headline} ${result.reply.body.join(" ")}`);
          reveal();
        },
        prefersReduced() ? 0 : 850,
      );
    },
    [onClose, pending, profile, reveal],
  );

  const askRef = useRef(ask);
  useEffect(() => {
    askRef.current = ask;
  }, [ask]);

  useEffect(() => {
    if (!open || !request || handled.current === request.id) return;
    const timeout = window.setTimeout(() => {
      handled.current = request.id;
      askRef.current(request.input);
    }, prefersReduced() ? 0 : 650);
    return () => window.clearTimeout(timeout);
  }, [open, request]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.trim()) ask(draft);
  }

  const latest = turns.length - 1;

  return (
    <dialog ref={dialogRef} className="concierge-dialog" aria-labelledby="lounge-title" data-state="closed">
      <div className="relative grid h-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(13rem,34svh)_minmax(0,1fr)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:grid-rows-1">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the concierge"
          className="lounge-close group absolute top-4 right-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-paper text-ink shadow-[0_10px_30px_-10px_rgba(16,32,47,0.5)] ring-1 ring-ink/10 transition-colors hover:bg-ink hover:text-paper lg:top-6 lg:right-8 lg:shadow-none"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
            <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <LoungeStage focus={focus} profile={profile} />

        <section className="lounge-column relative flex min-h-0 flex-col bg-paper">
          <header className="flex items-center justify-between gap-4 px-6 pt-5 md:px-12 lg:pt-8">
            <h2 id="lounge-title" className="eyebrow flex items-center gap-2.5 text-[0.62rem] text-ink-muted">
              ALVIREYA Concierge
              <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[0.54rem] text-ink-soft">Demo</span>
            </h2>
            <span aria-hidden="true" className="eyebrow mr-14 hidden text-[0.56rem] text-ink-muted lg:inline">
              Esc to close
            </span>
          </header>

          <div ref={scrollRef} className="lounge-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-[44rem] px-6 pt-6 pb-[45svh] md:px-12 lg:pt-10">
              <LoungeReply reply={greeting} latest={false} focus={focus} onSuggest={ask} onFocus={setFocus} />

              {turns.map((turn, index) => (
                <div key={index} data-turn className="mt-14 border-t border-dashed border-ink/15 pt-10">
                  <p className="visitor-line fade-rise font-display text-[clamp(1.3rem,2.4vw,1.7rem)] leading-snug text-ink-soft italic">
                    <span className="sr-only">You said: </span>
                    <span aria-hidden="true" className="mr-1 text-coral not-italic">&ldquo;</span>
                    {turn.said}
                  </p>
                  <div className="mt-8">
                    <LoungeReply reply={turn.reply} latest={index === latest && !pending} focus={focus} onSuggest={ask} onFocus={setFocus} />
                  </div>
                </div>
              ))}

              {pending ? (
                <div data-turn className="mt-14 border-t border-dashed border-ink/15 pt-10">
                  <p className="visitor-line fade-rise font-display text-[clamp(1.3rem,2.4vw,1.7rem)] leading-snug text-ink-soft italic">
                    <span aria-hidden="true" className="mr-1 text-coral not-italic">&ldquo;</span>
                    {pending}
                  </p>
                  <div className="mt-8 flex items-center gap-3 text-ink-muted" role="status">
                    <svg viewBox="0 0 96 12" className="h-3 w-24 overflow-visible" aria-hidden="true">
                      <path d="M2 6h92" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="2 5" strokeLinecap="round" />
                      <circle className="route-dot" cx="2" cy="6" r="3.2" fill="var(--color-coral)" />
                    </svg>
                    <span className="eyebrow text-[0.58rem]">Finding the right places</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <footer className="border-t border-ink/10 bg-paper px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-12">
            <form onSubmit={onSubmit} className="mx-auto flex max-w-[44rem] items-center gap-3">
              <label htmlFor="lounge-input" className="sr-only">
                Tell the concierge about your trip
              </label>
              <input
                ref={inputRef}
                id="lounge-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={280}
                autoComplete="off"
                enterKeyHint="send"
                placeholder={turns.length ? "Tell me more, or change the brief" : "A week somewhere warm, for two, in May"}
                className="min-w-0 flex-1 border-b border-ink/20 bg-transparent py-2.5 font-display text-[1.1rem] text-ink italic outline-none transition-colors placeholder:text-ink/40 focus:border-ink md:text-[1.25rem]"
              />
              <button
                type="submit"
                disabled={!draft.trim() || Boolean(pending)}
                aria-label="Send"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-paper transition-[background-color,opacity] hover:bg-coral-deep disabled:opacity-30"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
            <p className="mx-auto mt-3 max-w-[44rem] text-[0.72rem] leading-relaxed text-ink-muted">{disclosure}</p>
          </footer>

          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>
        </section>
      </div>
    </dialog>
  );
}
