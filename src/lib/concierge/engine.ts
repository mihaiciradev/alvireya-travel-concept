import { destinations } from "@/content/destinations";
import { availability, type ConciergeConfig } from "./config";
import { DirectiveFilter } from "./directives";
import {
  VISITOR_COOKIE,
  VISITOR_MAX_AGE,
  clientIp,
  hashIp,
  issueVisitor,
  newToken,
  proofFor,
  readVisitor,
  verifyProof,
  type Turn,
} from "./identity";
import type { ErrorCode, StatusResponse, StreamEvent } from "./protocol";
import { systemPrompt } from "./prompt";
import { quotaKeys, type QuotaStore } from "./quota";

export type ModelMessage = { role: "user" | "assistant"; content: string };

export type ModelRun = {
  text: AsyncIterable<string>;
  final: () => Promise<{ inputTokens: number; outputTokens: number; stopReason: string | null }>;
};

export interface ModelClient {
  stream(
    params: { model: string; system: string; messages: ModelMessage[]; maxTokens: number },
    signal: AbortSignal,
  ): ModelRun;
}

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly billed: boolean,
    readonly timeout = false,
  ) {
    super(message);
  }
}

export type Deps = {
  config: ConciergeConfig;
  store: QuotaStore | null;
  model: ModelClient | null;
  now?: () => number;
  log?: (message: string) => void;
};

const MAX_BODY = 16 * 1024;
const MAX_ANSWER = 2400;
const DAY = 86400;
const GLOBAL_TTL = 2 * DAY;
const BURST_WINDOW = 60;
const destinationIds = new Set<string>(destinations.map((destination) => destination.id));

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

function fail(code: ErrorCode, status: number, headers: Record<string, string> = {}) {
  return json({ error: code }, status, headers);
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

function visitorCookie(value: string, secure: boolean) {
  return `${VISITOR_COOKIE}=${value}; Path=/api/concierge; Max-Age=${VISITOR_MAX_AGE}; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
}

function sameOrigin(request: Request, config: ConciergeConfig) {
  const origin = request.headers.get("origin");
  if (!origin || !config.allowedOrigins.includes(origin)) return false;
  const site = request.headers.get("sec-fetch-site");
  return !site || site === "same-origin";
}

const botAgents = /curl|wget|python|httpie|go-http|java\/|okhttp|node-fetch|axios|libwww|scrapy|headless|bot\b|spider|crawler/i;

function looksAutomated(request: Request) {
  const agent = request.headers.get("user-agent") ?? "";
  return agent.length < 12 || botAgents.test(agent);
}

function cleanInput(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‏‪-‮⁦-⁩]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type Parsed = { message: string; turns: Turn[]; proof: string };

function parseBody(raw: unknown, config: ConciergeConfig): Parsed | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const allowed = new Set(["message", "history", "proof", "website"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return null;
  if (body.website !== undefined && body.website !== "") return null;
  if (typeof body.message !== "string" || typeof body.proof !== "string" || !Array.isArray(body.history)) return null;
  if (body.proof.length > 64 || body.history.length > config.limits.turns) return null;

  const message = cleanInput(body.message);
  if (!message || message.length > config.limits.messageChars) return null;

  const turns: Turn[] = [];
  for (const item of body.history) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const turn = item as Record<string, unknown>;
    if (Object.keys(turn).some((key) => !["q", "a", "cards"].includes(key))) return null;
    if (typeof turn.q !== "string" || typeof turn.a !== "string" || !Array.isArray(turn.cards)) return null;
    if (turn.q.length > config.limits.messageChars || turn.a.length > MAX_ANSWER || turn.cards.length > 3) return null;
    if (!turn.cards.every((id) => typeof id === "string" && destinationIds.has(id))) return null;
    turns.push({ q: turn.q, a: turn.a, cards: turn.cards as string[] });
  }
  return { message, turns, proof: body.proof };
}

export function estimateTokens(system: string, messages: ModelMessage[]) {
  const chars = system.length + messages.reduce((sum, message) => sum + message.content.length + 12, 0);
  return Math.ceil(chars / 2) + 64;
}

function buildMessages(turns: Turn[], message: string): ModelMessage[] {
  const messages: ModelMessage[] = [];
  for (const turn of turns) {
    messages.push({ role: "user", content: turn.q });
    const cards = turn.cards.length ? `\n[[cards: ${turn.cards.join(", ")}]]` : "";
    messages.push({ role: "assistant", content: `${turn.a}${cards}` });
  }
  messages.push({ role: "user", content: message });
  return messages;
}

export async function handleStatus(request: Request, deps: Deps): Promise<Response> {
  const { config, store } = deps;
  const now = deps.now?.() ?? Date.now();
  const base = { limit: config.limits.visitorPerDay, maxChars: config.limits.messageChars, mock: config.mock };
  if (availability(config) !== "ready" || !store || !config.secret) {
    return json({ ...base, status: "offline", remaining: 0 } satisfies StatusResponse, 200);
  }

  const headers: Record<string, string> = {};
  let visitor = readVisitor(config.secret, readCookie(request, VISITOR_COOKIE));
  if (!visitor) {
    const issued = issueVisitor(config.secret, now);
    visitor = issued.visitor;
    headers["Set-Cookie"] = visitorCookie(issued.cookie, new URL(request.url).protocol === "https:");
  }

  try {
    const keys = quotaKeys(visitor.id, hashIp(config.secret, clientIp(request.headers)), new Date(now), config.keyPrefix);
    const usage = await store.usage(keys);
    const remaining = Math.max(
      0,
      Math.min(config.limits.visitorPerDay - usage.visitor, config.limits.ipPerDay - usage.ip),
    );
    const exhausted =
      usage.global >= config.limits.globalPerDay || usage.spendNano >= config.budget.dailyNanoUsd || remaining === 0;
    return json({ ...base, status: exhausted ? "limit" : "ready", remaining } satisfies StatusResponse, 200, headers);
  } catch {
    deps.log?.("concierge: quota store unavailable");
    return json({ ...base, status: "offline", remaining: 0 } satisfies StatusResponse, 200, headers);
  }
}

export async function handleChat(request: Request, deps: Deps): Promise<Response> {
  const { config, store, model } = deps;
  const now = deps.now?.() ?? Date.now();
  if (availability(config) !== "ready" || !store || !model || !config.secret) return fail("offline", 503);
  const secret = config.secret;

  if (!sameOrigin(request, config) || looksAutomated(request)) return fail("forbidden", 403);
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return fail("invalid", 415);
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY) return fail("invalid", 413);

  const visitor = readVisitor(secret, readCookie(request, VISITOR_COOKIE));
  if (!visitor) return fail("forbidden", 403);
  if (now - visitor.issuedAt < config.minDwellMs) return fail("burst", 429, { "Retry-After": "2" });

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail("invalid", 400);
  }
  if (raw.length > MAX_BODY) return fail("invalid", 413);

  let parsed: Parsed | null = null;
  try {
    parsed = parseBody(JSON.parse(raw), config);
  } catch {
    parsed = null;
  }
  if (!parsed) return fail("invalid", 400);
  if (!verifyProof(secret, visitor.id, parsed.turns, parsed.proof)) return fail("invalid", 400);

  const keys = quotaKeys(visitor.id, hashIp(secret, clientIp(request.headers)), new Date(now), config.keyPrefix);
  const provisionalSystem = systemPrompt(config.limits.visitorPerDay);
  let turns = parsed.turns;
  let messages = buildMessages(turns, parsed.message);
  while (estimateTokens(provisionalSystem, messages) > config.limits.inputTokens && turns.length > 0) {
    turns = turns.slice(1);
    messages = buildMessages(turns, parsed.message);
  }
  const inputEstimate = estimateTokens(provisionalSystem, messages);
  if (inputEstimate > config.limits.inputTokens) return fail("invalid", 400);

  const reserveNano =
    inputEstimate * config.budget.inputNanoPerToken + config.limits.outputTokens * config.budget.outputNanoPerToken;
  const token = newToken();

  let reservation;
  try {
    reservation = await store.reserve({
      keys,
      visitorLimit: config.limits.visitorPerDay,
      ipLimit: config.limits.ipPerDay,
      globalLimit: config.limits.globalPerDay,
      budgetNano: config.budget.dailyNanoUsd,
      reserveNano,
      visitorBurstLimit: config.limits.visitorPerMinute,
      ipBurstLimit: config.limits.ipPerMinute,
      burstWindowSec: BURST_WINDOW,
      windowSec: DAY,
      globalTtlSec: GLOBAL_TTL,
      lockTtlMs: config.timeoutMs + 10000,
      token,
    });
  } catch {
    deps.log?.("concierge: quota store unavailable");
    return fail("offline", 503);
  }
  if (!reservation.ok) {
    return fail(reservation.reason, 429, { "Retry-After": String(reservation.retryAfterSec) });
  }

  const remaining = reservation.remaining;
  const system = systemPrompt(remaining);
  const allTurns = parsed.turns;
  const question = parsed.message;
  const encoder = new TextEncoder();
  const upstream = new AbortController();
  const timer = setTimeout(() => upstream.abort(new Error("timeout")), config.timeoutMs);
  const onClientAbort = () => upstream.abort(new Error("client"));
  request.signal.addEventListener("abort", onClientAbort);

  const settle = async (deltaNano: number, refund: boolean) => {
    clearTimeout(timer);
    request.signal.removeEventListener("abort", onClientAbort);
    try {
      await store.settle({ keys, token, deltaNano, refund });
    } catch {
      deps.log?.("concierge: failed to settle quota");
    }
  };

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (event: StreamEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };
      const close = () => {
        if (!open) return;
        open = false;
        try {
          controller.close();
        } catch {}
      };

      const filter = new DirectiveFilter(send);
      let streamed = false;
      try {
        const run = model.stream(
          { model: config.model, system, messages, maxTokens: config.limits.outputTokens },
          upstream.signal,
        );
        for await (const chunk of run.text) {
          streamed = true;
          filter.push(chunk);
        }
        const final = await run.final();
        const result = filter.finish();
        const actual =
          final.inputTokens * config.budget.inputNanoPerToken + final.outputTokens * config.budget.outputNanoPerToken;
        await settle(actual - reserveNano, false);

        if (final.stopReason === "refusal") {
          send({ t: "error", code: "refusal" });
          return close();
        }
        if (!result.text) {
          send({ t: "error", code: "upstream" });
          return close();
        }
        const cards = result.events.flatMap((event) => (event.t === "cards" ? event.ids : []));
        const turn: Turn = { q: question, a: result.text.slice(0, MAX_ANSWER), cards };
        send({
          t: "done",
          proof: proofFor(secret, visitor.id, [...allTurns, turn]),
          remaining,
          truncated: final.stopReason === "max_tokens",
          answer: turn.a,
        });
        close();
      } catch (error) {
        const reason = upstream.signal.aborted ? String((upstream.signal.reason as Error)?.message ?? "") : "";
        const unbilled = error instanceof UpstreamError && !error.billed && !streamed;
        await settle(unbilled ? -reserveNano : 0, !streamed && reason !== "client");
        if (reason === "client") return close();
        const timedOut = reason === "timeout" || (error instanceof UpstreamError && error.timeout);
        deps.log?.(`concierge: upstream ${timedOut ? "timeout" : "error"}`);
        send({ t: "error", code: timedOut ? "timeout" : "upstream" });
        close();
      }
    },
    cancel() {
      upstream.abort(new Error("client"));
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
