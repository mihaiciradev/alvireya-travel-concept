import type { DestinationId } from "@/content/destinations";

export type Section = "destinations" | "planner" | "journey" | "behind" | "contact";

export type StreamEvent =
  | { t: "text"; v: string }
  | { t: "cards"; ids: DestinationId[] }
  | { t: "ask"; items: string[] }
  | { t: "go"; to: Section }
  | { t: "done"; proof: string; remaining: number; truncated: boolean; answer: string }
  | { t: "error"; code: ErrorCode };

export type ErrorCode =
  | "offline"
  | "invalid"
  | "forbidden"
  | "busy"
  | "visitor_limit"
  | "ip_limit"
  | "global_limit"
  | "budget"
  | "burst"
  | "timeout"
  | "upstream"
  | "refusal";

export type StatusResponse = {
  status: "ready" | "offline" | "limit";
  remaining: number;
  limit: number;
  maxChars: number;
  mock: boolean;
};

export type HistoryTurn = { q: string; a: string; cards: string[] };

export type ChatRequest = {
  message: string;
  history: HistoryTurn[];
  proof: string;
  website?: string;
};
