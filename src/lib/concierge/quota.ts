export type QuotaKeys = {
  visitorDay: string;
  ipDay: string;
  globalDay: string;
  spendDay: string;
  visitorBurst: string;
  ipBurst: string;
  visitorLock: string;
  ipLock: string;
};

export type ReserveRequest = {
  keys: QuotaKeys;
  visitorLimit: number;
  ipLimit: number;
  globalLimit: number;
  budgetNano: number;
  reserveNano: number;
  visitorBurstLimit: number;
  ipBurstLimit: number;
  burstWindowSec: number;
  windowSec: number;
  globalTtlSec: number;
  lockTtlMs: number;
  token: string;
};

export type Denial = "busy" | "visitor_limit" | "ip_limit" | "global_limit" | "budget" | "burst";

export type ReserveResult = { ok: true; remaining: number } | { ok: false; reason: Denial; retryAfterSec: number };

export type SettleRequest = {
  keys: QuotaKeys;
  token: string;
  deltaNano: number;
  refund: boolean;
};

export type Usage = { visitor: number; ip: number; global: number; spendNano: number; busy: boolean };

export interface QuotaStore {
  reserve(request: ReserveRequest): Promise<ReserveResult>;
  settle(request: SettleRequest): Promise<void>;
  usage(keys: QuotaKeys): Promise<Usage>;
}

export function quotaKeys(visitorId: string, ipHash: string, now: Date): QuotaKeys {
  const day = now.toISOString().slice(0, 10);
  const prefix = "alv:ai";
  return {
    visitorDay: `${prefix}:v:${visitorId}`,
    ipDay: `${prefix}:ip:${ipHash}`,
    globalDay: `${prefix}:g:${day}`,
    spendDay: `${prefix}:spend:${day}`,
    visitorBurst: `${prefix}:vb:${visitorId}`,
    ipBurst: `${prefix}:ipb:${ipHash}`,
    visitorLock: `${prefix}:vl:${visitorId}`,
    ipLock: `${prefix}:ipl:${ipHash}`,
  };
}

export function keyList(keys: QuotaKeys) {
  return [
    keys.visitorDay,
    keys.ipDay,
    keys.globalDay,
    keys.spendDay,
    keys.visitorBurst,
    keys.ipBurst,
    keys.visitorLock,
    keys.ipLock,
  ];
}

export const RESERVE_SCRIPT = `
local function num(key)
  return tonumber(redis.call("GET", key) or "0") or 0
end
local function wait(key, fallback)
  local ttl = redis.call("TTL", key)
  if ttl and ttl > 0 then return ttl end
  return fallback
end
if redis.call("EXISTS", KEYS[7]) == 1 or redis.call("EXISTS", KEYS[8]) == 1 then
  return {"busy", 5}
end
local visitor = num(KEYS[1])
local ip = num(KEYS[2])
local global = num(KEYS[3])
local spend = num(KEYS[4])
if visitor >= tonumber(ARGV[1]) then return {"visitor_limit", wait(KEYS[1], tonumber(ARGV[9]))} end
if ip >= tonumber(ARGV[2]) then return {"ip_limit", wait(KEYS[2], tonumber(ARGV[9]))} end
if global >= tonumber(ARGV[3]) then return {"global_limit", wait(KEYS[3], tonumber(ARGV[12]))} end
if spend + tonumber(ARGV[5]) > tonumber(ARGV[4]) then return {"budget", wait(KEYS[4], tonumber(ARGV[12]))} end
if num(KEYS[5]) >= tonumber(ARGV[6]) then return {"burst", wait(KEYS[5], tonumber(ARGV[8]))} end
if num(KEYS[6]) >= tonumber(ARGV[7]) then return {"burst", wait(KEYS[6], tonumber(ARGV[8]))} end
local function bump(key, by, ttl)
  local value = redis.call("INCRBY", key, by)
  if redis.call("TTL", key) < 0 then redis.call("EXPIRE", key, ttl) end
  return value
end
local v = bump(KEYS[1], 1, tonumber(ARGV[9]))
local i = bump(KEYS[2], 1, tonumber(ARGV[9]))
bump(KEYS[3], 1, tonumber(ARGV[12]))
bump(KEYS[4], tonumber(ARGV[5]), tonumber(ARGV[12]))
bump(KEYS[5], 1, tonumber(ARGV[8]))
bump(KEYS[6], 1, tonumber(ARGV[8]))
redis.call("SET", KEYS[7], ARGV[11], "PX", tonumber(ARGV[10]))
redis.call("SET", KEYS[8], ARGV[11], "PX", tonumber(ARGV[10]))
local left = math.min(tonumber(ARGV[1]) - v, tonumber(ARGV[2]) - i)
if left < 0 then left = 0 end
return {"ok", left}
`;

export const SETTLE_SCRIPT = `
if redis.call("GET", KEYS[7]) == ARGV[1] then redis.call("DEL", KEYS[7]) end
if redis.call("GET", KEYS[8]) == ARGV[1] then redis.call("DEL", KEYS[8]) end
local delta = tonumber(ARGV[2])
if delta ~= 0 and redis.call("EXISTS", KEYS[4]) == 1 then
  local value = redis.call("INCRBY", KEYS[4], delta)
  if value < 0 then redis.call("SET", KEYS[4], "0", "KEEPTTL") end
end
if ARGV[3] == "1" then
  for index = 1, 3 do
    if redis.call("EXISTS", KEYS[index]) == 1 and tonumber(redis.call("GET", KEYS[index])) > 0 then
      redis.call("DECR", KEYS[index])
    end
  end
end
return "ok"
`;

export const USAGE_SCRIPT = `
local busy = 0
if redis.call("EXISTS", KEYS[7]) == 1 or redis.call("EXISTS", KEYS[8]) == 1 then busy = 1 end
return {
  tonumber(redis.call("GET", KEYS[1]) or "0"),
  tonumber(redis.call("GET", KEYS[2]) or "0"),
  tonumber(redis.call("GET", KEYS[3]) or "0"),
  tonumber(redis.call("GET", KEYS[4]) or "0"),
  busy
}
`;

export function reserveArgs(request: ReserveRequest) {
  return [
    request.visitorLimit,
    request.ipLimit,
    request.globalLimit,
    request.budgetNano,
    request.reserveNano,
    request.visitorBurstLimit,
    request.ipBurstLimit,
    request.burstWindowSec,
    request.windowSec,
    request.lockTtlMs,
    request.token,
    request.globalTtlSec,
  ].map(String);
}

export function settleArgs(request: SettleRequest) {
  return [request.token, String(Math.round(request.deltaNano)), request.refund ? "1" : "0"];
}

export function parseReserve(raw: unknown): ReserveResult {
  if (!Array.isArray(raw) || typeof raw[0] !== "string") throw new Error("Unexpected quota reply");
  const [status, value] = raw as [string, number | string];
  const amount = Number(value) || 0;
  if (status === "ok") return { ok: true, remaining: amount };
  const reasons: Denial[] = ["busy", "visitor_limit", "ip_limit", "global_limit", "budget", "burst"];
  if (!reasons.includes(status as Denial)) throw new Error("Unexpected quota reply");
  return { ok: false, reason: status as Denial, retryAfterSec: Math.max(1, amount) };
}

export function parseUsage(raw: unknown): Usage {
  if (!Array.isArray(raw) || raw.length < 5) throw new Error("Unexpected quota reply");
  const [visitor, ip, global, spend, busy] = raw.map((value) => Number(value) || 0);
  return { visitor, ip, global, spendNano: spend, busy: busy === 1 };
}

type Fetch = typeof fetch;

export class RedisRestStore implements QuotaStore {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly fetcher: Fetch = fetch,
  ) {}

  private async command(args: (string | number)[]) {
    const response = await this.fetcher(this.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`Quota store responded ${response.status}`);
    const payload = (await response.json()) as { result?: unknown; error?: string };
    if (payload.error) throw new Error("Quota store error");
    return payload.result;
  }

  async reserve(request: ReserveRequest) {
    const keys = keyList(request.keys);
    return parseReserve(await this.command(["EVAL", RESERVE_SCRIPT, keys.length, ...keys, ...reserveArgs(request)]));
  }

  async settle(request: SettleRequest) {
    const keys = keyList(request.keys);
    await this.command(["EVAL", SETTLE_SCRIPT, keys.length, ...keys, ...settleArgs(request)]);
  }

  async usage(keys: QuotaKeys) {
    const list = keyList(keys);
    return parseUsage(await this.command(["EVAL", USAGE_SCRIPT, list.length, ...list]));
  }
}

type Entry = { value: string; expiresAt: number | null };

export class MemoryStore implements QuotaStore {
  private readonly data = new Map<string, Entry>();

  constructor(private readonly now: () => number = Date.now) {}

  private read(key: string) {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= this.now()) {
      this.data.delete(key);
      return null;
    }
    return entry;
  }

  private num(key: string) {
    return Number(this.read(key)?.value ?? 0);
  }

  private ttl(key: string, fallback: number) {
    const entry = this.read(key);
    if (!entry || entry.expiresAt === null) return fallback;
    return Math.max(1, Math.ceil((entry.expiresAt - this.now()) / 1000));
  }

  private bump(key: string, by: number, ttlSec: number) {
    const entry = this.read(key);
    const value = Number(entry?.value ?? 0) + by;
    this.data.set(key, { value: String(value), expiresAt: entry?.expiresAt ?? this.now() + ttlSec * 1000 });
    return value;
  }

  async reserve(request: ReserveRequest): Promise<ReserveResult> {
    const k = request.keys;
    if (this.read(k.visitorLock) || this.read(k.ipLock)) return { ok: false, reason: "busy", retryAfterSec: 5 };
    const deny = (reason: Denial, key: string, fallback: number): ReserveResult => ({
      ok: false,
      reason,
      retryAfterSec: this.ttl(key, fallback),
    });
    if (this.num(k.visitorDay) >= request.visitorLimit) return deny("visitor_limit", k.visitorDay, request.windowSec);
    if (this.num(k.ipDay) >= request.ipLimit) return deny("ip_limit", k.ipDay, request.windowSec);
    if (this.num(k.globalDay) >= request.globalLimit) return deny("global_limit", k.globalDay, request.globalTtlSec);
    if (this.num(k.spendDay) + request.reserveNano > request.budgetNano) return deny("budget", k.spendDay, request.globalTtlSec);
    if (this.num(k.visitorBurst) >= request.visitorBurstLimit) return deny("burst", k.visitorBurst, request.burstWindowSec);
    if (this.num(k.ipBurst) >= request.ipBurstLimit) return deny("burst", k.ipBurst, request.burstWindowSec);

    const v = this.bump(k.visitorDay, 1, request.windowSec);
    const i = this.bump(k.ipDay, 1, request.windowSec);
    this.bump(k.globalDay, 1, request.globalTtlSec);
    this.bump(k.spendDay, request.reserveNano, request.globalTtlSec);
    this.bump(k.visitorBurst, 1, request.burstWindowSec);
    this.bump(k.ipBurst, 1, request.burstWindowSec);
    const lock = { value: request.token, expiresAt: this.now() + request.lockTtlMs };
    this.data.set(k.visitorLock, lock);
    this.data.set(k.ipLock, { ...lock });
    return { ok: true, remaining: Math.max(0, Math.min(request.visitorLimit - v, request.ipLimit - i)) };
  }

  async settle(request: SettleRequest) {
    const k = request.keys;
    for (const key of [k.visitorLock, k.ipLock]) {
      if (this.read(key)?.value === request.token) this.data.delete(key);
    }
    const spend = this.read(k.spendDay);
    if (request.deltaNano !== 0 && spend) {
      spend.value = String(Math.max(0, Number(spend.value) + Math.round(request.deltaNano)));
    }
    if (request.refund) {
      for (const key of [k.visitorDay, k.ipDay, k.globalDay]) {
        const entry = this.read(key);
        if (entry && Number(entry.value) > 0) entry.value = String(Number(entry.value) - 1);
      }
    }
  }

  async usage(keys: QuotaKeys): Promise<Usage> {
    return {
      visitor: this.num(keys.visitorDay),
      ip: this.num(keys.ipDay),
      global: this.num(keys.globalDay),
      spendNano: this.num(keys.spendDay),
      busy: Boolean(this.read(keys.visitorLock) || this.read(keys.ipLock)),
    };
  }
}
