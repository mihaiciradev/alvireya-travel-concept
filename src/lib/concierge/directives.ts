import { destinations, type DestinationId } from "@/content/destinations";
import type { Section, StreamEvent } from "./protocol";

const destinationIds = new Set<string>(destinations.map((destination) => destination.id));
const sections = new Set<Section>(["destinations", "planner", "journey", "behind", "contact"]);
const MAX_DIRECTIVE = 240;

const urlPattern = /\b(?:https?:\/\/|www\.)\S+/gi;

export function cleanText(text: string) {
  return text.replace(urlPattern, "").replace(/^#{1,6}\s+/gm, "").replace(/\u0000/g, "");
}

function cleanChip(value: string) {
  const chip = value.replace(urlPattern, "").replace(/[<>[\]{}]/g, "").replace(/\s+/g, " ").trim();
  return chip.length >= 2 && chip.length <= 64 ? chip : null;
}

export function parseDirective(body: string): StreamEvent | null {
  const split = body.indexOf(":");
  if (split < 0) return null;
  const name = body.slice(0, split).trim().toLowerCase();
  const value = body.slice(split + 1);

  if (name === "cards") {
    const ids = [
      ...new Set(
        value
          .split(/[,|]/)
          .map((item) => item.trim().toLowerCase())
          .filter((item) => destinationIds.has(item)),
      ),
    ].slice(0, 3) as DestinationId[];
    return ids.length ? { t: "cards", ids } : null;
  }

  if (name === "ask") {
    const items = [...new Set(value.split("|").map(cleanChip).filter((item): item is string => Boolean(item)))].slice(0, 3);
    return items.length ? { t: "ask", items } : null;
  }

  if (name === "go") {
    const to = value.trim().toLowerCase() as Section;
    return sections.has(to) ? { t: "go", to } : null;
  }

  return null;
}

export class DirectiveFilter {
  private pending = "";
  private text = "";
  private readonly found: StreamEvent[] = [];

  constructor(private readonly emit: (event: StreamEvent) => void) {}

  private send(raw: string) {
    const value = cleanText(raw);
    if (!value) return;
    this.text += value;
    this.emit({ t: "text", v: value });
  }

  private directive(event: StreamEvent | null) {
    if (!event) return;
    const index = this.found.findIndex((item) => item.t === event.t);
    if (index >= 0) this.found.splice(index, 1);
    this.found.push(event);
    this.emit(event);
  }

  push(delta: string) {
    this.pending += delta;
    while (this.pending) {
      const open = this.pending.indexOf("[[");
      if (open >= 0) {
        this.send(this.pending.slice(0, open));
        const rest = this.pending.slice(open);
        const close = rest.indexOf("]]");
        if (close < 0) {
          this.pending = rest.length > MAX_DIRECTIVE ? "" : rest;
          return;
        }
        this.directive(parseDirective(rest.slice(2, close)));
        this.pending = rest.slice(close + 2);
        continue;
      }

      let hold = this.pending.length;
      if (this.pending.endsWith("[")) hold -= 1;
      const lastSpace = Math.max(this.pending.lastIndexOf(" ", hold - 1), this.pending.lastIndexOf("\n", hold - 1));
      const cut = lastSpace >= 0 ? lastSpace + 1 : 0;
      if (cut > 0) {
        this.send(this.pending.slice(0, cut));
        this.pending = this.pending.slice(cut);
      }
      return;
    }
  }

  finish() {
    const open = this.pending.indexOf("[[");
    this.send(open >= 0 ? this.pending.slice(0, open) : this.pending);
    this.pending = "";
    return { text: this.text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(), events: this.found };
  }
}
