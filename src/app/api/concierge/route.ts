import { anthropicModel } from "@/lib/concierge/anthropic";
import { readConfig } from "@/lib/concierge/config";
import { handleChat, handleStatus, type Deps } from "@/lib/concierge/engine";
import { mockModel } from "@/lib/concierge/mock";
import { MemoryStore, RedisRestStore, type QuotaStore } from "@/lib/concierge/quota";

export const maxDuration = 30;

const globalStore = globalThis as typeof globalThis & { alvireyaQuota?: QuotaStore };

function deps(): Deps {
  const config = readConfig();
  let store: QuotaStore | null = null;
  if (config.store === "redis" && config.redis) {
    store = new RedisRestStore(config.redis.url, config.redis.token);
  } else if (config.store === "memory") {
    store = globalStore.alvireyaQuota ??= new MemoryStore();
  }
  const model = config.mock ? mockModel() : config.apiKey ? anthropicModel(config.apiKey, config.timeoutMs) : null;
  return { config, store, model, log: (message) => console.warn(message) };
}

export async function GET(request: Request) {
  return handleStatus(request, deps());
}

export async function POST(request: Request) {
  return handleChat(request, deps());
}
