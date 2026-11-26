export const DEFAULT_MODEL = "claude-haiku-5-5";

export type ConciergeConfig = {
  enabled: boolean;
  apiKey: string | null;
  model: string;
  secret: string | null;
  store: "redis" | "memory" | null;
  redis: { url: string; token: string } | null;
  allowedOrigins: string[];
  limits: {
    visitorPerDay: number;
    ipPerDay: number;
    globalPerDay: number;
    visitorPerMinute: number;
    ipPerMinute: number;
    messageChars: number;
    outputTokens: number;
    inputTokens: number;
    turns: number;
  };
  budget: {
    dailyNanoUsd: number;
    inputNanoPerToken: number;
    outputNanoPerToken: number;
  };
  timeoutMs: number;
  minDwellMs: number;
  mock: boolean;
};

type Env = Record<string, string | undefined>;

function int(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function usd(value: string | undefined, fallback: number) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function readConfig(env: Env = process.env): ConciergeConfig {
  const production = env.NODE_ENV === "production";
  const secret = env.AI_SESSION_SECRET && env.AI_SESSION_SECRET.length >= 32 ? env.AI_SESSION_SECRET : null;

  const redisUrl = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  const redis = redisUrl && redisToken && redisUrl.startsWith("https://") ? { url: redisUrl, token: redisToken } : null;
  const memoryAllowed = !production && env.AI_QUOTA_STORE === "memory";
  const store = redis ? "redis" : memoryAllowed ? "memory" : null;

  const origins = (env.AI_ALLOWED_ORIGINS ?? "https://alvireya.webbinghub.io")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!production) origins.push("http://localhost:3000", "http://127.0.0.1:3000");

  const mock = !production && env.AI_MOCK_MODEL === "true";

  return {
    enabled: env.AI_ENABLED === "true",
    apiKey: env.ANTHROPIC_API_KEY || null,
    model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    secret,
    store,
    redis,
    allowedOrigins: origins,
    limits: {
      visitorPerDay: int(env.AI_VISITOR_DAILY_LIMIT, 5, 0, 100),
      ipPerDay: int(env.AI_IP_DAILY_LIMIT, 10, 0, 500),
      globalPerDay: int(env.AI_GLOBAL_DAILY_LIMIT, 100, 0, 100000),
      visitorPerMinute: int(env.AI_VISITOR_MINUTE_LIMIT, 4, 1, 60),
      ipPerMinute: int(env.AI_IP_MINUTE_LIMIT, 8, 1, 120),
      messageChars: int(env.AI_MAX_MESSAGE_CHARS, 500, 20, 2000),
      outputTokens: int(env.AI_MAX_OUTPUT_TOKENS, 350, 64, 1024),
      inputTokens: int(env.AI_MAX_INPUT_TOKENS, 6000, 1000, 20000),
      turns: int(env.AI_MAX_TURNS, 6, 1, 12),
    },
    budget: {
      dailyNanoUsd: Math.round(usd(env.AI_DAILY_BUDGET_USD, 0.1) * 1e9),
      inputNanoPerToken: Math.round(usd(env.AI_INPUT_USD_PER_MTOK, 0.1) * 1000),
      outputNanoPerToken: Math.round(usd(env.AI_OUTPUT_USD_PER_MTOK, 0.5) * 1000),
    },
    timeoutMs: int(env.AI_TIMEOUT_MS, 20000, 3000, 55000),
    minDwellMs: int(env.AI_MIN_DWELL_MS, 1000, 0, 10000),
    mock,
  };
}

export type Availability = "ready" | "offline";

export function availability(config: ConciergeConfig): Availability {
  if (!config.enabled || !config.secret || !config.store) return "offline";
  if (!config.apiKey && !config.mock) return "offline";
  return "ready";
}
