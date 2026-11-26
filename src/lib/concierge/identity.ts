import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const VISITOR_COOKIE = "alv_visitor";
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 30;

function sign(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export type Visitor = { id: string; issuedAt: number };

export function issueVisitor(secret: string, now: number): { visitor: Visitor; cookie: string } {
  const id = randomBytes(12).toString("base64url");
  const payload = `${id}.${now.toString(36)}`;
  return { visitor: { id, issuedAt: now }, cookie: `${payload}.${sign(secret, `visitor:${payload}`)}` };
}

export function readVisitor(secret: string, cookie: string | undefined | null): Visitor | null {
  if (!cookie || cookie.length > 120) return null;
  const parts = cookie.split(".");
  if (parts.length !== 3) return null;
  const [id, issued, signature] = parts;
  if (!/^[A-Za-z0-9_-]{16}$/.test(id) || !/^[0-9a-z]{1,12}$/.test(issued)) return null;
  if (!safeEqual(signature, sign(secret, `visitor:${id}.${issued}`))) return null;
  return { id, issuedAt: Number.parseInt(issued, 36) };
}

export function clientIp(headers: Headers) {
  const forwarded =
    headers.get("x-vercel-forwarded-for") ?? headers.get("x-real-ip") ?? headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  return first && first.length <= 64 ? first : "unknown";
}

export function hashIp(secret: string, ip: string) {
  return createHmac("sha256", secret).update(`ip:${ip}`).digest("base64url").slice(0, 22);
}

export type Turn = { q: string; a: string; cards: string[] };

export function proofFor(secret: string, visitorId: string, turns: Turn[]) {
  return sign(secret, `transcript:${visitorId}:${JSON.stringify(turns.map((turn) => [turn.q, turn.a, turn.cards]))}`);
}

export function verifyProof(secret: string, visitorId: string, turns: Turn[], proof: string) {
  if (turns.length === 0) return proof === "";
  return typeof proof === "string" && safeEqual(proof, proofFor(secret, visitorId, turns));
}

export function newToken() {
  return randomBytes(9).toString("base64url");
}
