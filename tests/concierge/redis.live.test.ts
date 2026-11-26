import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { RedisRestStore, quotaKeys, type ReserveRequest } from "@/lib/concierge/quota";

// Runs only with LIVE_REDIS=1, against the Upstash database in .env.local, under a throwaway namespace.
const live = process.env.LIVE_REDIS === "1";

function loadEnv() {
  const env: Record<string, string> = {};
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index > 0) env[line.slice(0, index)] = line.slice(index + 1).replace(/^"|"$/g, "");
  }
  return env;
}

const env = live ? loadEnv() : {};
const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL ?? "";
const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN ?? "";
const prefix = `alv:test:${Date.now().toString(36)}`;

async function raw(args: (string | number)[]) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(args),
  });
  return ((await response.json()) as { result: unknown }).result;
}

async function namespaceKeys(match: string) {
  const found: string[] = [];
  let cursor = "0";
  do {
    const [next, keys] = (await raw(["SCAN", cursor, "MATCH", match, "COUNT", 500])) as [string, string[]];
    cursor = next;
    found.push(...keys);
  } while (cursor !== "0");
  return found;
}

function request(visitor: string, ip: string, overrides: Partial<ReserveRequest> = {}): ReserveRequest {
  return {
    keys: quotaKeys(visitor, ip, new Date(), prefix),
    visitorLimit: 5,
    ipLimit: 10,
    globalLimit: 100,
    budgetNano: 100_000_000,
    reserveNano: 775_000,
    visitorBurstLimit: 100,
    ipBurstLimit: 100,
    burstWindowSec: 60,
    windowSec: 86400,
    globalTtlSec: 172800,
    lockTtlMs: 30000,
    token: `t-${Math.random().toString(36).slice(2)}`,
    ...overrides,
  };
}

describe.skipIf(!live)("live Upstash quota store", () => {
  const store = new RedisRestStore(url, token);

  afterAll(async () => {
    const keys = await namespaceKeys(`${prefix}:*`);
    if (keys.length) await raw(["DEL", ...keys]);
    expect(await namespaceKeys(`${prefix}:*`)).toEqual([]);
  });

  it("enforces the per-visitor daily limit and sets 24 hour expiry", async () => {
    const results = [];
    for (let index = 0; index < 6; index++) {
      const req = request("visitor-a", "ip-a");
      const result = await store.reserve(req);
      if (result.ok) await store.settle({ keys: req.keys, token: req.token, deltaNano: 0, refund: false });
      results.push(result);
    }
    expect(results.map((result) => (result.ok ? result.remaining : result.reason))).toEqual([4, 3, 2, 1, 0, "visitor_limit"]);
    const keys = request("visitor-a", "ip-a").keys;
    const ttl = Number(await raw(["TTL", keys.visitorDay]));
    expect(ttl).toBeGreaterThan(86000);
    expect(ttl).toBeLessThanOrEqual(86400);
    expect(Number(await raw(["TTL", keys.globalDay]))).toBeGreaterThan(172000);
  });

  it("limits an IP across fresh visitor ids", async () => {
    const outcomes = [];
    for (let index = 0; index < 11; index++) {
      const req = request(`rotating-${index}`, "ip-shared");
      const result = await store.reserve(req);
      if (result.ok) await store.settle({ keys: req.keys, token: req.token, deltaNano: 0, refund: false });
      outcomes.push(result.ok ? "ok" : result.reason);
    }
    expect(outcomes.filter((item) => item === "ok")).toHaveLength(10);
    expect(outcomes[10]).toBe("ip_limit");
  });

  it("grants exactly the global limit to 40 parallel requests", async () => {
    const { global } = await store.usage(request("probe", "probe-ip").keys);
    const globalLimit = global + 7;
    const results = await Promise.all(
      Array.from({ length: 40 }, (_, index) => store.reserve(request(`burst-${index}`, `burst-ip-${index}`, { globalLimit }))),
    );
    expect(results.filter((result) => result.ok)).toHaveLength(7);
    expect(results.filter((result) => !result.ok && result.reason === "global_limit")).toHaveLength(33);
    expect((await store.usage(request("probe", "probe-ip").keys)).global).toBe(globalLimit);
  });

  it("lets only one of 10 parallel requests from one visitor through", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => store.reserve(request("solo", "solo-ip"))));
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok && result.reason === "busy")).toHaveLength(9);
    const lockTtl = Number(await raw(["PTTL", request("solo", "solo-ip").keys.visitorLock]));
    expect(lockTtl).toBeGreaterThan(25000);
  });

  it("stops at the spend ceiling and refunds unbilled failures", async () => {
    const tight = { budgetNano: 0, reserveNano: 775_000 };
    expect(await store.reserve(request("spender", "spender-ip", tight))).toMatchObject({ ok: false, reason: "budget" });

    const req = request("refund", "refund-ip");
    const before = await store.usage(req.keys);
    expect((await store.reserve(req)).ok).toBe(true);
    await store.settle({ keys: req.keys, token: req.token, deltaNano: -req.reserveNano, refund: true });
    const after = await store.usage(req.keys);
    expect(after).toMatchObject({ visitor: 0, ip: 0, global: before.global, spendNano: before.spendNano, busy: false });
  });
});
