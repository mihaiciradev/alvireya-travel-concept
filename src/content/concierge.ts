import { destinations, heroPhoto, type DestinationId, type Interest } from "./destinations";

export type ScenarioId = "romantic" | "luxury" | "adventure" | "beach" | "family" | "culture";

export type Suggestion =
  | { kind: "scenario"; id: ScenarioId; label: string }
  | { kind: "outline"; destination: DestinationId; label: string }
  | { kind: "destination"; destination: DestinationId; label: string }
  | { kind: "brief"; label: string }
  | { kind: "quote"; destination: DestinationId; label: string };

export type Pick = { id: DestinationId; why: string };

export type Scenario = {
  id: ScenarioId;
  label: string;
  prompt: string;
  image: { src: string; position: string };
  pattern: RegExp;
  headline: string;
  body: string;
  picks: Pick[];
  focus: Interest[];
  next: Suggestion[];
};

const photo = (id: DestinationId) => destinations.find((item) => item.id === id)!.photo.src;

const brief: Suggestion = { kind: "brief", label: "Send this brief to a travel designer" };

export const scenarios: Scenario[] = [
  {
    id: "romantic",
    label: "Romantic",
    prompt: "Something romantic, just the two of us",
    image: { src: photo("amalfi"), position: "50% 30%" },
    pattern: /romanc|romantic|honeymoon|anniversary|couple|propos|my (?:wife|husband|partner|girlfriend|boyfriend)/i,
    headline: "Two places that do romance quietly.",
    body: "Romance here means time rather than spectacle: long dinners, early light and nowhere to be. These two do it best in the collection.",
    picks: [
      { id: "amalfi", why: "Sunset from the water and lunches that drift into the evening." },
      { id: "kyoto", why: "Lantern-lit lanes, a ryokan bath and a kaiseki dinner for two." },
    ],
    focus: ["food", "slow"],
    next: [
      { kind: "outline", destination: "amalfi", label: "Sketch five days on the Amalfi Coast" },
      { kind: "scenario", id: "luxury", label: "Make it more secluded" },
      brief,
    ],
  },
  {
    id: "luxury",
    label: "Luxury",
    prompt: "A truly luxurious escape",
    image: { src: photo("atacama"), position: "50% 50%" },
    pattern: /luxur|five.?star|5.?star|exclusive|private|villa|suite|\bspa\b|indulg|treat (?:ourselves|myself)|high.?end|splurge|exceptional/i,
    headline: "Luxury, measured in privacy.",
    body: "The luxury people remember is space and access: a boat of your own, an astronomer for the evening, a garden opened early just for you.",
    picks: [
      { id: "atacama", why: "An adobe lodge facing the volcanoes, with a private stargazing session." },
      { id: "amalfi", why: "A cliffside suite and a wooden gozzo for coves nobody else reaches." },
      { id: "kyoto", why: "A ryokan with its own garden and a tea master at dawn." },
    ],
    focus: ["design", "skies"],
    next: [
      { kind: "outline", destination: "atacama", label: "Sketch five days in the Atacama" },
      { kind: "destination", destination: "kyoto", label: "Tell me more about Kyoto" },
      brief,
    ],
  },
  {
    id: "adventure",
    label: "Adventure",
    prompt: "Adventure and big landscapes",
    image: { src: photo("lofoten"), position: "50% 40%" },
    pattern: /adventur|hik|trek|active|wild|explor|aurora|northern lights|desert|mountain|outdoor|thrill|kayak|climb|landscape/i,
    headline: "Big landscapes, earned views.",
    body: "Days spent outdoors, evenings that feel deserved. Both places reward an early start and a good pair of boots.",
    picks: [
      { id: "lofoten", why: "Ridge hikes above Reine and aurora trips by boat." },
      { id: "atacama", why: "Salt flats at sunrise, lagoons at altitude and very dark skies." },
    ],
    focus: ["nature", "skies"],
    next: [
      { kind: "outline", destination: "lofoten", label: "Sketch five days in Lofoten" },
      { kind: "scenario", id: "family", label: "Could the kids come too?" },
      brief,
    ],
  },
  {
    id: "beach",
    label: "Beach",
    prompt: "Warm sea and beach days",
    image: { src: heroPhoto.src, position: "40% 50%" },
    pattern: /beach|\bsea\b|seaside|coast|swim|sunshine|island|ocean|coves?|warm water|sand/i,
    headline: "Sea light, warm water, slow days.",
    body: "The collection holds one true sea escape, and it is a fine one. Connected to an agency's inventory, this is where every beach property would appear.",
    picks: [{ id: "amalfi", why: "Coves reached only by boat, and a swim before breakfast." }],
    focus: ["slow", "food"],
    next: [
      { kind: "outline", destination: "amalfi", label: "Sketch five days by the sea" },
      { kind: "scenario", id: "romantic", label: "Make it romantic" },
      { kind: "scenario", id: "family", label: "Make it work for a family" },
    ],
  },
  {
    id: "family",
    label: "Family",
    prompt: "A family holiday that works for everyone",
    image: { src: photo("amalfi"), position: "50% 88%" },
    pattern: /family|famil|kids|children|child|toddler|teen|grandparents|multi.?gen/i,
    headline: "Easy days for every age.",
    body: "Short transfers, room to roam and something to wonder at every day. Two places that work across generations.",
    picks: [
      { id: "amalfi", why: "Short distances, boat days and gelato as currency." },
      { id: "lofoten", why: "Midnight sun in summer and cabins right by the water." },
    ],
    focus: ["nature", "slow"],
    next: [
      { kind: "outline", destination: "lofoten", label: "Sketch a summer week in Lofoten" },
      { kind: "scenario", id: "beach", label: "More time on the beach" },
      brief,
    ],
  },
  {
    id: "culture",
    label: "Culture",
    prompt: "Culture, craft and great food",
    image: { src: photo("kyoto"), position: "50% 35%" },
    pattern: /cultur|histor|temple|museum|\bart\b|craft|food|cuisine|cook|\btea\b|architect|heritage|city/i,
    headline: "Places with a long memory.",
    body: "Craft, ritual and food that tells you exactly where you are. Kyoto leads, with the villas and ceramic workshops of the Amalfi Coast close behind.",
    picks: [
      { id: "kyoto", why: "Temples before the crowds and craft studios with their makers." },
      { id: "amalfi", why: "Ravello's gardens, Vietri ceramics and a cooking class among the lemons." },
    ],
    focus: ["culture", "food"],
    next: [
      { kind: "outline", destination: "kyoto", label: "Sketch five days in Kyoto" },
      { kind: "scenario", id: "romantic", label: "Add something romantic" },
      brief,
    ],
  },
];

export const scenarioMenu: Suggestion[] = scenarios.map((scenario) => ({
  kind: "scenario",
  id: scenario.id,
  label: scenario.label,
}));

export const disclosure =
  "Interactive concierge demo. A production version connects to live AI, booking systems and your agency's own inventory.";
