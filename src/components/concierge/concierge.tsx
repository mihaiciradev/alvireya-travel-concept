"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { DestinationId } from "@/content/destinations";
import { curatedMatch, starters } from "@/lib/concierge/curated";
import type { ErrorCode, HistoryTurn, Section, StatusResponse, StreamEvent } from "@/lib/concierge/protocol";
import { WINDOW_EVENT, showInWindow } from "@/lib/events";
import { site } from "@/lib/site";
import { AlvireyaMark } from "../brand";
import { ArrowDown, ArrowRight, ArrowUpRight } from "../icons";
import { DestinationCards } from "./destination-cards";
import { RichText } from "./rich-text";

type Source = "live" | "mock" | "curated";

type Reply = {
  kind: "reply";
  id: number;
  question: string;
  source: Source;
  phase: "thinking" | "streaming" | "done" | "error";
  text: string;
  cards: DestinationId[];
  ask: string[];
  go: Section | null;
  error: ErrorCode | null;
  truncated: boolean;
  stopped: boolean;
};

type Entry = { kind: "visitor"; id: number; text: string } | Reply;

const sectionLinks: Record<Section, { href: string; label: string; external?: boolean }> = {
  destinations: { href: "#destinations", label: "Read the four destination stories" },
  planner: { href: "#planner", label: "Sketch it in the planner" },
  journey: { href: "#journey", label: "Turn it into a quote request" },
  behind: { href: "#behind", label: "See how this site is built" },
  contact: { href: site.studio.contactUrl, label: "Talk to WebbingHUB about a site like this", external: true },
};

const errorCopy: Record<ErrorCode, string> = {
  offline: "The live concierge is resting right now, so here are curated matches from the collection instead.",
  invalid: "That message couldn't be sent. Try rephrasing it in under 500 characters.",
  forbidden: "This session needs a quick refresh. Try sending again.",
  busy: "One reply at a time. The previous answer is still on its way.",
  burst: "That was quick. Give it a few seconds, then try again.",
  visitor_limit: "That's today's live replies used. Curated matches still work, and the planner below has no limits.",
  ip_limit: "This network has used today's live replies. Curated matches still work, and the planner below has no limits.",
  global_limit: "The live concierge has reached today's demo allowance. Curated matches are on until tomorrow.",
  budget: "The live concierge has reached today's demo allowance. Curated matches are on until tomorrow.",
  timeout: "The reply took too long, so we stopped waiting. Nothing was booked or saved.",
  upstream: "The AI service didn't answer this time. Give it a moment and try again.",
  refusal: "That's outside what this travel concierge can help with. Try asking about a trip.",
};

const fallbackCodes = new Set<ErrorCode>(["offline", "visitor_limit", "ip_limit", "global_limit", "budget"]);
const retryCodes = new Set<ErrorCode>(["forbidden", "busy", "burst", "timeout", "upstream"]);

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function Thinking() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [window.setTimeout(() => setStep(1), 1100), window.setTimeout(() => setStep(2), 2600)];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);
  const label = ["Reading your brief", "Charting a route", "Writing it down"][step];
  return (
    <div className="flex items-center gap-3 py-1 text-ink-muted">
      <svg viewBox="0 0 96 12" className="h-3 w-24 shrink-0 overflow-visible" aria-hidden="true">
        <path d="M2 6h92" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="2 5" strokeLinecap="round" />
        <circle cx="2" cy="6" r="2" fill="currentColor" fillOpacity="0.5" />
        <circle cx="94" cy="6" r="2" fill="currentColor" fillOpacity="0.5" />
        <circle className="route-dot" cx="2" cy="6" r="3.2" fill="var(--color-coral)" />
      </svg>
      <span className="eyebrow text-[0.6rem]">{label}</span>
    </div>
  );
}

function ReplyEntry({
  entry,
  activeWindow,
  latest,
  onAsk,
  onRetry,
}: {
  entry: Reply;
  activeWindow: DestinationId | null;
  latest: boolean;
  onAsk: (text: string) => void;
  onRetry: (text: string) => void;
}) {
  const curated = entry.source === "curated";
  const link = entry.go ? sectionLinks[entry.go] : null;
  return (
    <article className="concierge-entry" aria-busy={entry.phase === "thinking" || entry.phase === "streaming"}>
      <header className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <AlvireyaMark className="h-4 w-4 text-ink" />
        <span className="eyebrow text-[0.6rem] text-ink">ALVIREYA</span>
        <span
          className={`eyebrow rounded-full px-2 py-0.5 text-[0.54rem] ${curated ? "bg-gold/20 text-ink-soft" : "bg-ink/[0.06] text-ink-muted"}`}
        >
          {entry.phase === "error"
            ? "Notice"
            : curated
              ? "Curated match · not AI-generated"
              : entry.source === "mock"
                ? "Mock reply · dev only"
                : "Live AI · Claude Haiku"}
        </span>
      </header>

      <div className="mt-3 max-w-[38rem] text-[0.98rem] leading-[1.65] text-ink-soft">
        {entry.phase === "thinking" ? <Thinking /> : null}
        {entry.phase === "error" && entry.error ? (
          <div className="border-l-2 border-coral py-0.5 pl-4">
            <p>{errorCopy[entry.error]}</p>
            {retryCodes.has(entry.error) ? (
              <button
                type="button"
                onClick={() => onRetry(entry.question)}
                className="mt-2.5 inline-flex items-center gap-2 border-b border-ink/40 pb-0.5 text-[0.88rem] font-medium text-ink hover:border-ink"
              >
                Try again
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
        {entry.text ? <RichText text={entry.text} caret={entry.phase === "streaming"} /> : null}
        {entry.stopped ? <p className="mt-2 text-[0.82rem] text-ink-muted">Stopped.</p> : null}
        {entry.truncated ? <p className="mt-2 text-[0.82rem] text-ink-muted">Kept short on purpose. Ask for the rest.</p> : null}
      </div>

      {entry.cards.length ? <DestinationCards ids={entry.cards} active={activeWindow} /> : null}

      {entry.phase === "done" && link ? (
        <a
          href={link.href}
          {...(link.external ? { target: "_blank", rel: "noopener" } : {})}
          className="group mt-3 inline-flex items-center gap-2 text-[0.9rem] font-medium text-sky-deep underline-offset-4 hover:underline"
        >
          {link.label}
          {link.external ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </a>
      ) : null}

      {entry.phase === "done" && latest && entry.ask.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {entry.ask.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onAsk(item)}
              className="concierge-chip rounded-full border border-ink/20 bg-paper/70 px-3.5 py-1.5 text-[0.84rem] text-ink-soft transition-colors hover:border-ink hover:bg-ink hover:text-paper"
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function Concierge() {
  const inputId = useId();
  const noteId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const statusRef = useRef<Promise<StatusResponse> | null>(null);
  const idRef = useRef(0);
  const pinRef = useRef(false);
  const statusAtRef = useRef(0);
  const noticeRef = useRef(false);
  const reduced = useReducedMotion();

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [turns, setTurns] = useState<HistoryTurn[]>([]);
  const [proof, setProof] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [windowId, setWindowId] = useState<DestinationId | null>(null);
  const [placeholder, setPlaceholder] = useState(starters[0]);

  const maxChars = status?.maxChars ?? 500;
  const active = entries.length > 0;
  const live = status?.status === "ready";

  const loadStatus = useCallback((force = false) => {
    if (!statusRef.current || force) {
      statusAtRef.current = Date.now();
      statusRef.current = fetch("/api/concierge", { cache: "no-store", credentials: "same-origin" })
        .then((response) => (response.ok ? (response.json() as Promise<StatusResponse>) : Promise.reject()))
        .catch(() => ({ status: "offline", remaining: 0, limit: 0, maxChars: 500, mock: false }) as StatusResponse)
        .then((value) => {
          setStatus(value);
          return value;
        });
    }
    return statusRef.current;
  }, []);

  useEffect(() => {
    const run = () => void loadStatus();
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback(handle);
    }
    const timer = setTimeout(run, 1200);
    return () => clearTimeout(timer);
  }, [loadStatus]);

  useEffect(() => {
    const onShow = (event: Event) => setWindowId((event as CustomEvent<DestinationId | null>).detail);
    window.addEventListener(WINDOW_EVENT, onShow);
    return () => window.removeEventListener(WINDOW_EVENT, onShow);
  }, []);

  useEffect(() => {
    const hero = rootRef.current?.closest<HTMLElement>("[data-hero]");
    if (hero) hero.dataset.concierge = active ? "active" : "idle";
  }, [active]);

  useEffect(() => {
    if (reduced || active || input) return;
    let index = 0;
    let char = starters[0].length;
    let erasing = false;
    let pause = 0;
    const timer = window.setInterval(() => {
      if (document.activeElement === inputRef.current) return;
      if (pause > 0) {
        pause -= 1;
        return;
      }
      const target = starters[index];
      if (!erasing) {
        if (char < target.length) {
          char += 1;
          setPlaceholder(target.slice(0, char));
        } else {
          erasing = true;
          pause = 55;
        }
      } else if (char > 0) {
        char -= 2;
        setPlaceholder(target.slice(0, Math.max(char, 0)));
      } else {
        erasing = false;
        index = (index + 1) % starters.length;
        pause = 6;
      }
    }, 45);
    return () => window.clearInterval(timer);
  }, [reduced, active, input]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateReply = useCallback((id: number, change: (reply: Reply) => Partial<Reply>) => {
    setEntries((list) =>
      list.map((entry) => (entry.kind === "reply" && entry.id === id ? { ...entry, ...change(entry) } : entry)),
    );
  }, []);

  const follow = useCallback(() => {
    const log = logRef.current;
    if (!log || log.scrollHeight <= log.clientHeight + 4) return;
    const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 160;
    if (nearBottom || pinRef.current) {
      pinRef.current = false;
      log.scrollTo({ top: log.scrollHeight, behavior: reduced ? "auto" : "smooth" });
    }
  }, [reduced]);

  useEffect(follow, [entries, follow]);

  const curated = useCallback(
    (id: number, question: string, lead?: ErrorCode) => {
      const ids = curatedMatch(question, turns.map((turn) => turn.q).join(" "));
      const notice = lead && !noticeRef.current ? `${errorCopy[lead]}\n\n` : "";
      if (lead) noticeRef.current = true;
      updateReply(id, () => ({
        source: "curated",
        phase: "done",
        error: null,
        text: `${notice}Based on the words you used, these places from the ALVIREYA collection fit best. They come from a fixed keyword match, not from an AI model.`,
        cards: ids,
        ask: [],
        go: "planner",
      }));
      showInWindow(ids[0]);
      setAnnouncement(`Curated match: ${ids.join(" and ")}.`);
    },
    [turns, updateReply],
  );

  const send = useCallback(
    async (raw: string) => {
      const message = raw.trim().slice(0, maxChars);
      if (!message || busy) return;
      setBusy(true);
      setInput("");
      pinRef.current = true;
      const visitorId = ++idRef.current;
      const replyId = ++idRef.current;
      setEntries((list) => [
        ...list,
        { kind: "visitor", id: visitorId, text: message },
        {
          kind: "reply",
          id: replyId,
          question: message,
          source: "live",
          phase: "thinking",
          text: "",
          cards: [],
          ask: [],
          go: null,
          error: null,
          truncated: false,
          stopped: false,
        },
      ]);
      requestAnimationFrame(() => {
        if (window.innerWidth < 1024) {
          logRef.current?.lastElementChild?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
        }
      });

      try {
        const current = await loadStatus();
        if (current.status !== "ready") {
          await new Promise((resolve) => setTimeout(resolve, reduced ? 0 : 650));
          curated(replyId, message, current.status === "limit" ? "visitor_limit" : "offline");
          return;
        }
        const settle = 1200 - (Date.now() - statusAtRef.current);
        if (settle > 0) await new Promise((resolve) => setTimeout(resolve, settle));
        const source: Source = current.mock ? "mock" : "live";
        updateReply(replyId, () => ({ source }));

        const controller = new AbortController();
        abortRef.current = controller;
        const response = await fetch("/api/concierge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ message, history: turns, proof }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const payload = (await response.json().catch(() => ({ error: "upstream" }))) as { error?: ErrorCode };
          const code = payload.error && payload.error in errorCopy ? payload.error : "upstream";
          if (code === "forbidden") void loadStatus(true);
          if (fallbackCodes.has(code)) {
            setStatus((value) => (value ? { ...value, status: code === "offline" ? "offline" : "limit", remaining: 0 } : value));
            statusRef.current = null;
            curated(replyId, message, code);
          } else {
            updateReply(replyId, () => ({ phase: "error", error: code }));
            setAnnouncement(errorCopy[code]);
          }
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finished = false;
        let cards: DestinationId[] = [];
        const handle = (event: StreamEvent) => {
          switch (event.t) {
            case "text":
              updateReply(replyId, (reply) => ({ phase: "streaming", text: reply.text + event.v }));
              break;
            case "cards":
              cards = event.ids;
              updateReply(replyId, () => ({ cards: event.ids }));
              showInWindow(event.ids[0]);
              break;
            case "ask":
              updateReply(replyId, () => ({ ask: event.items }));
              break;
            case "go":
              updateReply(replyId, () => ({ go: event.to }));
              break;
            case "done": {
              finished = true;
              updateReply(replyId, () => ({ phase: "done", text: event.answer, truncated: event.truncated }));
              setTurns((list) => [...list, { q: message, a: event.answer, cards }]);
              setProof(event.proof);
              setStatus((value) =>
                value ? { ...value, remaining: event.remaining, status: event.remaining > 0 ? value.status : "limit" } : value,
              );
              if (event.remaining <= 0) statusRef.current = Promise.resolve({ ...current, status: "limit", remaining: 0 });
              setAnnouncement(event.answer);
              break;
            }
            case "error":
              finished = true;
              updateReply(replyId, () => ({ phase: "error", error: event.code, text: "", cards: [], ask: [] }));
              setAnnouncement(errorCopy[event.code]);
              break;
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              handle(JSON.parse(line) as StreamEvent);
            } catch {}
          }
        }
        if (!finished) updateReply(replyId, () => ({ phase: "error", error: "upstream", text: "" }));
      } catch (error) {
        if ((error as Error)?.name === "AbortError") {
          updateReply(replyId, (reply) => ({ phase: reply.text ? "done" : "error", stopped: true, error: reply.text ? null : "upstream" }));
        } else {
          updateReply(replyId, () => ({ phase: "error", error: "upstream", text: "" }));
        }
      } finally {
        abortRef.current = null;
        setBusy(false);
      }
    },
    [busy, curated, loadStatus, maxChars, proof, reduced, turns, updateReply],
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) {
      abortRef.current?.abort();
      return;
    }
    void send(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!busy) void send(input);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setEntries([]);
    setTurns([]);
    setProof("");
    showInWindow(null);
    inputRef.current?.focus();
  }

  const remaining = status?.remaining ?? null;
  const label = !status
    ? "Ask ALVIREYA"
    : live
      ? status.mock
        ? "Ask ALVIREYA · mock model"
        : "Ask ALVIREYA · Live AI"
      : "Curated matches · live AI resting";
  const latestReply = [...entries].reverse().find((entry) => entry.kind === "reply")?.id;

  return (
    <div ref={rootRef} className="concierge relative">
      {active ? (
        <div className="concierge-panel">
          <div className="flex items-center justify-between gap-4 border-b border-dashed border-ink/20 pb-3">
            <p className="eyebrow text-[0.62rem] text-ink-muted">
              Flight log<span className="hidden sm:inline"> · this conversation is not stored</span>
            </p>
            <button
              type="button"
              onClick={reset}
              className="eyebrow shrink-0 text-[0.62rem] whitespace-nowrap text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Start over
            </button>
          </div>
          <div
            ref={logRef}
            role="log"
            aria-label="Conversation with the ALVIREYA concierge"
            aria-live="off"
            className="concierge-log mt-5 space-y-7 lg:overflow-y-auto lg:overscroll-contain lg:pr-4"
          >
            {entries.map((entry) =>
              entry.kind === "visitor" ? (
                <div key={entry.id} className="concierge-entry flex gap-3">
                  <span aria-hidden="true" className="font-display text-[1.9rem] leading-[0.9] text-coral">
                    &ldquo;
                  </span>
                  <div>
                    <p className="sr-only">You said:</p>
                    <p className="font-display text-[1.22rem] leading-snug text-ink italic md:text-[1.35rem]">{entry.text}</p>
                  </div>
                </div>
              ) : (
                <ReplyEntry
                  key={entry.id}
                  entry={entry}
                  activeWindow={windowId}
                  latest={entry.id === latestReply && live}
                  onAsk={(text) => void send(text)}
                  onRetry={(text) => void send(text)}
                />
              ),
            )}
          </div>
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        aria-describedby={noteId}
        onFocus={() => void loadStatus()}
        onPointerEnter={() => void loadStatus()}
        className={`concierge-ticket group/ticket relative flex rounded-[1.7rem] bg-[#fbf8f2] shadow-[0_30px_60px_-38px_rgba(16,32,47,0.55),0_1px_0_rgba(255,255,255,0.8)_inset] ring-1 ring-ink/10 transition-shadow focus-within:ring-ink/30 ${active ? "mt-6 max-lg:sticky max-lg:bottom-3 max-lg:z-40 max-lg:shadow-[0_24px_50px_-20px_rgba(16,32,47,0.45)]" : ""}`}
      >
        <div className="min-w-0 flex-1 px-5 pt-4 pb-3.5 md:px-7 md:pt-5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={inputId} className="eyebrow flex items-center gap-2 text-[0.6rem] text-ink-muted">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${live ? "concierge-live bg-coral" : status ? "bg-gold" : "bg-ink/25"}`}
              />
              {label}
            </label>
            {live && remaining !== null ? (
              <span aria-live="polite" className="eyebrow shrink-0 text-[0.56rem] text-ink-muted">
                {remaining} of {status.limit} today
              </span>
            ) : null}
          </div>
          <textarea
            ref={inputRef}
            id={inputId}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={maxChars}
            rows={1}
            enterKeyHint="send"
            autoComplete="off"
            placeholder={active ? "Ask a follow-up, or change the brief" : placeholder}
            aria-label="Describe the trip you have in mind"
            className="concierge-input mt-2 block w-full resize-none bg-transparent font-display text-[1.18rem] leading-snug text-ink outline-none placeholder:text-ink/40 md:text-[1.55rem]"
          />
          {input.length > maxChars - 100 ? (
            <p className="mt-1 text-right text-[0.72rem] text-ink-muted" aria-live="polite">
              {maxChars - input.length} characters left
            </p>
          ) : null}
        </div>
        <div className="concierge-stub relative flex w-[4.6rem] shrink-0 flex-col items-center justify-center gap-1.5 border-l border-dashed border-ink/25 md:w-[5.5rem]">
          <button
            type="submit"
            disabled={!busy && !input.trim()}
            aria-label={busy ? "Stop the reply" : "Send"}
            className="grid h-12 w-12 place-items-center rounded-full bg-ink text-paper transition-[background-color,transform,opacity] duration-300 hover:bg-coral-deep enabled:active:scale-95 disabled:opacity-35 md:h-14 md:w-14"
          >
            {busy ? (
              <span className="h-3.5 w-3.5 rounded-[3px] bg-paper" />
            ) : (
              <ArrowRight className="h-5 w-5 -rotate-45 transition-transform duration-300 group-focus-within/ticket:rotate-0" />
            )}
          </button>
          <span aria-hidden="true" className="eyebrow text-[0.5rem] text-ink-muted">
            {busy ? "Stop" : "Send"}
          </span>
        </div>
      </form>

      {!active ? (
        <div className="mt-4 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          <span className="eyebrow mr-1 block text-[0.58rem] text-ink-muted sm:inline">Or start with</span>
          <div className="concierge-cards -mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1 sm:contents">
            {starters.slice(0, 3).map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => void send(starter)}
                className="concierge-chip shrink-0 rounded-full border border-ink/15 bg-paper/60 px-3.5 py-1.5 text-[0.82rem] text-ink-soft transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <p id={noteId} className="mt-4 max-w-xl text-[0.74rem] leading-relaxed text-ink-muted">
        {live || !status
          ? "A live AI demo on Claude Haiku, limited to a few replies a day. Ideas are illustrative: no live prices, availability or bookings. Please don't share personal details."
          : "Live AI is paused, so matches come from a fixed keyword list, not a model. Nothing you type is stored."}
      </p>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
