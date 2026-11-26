import { scenarioMenu, scenarios, type Pick, type ScenarioId, type Suggestion } from "@/content/concierge";
import { getDestination, type DestinationId, type Season } from "@/content/destinations";
import { outlineFor, seasonNoteFor, type PlannerDay } from "@/lib/planner";

export type Profile = {
  style?: ScenarioId;
  when?: string;
  season?: Season;
  party?: string;
  budget?: string;
  destination?: DestinationId;
};

export type Reply = {
  tone: ScenarioId | "welcome" | "destination" | "outline" | "brief" | "guide" | "noted";
  eyebrow: string;
  headline: string;
  body: string[];
  picks: Pick[];
  outline?: { destination: DestinationId; days: PlannerDay[] };
  brief?: Profile;
  next: Suggestion[];
  focus: DestinationId | null;
};

export type Turn = { said: string; reply: Reply; profile: Profile };

const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const monthSeason: Season[] = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];

const places: { pattern: RegExp; id: DestinationId }[] = [
  { pattern: /lofoten|norway|reine|arctic|fjord/i, id: "lofoten" },
  { pattern: /kyoto|japan/i, id: "kyoto" },
  { pattern: /atacama|chile|san pedro/i, id: "atacama" },
  { pattern: /amalfi|positano|ravello|italy|naples/i, id: "amalfi" },
];

export function where(id: DestinationId) {
  if (id === "amalfi") return "on the Amalfi Coast";
  if (id === "atacama") return "in the Atacama";
  return `in ${getDestination(id).name}`;
}

const pace: Record<ScenarioId, string> = {
  romantic: "slow, romantic",
  luxury: "private, unhurried",
  adventure: "active",
  beach: "sun-filled",
  family: "easy, family-friendly",
  culture: "curious",
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function readProfile(text: string, current: Profile): Profile {
  const next: Profile = { ...current };
  const lower = text.toLowerCase();

  const month = months.findIndex((name) => new RegExp(`\\b${name.slice(0, 3)}(?:${name.slice(3)})?\\b`).test(lower));
  const mayAsMonth = /\b(?:in|early|late|mid|this|next|during|of|until|from|by|around)\s+may\b|\bmay\s+\d/.test(lower);
  if (month >= 0 && (month !== 4 || mayAsMonth)) {
    next.when = capitalize(months[month]);
    next.season = monthSeason[month];
  } else {
    const season = (["winter", "spring", "summer", "autumn"] as Season[]).find((name) => lower.includes(name));
    const fall = /\bfall\b/.test(lower);
    if (season || fall) {
      next.season = season ?? "autumn";
      next.when = capitalize(next.season);
    } else if (/christmas|new year/.test(lower)) {
      next.season = "winter";
      next.when = "Christmas";
    } else if (/easter/.test(lower)) {
      next.season = "spring";
      next.when = "Easter";
    }
  }

  const count = lower.match(/\b(\d{1,2}|two|three|four|five|six|seven|eight)\s+(?:of us|people|adults|travell?ers|guests)\b/);
  const words: Record<string, string> = { two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8" };
  if (/family|kids|children|child|toddler|teen/.test(lower)) next.party = "Family";
  else if (/honeymoon|anniversary|couple|two of us|for two|my (?:wife|husband|partner|girlfriend|boyfriend)/.test(lower)) next.party = "Two";
  else if (count) next.party = `${words[count[1]] ?? count[1]} travellers`;
  else if (/\bsolo\b|alone|by myself|just me/.test(lower)) next.party = "Solo";
  else if (/friends|group/.test(lower)) next.party = "Friends";

  const money = text.match(/(?:€|£|\$)\s?(\d[\d.,]*\s?k?)|(\d[\d.,]*\s?k?)\s?(€|euros?|eur\b|pounds?|dollars?)/i);
  if (money) {
    const raw = money[0].toLowerCase();
    const symbol = /£|pound/.test(raw) ? "£" : /\$|dollar/.test(raw) ? "$" : "€";
    const amount = (money[1] ?? money[2]).replace(/\s+/g, "");
    const each = /each|per person|pp\b|a head/i.test(text) ? " each" : "";
    next.budget = `${symbol}${amount}${each}`;
  } else if (/luxur|no budget|money is no|splurge/.test(lower)) {
    next.budget = "Open";
  }

  return next;
}

function opener(profile: Profile) {
  const parts = [
    profile.party === "Two" ? "for two" : profile.party === "Family" ? "for the family" : profile.party ? `for ${profile.party.toLowerCase()}` : "",
    profile.when ? `in ${profile.when}` : "",
  ].filter(Boolean);
  return parts.length ? capitalize(`${parts.join(", ")}. `) : "";
}

function seasonal(picks: Pick[], profile: Profile): Pick[] {
  if (!profile.season) return picks;
  return picks.map((pick) => ({ ...pick, why: `${pick.why} ${seasonNoteFor(pick.id, profile.season!)}` }));
}

function scenarioReply(id: ScenarioId, profile: Profile): Reply {
  const scenario = scenarios.find((item) => item.id === id)!;
  return {
    tone: id,
    eyebrow: `${scenario.label} · ${scenario.picks.length === 1 ? "one place" : `${scenario.picks.length} places`}`,
    headline: scenario.headline,
    body: [`${opener(profile)}${scenario.body}`],
    picks: seasonal(scenario.picks, profile),
    next: scenario.next,
    focus: scenario.picks[0].id,
  };
}

function destinationReply(id: DestinationId, profile: Profile): Reply {
  const destination = getDestination(id);
  const style = profile.style ? scenarios.find((item) => item.id === profile.style) : null;
  return {
    tone: "destination",
    eyebrow: `${destination.country} · ${destination.coordinates}`,
    headline: destination.headline,
    body: [destination.story, `Best time: ${destination.bestTime}. Ideal stay: ${destination.idealStay}.`],
    picks: [],
    next: [
      { kind: "outline", destination: id, label: `Sketch five days ${where(id)}` },
      { kind: "quote", destination: id, label: `Request a quote for ${destination.name}` },
      style ? { kind: "scenario", id: style.id, label: `Back to ${style.label.toLowerCase()} ideas` } : scenarioMenu[0],
    ],
    focus: id,
  };
}

function outlineReply(id: DestinationId, profile: Profile): Reply {
  const destination = getDestination(id);
  const scenario = scenarios.find((item) => item.id === profile.style);
  return {
    tone: "outline",
    eyebrow: `${destination.name} · first sketch`,
    headline: `Five days ${where(id)}.`,
    body: [
      `${opener(profile)}A starting point a travel designer would refine with you, paced for ${scenario ? pace[scenario.id] : "unhurried"} days.`,
    ],
    picks: [],
    outline: { destination: id, days: outlineFor(id, scenario?.focus ?? []) },
    next: [
      { kind: "quote", destination: id, label: `Request a quote for ${destination.name}` },
      { kind: "brief", label: "Send this brief to a travel designer" },
      { kind: "destination", destination: id, label: `More about ${destination.name}` },
    ],
    focus: id,
  };
}

function briefReply(profile: Profile): Reply {
  const destination = profile.destination ? getDestination(profile.destination) : null;
  const candidates = (scenarios.find((item) => item.id === profile.style)?.picks ?? []).slice(0, 2);
  return {
    tone: "brief",
    eyebrow: "Brief · ready to hand over",
    headline: "Your brief, ready for a travel designer.",
    body: [
      "Everything you shared, in one place. In a production build this lands in the agency's CRM with the conversation attached, so nobody asks the same question twice.",
    ],
    picks: [],
    brief: profile,
    next: destination
      ? [
          { kind: "quote", destination: destination.id, label: "Continue to the quote request" },
          { kind: "outline", destination: destination.id, label: `See the ${destination.name} sketch again` },
        ]
      : candidates.length
        ? candidates.map((pick): Suggestion => ({ kind: "quote", destination: pick.id, label: `Request a quote for ${getDestination(pick.id).name}` }))
        : scenarioMenu.slice(0, 3),
    focus: profile.destination ?? candidates[0]?.id ?? null,
  };
}

function guideReply(): Reply {
  return {
    tone: "guide",
    eyebrow: "Beyond this demo's map",
    headline: "Let's find the feeling first.",
    body: [
      "This concierge knows four places in depth. Connected to an agency's inventory it would search everything on offer. For now, choose the kind of trip you have in mind and I'll take it from there.",
    ],
    picks: [],
    next: scenarioMenu,
    focus: null,
  };
}

function notedReply(profile: Profile): Reply {
  const noted = [profile.party, profile.when, profile.budget && `budget ${profile.budget}`].filter(Boolean).join(" · ");
  return {
    tone: "noted",
    eyebrow: "Noted",
    headline: "Now, how should it feel?",
    body: [`${noted}. That shapes everything that follows. Pick a feeling and I'll suggest where.`],
    picks: [],
    next: scenarioMenu,
    focus: null,
  };
}

export function welcome(): Reply {
  return {
    tone: "welcome",
    eyebrow: "Concierge",
    headline: "Where shall we begin?",
    body: ["Describe the holiday you have in mind, in your own words, or start with a feeling."],
    picks: [],
    next: scenarioMenu,
    focus: null,
  };
}

function scoreScenarios(text: string) {
  return scenarios
    .map((scenario) => ({ id: scenario.id, score: text.match(new RegExp(scenario.pattern, "gi"))?.length ?? 0 }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.id;
}

export function respond(input: string | Suggestion, current: Profile): { said: string; reply: Reply; profile: Profile } {
  if (typeof input !== "string") {
    const said = input.label;
    switch (input.kind) {
      case "scenario": {
        const profile = { ...current, style: input.id };
        return { said, reply: scenarioReply(input.id, profile), profile };
      }
      case "outline": {
        const profile = { ...current, destination: input.destination };
        return { said, reply: outlineReply(input.destination, profile), profile };
      }
      case "destination":
      case "quote": {
        const profile = { ...current, destination: input.destination };
        return { said, reply: destinationReply(input.destination, profile), profile };
      }
      case "brief":
        return { said, reply: briefReply(current), profile: current };
    }
  }

  const said = input.trim();
  let profile = readProfile(said, current);
  const place = places.find((item) => item.pattern.test(said))?.id;
  const wantsOutline = /itinerar|outline|sketch|plan|days?\b|schedule|week/i.test(said);
  const wantsBrief = /\bbook|quote|price|cost|how much|agent|designer|human|call me|contact/i.test(said);

  if (place) {
    profile = { ...profile, destination: place };
    if (wantsBrief) return { said, reply: briefReply(profile), profile };
    return { said, reply: wantsOutline ? outlineReply(place, profile) : destinationReply(place, profile), profile };
  }

  if (wantsBrief && (profile.style || profile.destination)) return { said, reply: briefReply(profile), profile };

  const style = scoreScenarios(said);
  if (style) {
    profile = { ...profile, style };
    return { said, reply: scenarioReply(style, profile), profile };
  }

  if (wantsOutline && profile.destination) return { said, reply: outlineReply(profile.destination, profile), profile };

  const learned = profile.when !== current.when || profile.party !== current.party || profile.budget !== current.budget;
  if (learned) {
    if (profile.style) return { said, reply: scenarioReply(profile.style, profile), profile };
    return { said, reply: notedReply(profile), profile };
  }

  return { said, reply: guideReply(), profile };
}
