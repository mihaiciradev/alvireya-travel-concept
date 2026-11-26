import { describe, expect, it } from "vitest";
import { MemoryStore, RedisRestStore, quotaKeys, type QuotaStore, type ReserveRequest } from "@/lib/concierge/quota";
import { FakeRedis } from "./redis-emulator";

function clock(start = Date.UTC(2026, 10, 26, 10)) {
  let now = start;
  return { now: () => now, advance: (ms: number) => (now += ms) };
}

const stores: [string, (now: () => number) => { store: QuotaStore; redis?: FakeRedis }][] = [
  ["memory store", (now) => ({ store: new MemoryStore(now) })],
  [
    "redis lua scripts",
    (now) => {
      const redis = new FakeRedis(now);
      return { store: new RedisRestStore("https://fake.upstash.io", "token", redis.fetch), redis };
    },
  ],
];

function request(visitor: string, ip: string, at: number, overrides: Partial<ReserveRequest> = {}): ReserveRequest {
  return {
    keys: quotaKeys(visitor, ip, new Date(at)),
    visitorLimit: 5,
    ipLimit: 10,
    globalLimit: 100,
    budgetNano: 100_000_000,
    reserveNano: 1_000_000,
    visitorBurstLimit: 100,
    ipBurstLimit: 100,
    burstWindowSec: 60,
    windowSec: 86400,
    globalTtlSec: 172800,
    lockTtlMs: 30000,
    token: `t-${Math.random()}`,
    ...overrides,
  };
}

async function reserveAndRelease(store: QuotaStore, req: ReserveRequest) {
  const result = await store.reserve(req);
  if (result.ok) await store.settle({ keys: req.keys, token: req.token, deltaNano: 0, refund: false });
  return result;
}

describe.each(stores)("%s", (_name, make) => {
  it("allows five requests per visitor, then denies", async () => {
    const time = clock();
    const { store } = make(time.now);
    const results = [];
    for (let index = 0; index < 6; index++) results.push(await reserveAndRelease(store, request("v1", "ip1", time.now())));
    expect(results.slice(0, 5).every((result) => result.ok)).toBe(true);
    expect(results.map((result) => (result.ok ? result.remaining : -1)).slice(0, 5)).toEqual([4, 3, 2, 1, 0]);
    expect(results[5]).toMatchObject({ ok: false, reason: "visitor_limit" });
  });

  it("limits an IP even when the visitor cookie changes", async () => {
    const time = clock();
    const { store } = make(time.now);
    const outcomes = [];
    for (let index = 0; index < 11; index++) {
      outcomes.push(await reserveAndRelease(store, request(`visitor-${index}`, "shared-ip", time.now())));
    }
    expect(outcomes.filter((result) => result.ok)).toHaveLength(10);
    expect(outcomes[10]).toMatchObject({ ok: false, reason: "ip_limit" });
  });

  it("never grants more than the global limit under concurrency", async () => {
    const time = clock();
    const { store } = make(time.now);
    const results = await Promise.all(
      Array.from({ length: 40 }, (_, index) =>
        store.reserve(request(`visitor-${index}`, `ip-${index}`, time.now(), { globalLimit: 7 })),
      ),
    );
    expect(results.filter((result) => result.ok)).toHaveLength(7);
    expect(results.filter((result) => !result.ok && result.reason === "global_limit")).toHaveLength(33);
  });

  it("enforces the daily spend ceiling", async () => {
    const time = clock();
    const { store } = make(time.now);
    const options = { budgetNano: 2_500_000, reserveNano: 1_000_000 };
    const results = [];
    for (let index = 0; index < 3; index++) {
      results.push(await reserveAndRelease(store, request(`v${index}`, `ip${index}`, time.now(), options)));
    }
    expect(results.map((result) => result.ok)).toEqual([true, true, false]);
    expect(results[2]).toMatchObject({ reason: "budget" });
  });

  it("allows one concurrent request per visitor and per IP", async () => {
    const time = clock();
    const { store } = make(time.now);
    const first = request("v1", "ip1", time.now());
    const [a, b] = await Promise.all([store.reserve(first), store.reserve(request("v1", "ip1", time.now()))]);
    expect([a.ok, b.ok].sort()).toEqual([false, true]);
    const sameIp = await store.reserve(request("v2", "ip1", time.now()));
    expect(sameIp).toMatchObject({ ok: false, reason: "busy" });

    const winner = a.ok ? first : null;
    if (winner) await store.settle({ keys: winner.keys, token: winner.token, deltaNano: 0, refund: false });
    else {
      time.advance(31000);
    }
    expect((await store.reserve(request("v1", "ip1", time.now()))).ok).toBe(true);
  });

  it("does not let another request release someone else's lock", async () => {
    const time = clock();
    const { store } = make(time.now);
    const owner = request("v1", "ip1", time.now());
    await store.reserve(owner);
    await store.settle({ keys: owner.keys, token: "wrong", deltaNano: 0, refund: false });
    expect(await store.reserve(request("v1", "ip1", time.now()))).toMatchObject({ ok: false, reason: "busy" });
  });

  it("expires a stuck lock after its TTL", async () => {
    const time = clock();
    const { store } = make(time.now);
    await store.reserve(request("v1", "ip1", time.now()));
    time.advance(30001);
    expect((await store.reserve(request("v1", "ip1", time.now()))).ok).toBe(true);
  });

  it("applies the short burst window and resets it", async () => {
    const time = clock();
    const { store } = make(time.now);
    const options = { visitorBurstLimit: 2 };
    expect((await reserveAndRelease(store, request("v1", "ip1", time.now(), options))).ok).toBe(true);
    expect((await reserveAndRelease(store, request("v1", "ip1", time.now(), options))).ok).toBe(true);
    expect(await reserveAndRelease(store, request("v1", "ip1", time.now(), options))).toMatchObject({
      ok: false,
      reason: "burst",
    });
    time.advance(61000);
    expect((await reserveAndRelease(store, request("v1", "ip1", time.now(), options))).ok).toBe(true);
  });

  it("settles real spend and refunds unbilled failures", async () => {
    const time = clock();
    const { store } = make(time.now);
    const first = request("v1", "ip1", time.now());
    await store.reserve(first);
    await store.settle({ keys: first.keys, token: first.token, deltaNano: -400_000, refund: false });
    let usage = await store.usage(first.keys);
    expect(usage).toMatchObject({ visitor: 1, global: 1, spendNano: 600_000, busy: false });

    const second = request("v1", "ip1", time.now());
    await store.reserve(second);
    await store.settle({ keys: second.keys, token: second.token, deltaNano: -1_000_000, refund: true });
    usage = await store.usage(second.keys);
    expect(usage).toMatchObject({ visitor: 1, ip: 1, global: 1, spendNano: 600_000 });
  });

  it("opens a fresh window 24 hours after the first request", async () => {
    const time = clock();
    const { store } = make(time.now);
    for (let index = 0; index < 5; index++) await reserveAndRelease(store, request("v1", "ip1", time.now()));
    expect((await reserveAndRelease(store, request("v1", "ip1", time.now()))).ok).toBe(false);
    time.advance(86400 * 1000 + 1000);
    expect((await reserveAndRelease(store, request("v1", "ip1", time.now()))).ok).toBe(true);
  });
});

describe("redis store failures", () => {
  it("throws when the store is unreachable so callers can fail closed", async () => {
    const redis = new FakeRedis();
    redis.failing = true;
    const store = new RedisRestStore("https://fake.upstash.io", "token", redis.fetch);
    await expect(store.reserve(request("v1", "ip1", Date.now()))).rejects.toThrow();
    await expect(store.usage(quotaKeys("v1", "ip1", new Date()))).rejects.toThrow();
  });
});
