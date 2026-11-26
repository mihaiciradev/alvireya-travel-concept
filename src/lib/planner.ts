import {
  destinations,
  type DestinationId,
  type Interest,
  type Mood,
  type Season,
} from "@/content/destinations";

export type Budget = "considered" | "elevated" | "exceptional";

export type PlannerInput = {
  mood: Mood;
  season: Season;
  budget: Budget;
  travelers: number;
  interests: Interest[];
};

export type PlannerDay = { label: string; title: string; detail: string };

export type PlannerResult = {
  destinationId: DestinationId;
  nights: number;
  reasons: string[];
  days: PlannerDay[];
  estimate: { low: number; high: number; perPerson: boolean };
};

export const moods: { id: Mood; label: string; hint: string }[] = [
  { id: "restore", label: "Restore", hint: "Rest, water, long breakfasts" },
  { id: "wander", label: "Wander", hint: "Big landscapes, room to breathe" },
  { id: "discover", label: "Discover", hint: "Culture, craft, new flavors" },
  { id: "celebrate", label: "Celebrate", hint: "A milestone worth marking" },
];

export const seasons: { id: Season; label: string }[] = [
  { id: "winter", label: "Winter" },
  { id: "spring", label: "Spring" },
  { id: "summer", label: "Summer" },
  { id: "autumn", label: "Autumn" },
];

export const budgets: { id: Budget; label: string; range: string }[] = [
  { id: "considered", label: "Considered", range: "≈ €2–3.5k pp" },
  { id: "elevated", label: "Elevated", range: "≈ €3.5–6k pp" },
  { id: "exceptional", label: "Exceptional", range: "€6k+ pp" },
];

export const interests: { id: Interest; label: string }[] = [
  { id: "food", label: "Food & wine" },
  { id: "nature", label: "Nature" },
  { id: "design", label: "Design stays" },
  { id: "culture", label: "Culture" },
  { id: "skies", label: "Night skies" },
  { id: "slow", label: "Slow mornings" },
];

type Profile = {
  mood: Record<Mood, number>;
  season: Record<Season, number>;
  interests: Interest[];
  nightlyBase: number;
  seasonNote: Record<Season, string>;
  moodNote: Record<Mood, string>;
  arrival: PlannerDay;
  departure: PlannerDay;
  middle: (Omit<PlannerDay, "label"> & { tag: Interest })[];
};

const profiles: Record<DestinationId, Profile> = {
  lofoten: {
    mood: { restore: 2, wander: 3, discover: 1, celebrate: 1 },
    season: { winter: 3, spring: 1, summer: 3, autumn: 1 },
    interests: ["nature", "skies", "slow", "food"],
    nightlyBase: 250,
    seasonNote: {
      winter: "Winter brings long blue hours and a real chance of aurora.",
      spring: "Spring is quiet, bright and still snowy on the peaks.",
      summer: "Summer means the midnight sun and hikes at any hour.",
      autumn: "Autumn is moody and empty, with the first dark skies returning.",
    },
    moodNote: {
      restore: "Sea cabins and saunas make stillness easy here.",
      wander: "Few places put this much landscape within walking distance.",
      discover: "Fishing culture and Arctic food traditions run deep here.",
      celebrate: "An aurora over the fjord is hard to beat as a moment.",
    },
    arrival: {
      label: "Day 1",
      title: "Land in Bodø, cross to the islands",
      detail: "A short hop or ferry, then a sea cabin with the mountains outside the window.",
    },
    departure: {
      label: "Last day",
      title: "One more slow breakfast by the water",
      detail: "Coffee on the jetty before the drive back to the airport.",
    },
    middle: [
      { tag: "nature", title: "Ridge hike above Reine", detail: "A steep morning climb for the view everyone photographs, with a guide who knows the quiet routes." },
      { tag: "skies", title: "Aurora or midnight-sun boat trip", detail: "Out on the water when the sky does its best work, timed around the forecast." },
      { tag: "food", title: "Stockfish and seafood with a local family", detail: "Dinner in a working fishing village, cooked by people who still fish." },
      { tag: "slow", title: "Sauna, cold plunge, nowhere to be", detail: "A floating sauna, a book and an afternoon with no plan at all." },
      { tag: "design", title: "Gallery trail through the villages", detail: "Small studios and glassworks between Henningsvær and Nusfjord." },
      { tag: "culture", title: "Viking history at Borg", detail: "A reconstructed chieftain's longhouse and the stories behind it." },
    ],
  },
  kyoto: {
    mood: { restore: 2, wander: 1, discover: 3, celebrate: 2 },
    season: { winter: 1, spring: 3, summer: 1, autumn: 3 },
    interests: ["culture", "food", "design", "slow"],
    nightlyBase: 290,
    seasonNote: {
      winter: "Winter is calm and crisp, with temples almost to yourself.",
      spring: "Spring is blossom season: beautiful, busy, worth planning early.",
      summer: "Summer is hot and lively, with festivals in the evenings.",
      autumn: "Autumn turns the maples red and the light golden.",
    },
    moodNote: {
      restore: "Ryokan stays and garden mornings are restorative by design.",
      wander: "Walking between neighborhoods is the best way to see it.",
      discover: "Few cities hold this much craft, ritual and history.",
      celebrate: "A kaiseki dinner is a celebration in itself.",
    },
    arrival: {
      label: "Day 1",
      title: "Arrive by train, check into a ryokan",
      detail: "Slippers at the door, a hot bath and a quiet first dinner.",
    },
    departure: {
      label: "Last day",
      title: "Morning market, then the train",
      detail: "Pickles, sweets and knives from Nishiki before heading home.",
    },
    middle: [
      { tag: "culture", title: "Temples before the crowds", detail: "An early private walk through Higashiyama while the lanes are still empty." },
      { tag: "food", title: "Kaiseki dinner in Gion", detail: "A seasonal tasting menu that reads like a short story about the month." },
      { tag: "design", title: "Craft studios and machiya", detail: "Visits to a lacquer workshop and a restored townhouse with its owner." },
      { tag: "slow", title: "Tea ceremony and a garden afternoon", detail: "Matcha prepared slowly, then a moss garden with nowhere else to be." },
      { tag: "nature", title: "Bamboo and river in Arashiyama", detail: "A morning in the western hills, ending with a boat on the Hozu river." },
      { tag: "skies", title: "Evening lanterns in Pontocho", detail: "A slow stroll along the river as the alley lights come on." },
    ],
  },
  atacama: {
    mood: { restore: 1, wander: 3, discover: 2, celebrate: 1 },
    season: { winter: 1, spring: 3, summer: 2, autumn: 3 },
    interests: ["nature", "skies", "design"],
    nightlyBase: 330,
    seasonNote: {
      winter: "Northern winter is southern summer: warm days, occasional storms.",
      spring: "Spring months are clear, mild and good for altitude.",
      summer: "Northern summer brings cold, very clear desert nights.",
      autumn: "Autumn months are stable and ideal for stargazing.",
    },
    moodNote: {
      restore: "Lodge pools and silence do most of the work here.",
      wander: "The scale of the landscape is the whole point.",
      discover: "Geology, astronomy and Atacameño culture in one place.",
      celebrate: "Toasting under the Milky Way is a memorable way to mark it.",
    },
    arrival: {
      label: "Day 1",
      title: "Fly to Calama, drive into the desert",
      detail: "A gentle first day to adjust to the altitude in San Pedro.",
    },
    departure: {
      label: "Last day",
      title: "Sunrise over the salt flat",
      detail: "Flamingos in the early light before the drive back.",
    },
    middle: [
      { tag: "nature", title: "Valle de la Luna at golden hour", detail: "Ridges and dunes turning orange as the sun drops behind them." },
      { tag: "skies", title: "Stargazing with an astronomer", detail: "Telescopes, a clear sky and someone who can explain what you are seeing." },
      { tag: "design", title: "A lodge built from adobe and light", detail: "Earth walls, open courtyards and a pool facing the volcanoes." },
      { tag: "culture", title: "Villages of the altiplano", detail: "Adobe churches and a lunch of local quinoa and llama stew." },
      { tag: "slow", title: "Hot springs at Puritama", detail: "A morning soaking in thermal pools in a quiet canyon." },
      { tag: "food", title: "Desert tasting menu", detail: "Andean ingredients cooked over fire at a small lodge kitchen." },
    ],
  },
  amalfi: {
    mood: { restore: 3, wander: 1, discover: 1, celebrate: 3 },
    season: { winter: 0, spring: 3, summer: 2, autumn: 2 },
    interests: ["food", "slow", "design", "culture"],
    nightlyBase: 310,
    seasonNote: {
      winter: "Winter is very quiet here and many hotels close, so we would suggest another season.",
      spring: "Spring is ideal: warm, green, before the summer crowds.",
      summer: "Summer is glamorous and busy. Book early and start days early.",
      autumn: "Early autumn keeps the warm sea without the peak crowds.",
    },
    moodNote: {
      restore: "Sea views, long lunches and short distances make rest easy.",
      wander: "Clifftop paths reward the curious walker.",
      discover: "Ancient towns and a strong food culture to explore.",
      celebrate: "Few places feel as naturally celebratory.",
    },
    arrival: {
      label: "Day 1",
      title: "Naples to the coast, by car or boat",
      detail: "Arrive in time for a drink on the terrace as the light changes.",
    },
    departure: {
      label: "Last day",
      title: "A last swim before the transfer",
      detail: "Morning in the sea, lunch on the beach, then back to Naples.",
    },
    middle: [
      { tag: "food", title: "Lemon groves and a cooking class", detail: "Pick, cook and eat with a family that has farmed the terraces for generations." },
      { tag: "slow", title: "A day on a wooden gozzo", detail: "A traditional boat, hidden coves and lunch at a beach reached only by sea." },
      { tag: "design", title: "Ceramics in Vietri sul Mare", detail: "The workshops behind the tiles you have been admiring all week." },
      { tag: "culture", title: "Ravello's gardens and music", detail: "Villa gardens high above the sea, with an evening concert in season." },
      { tag: "nature", title: "Path of the Gods", detail: "The famous clifftop walk, started early with a local guide." },
      { tag: "skies", title: "Sunset from Positano by boat", detail: "The village lights coming on, seen from the water." },
    ],
  },
};

const budgetMultiplier: Record<Budget, number> = {
  considered: 1,
  elevated: 1.65,
  exceptional: 2.7,
};

const budgetNights: Record<Budget, number> = {
  considered: 6,
  elevated: 7,
  exceptional: 8,
};

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function sketchJourney(input: PlannerInput): PlannerResult {
  const ranked = destinations
    .map((destination, index) => {
      const profile = profiles[destination.id];
      const matched = input.interests.filter((interest) => profile.interests.includes(interest));
      const score =
        profile.mood[input.mood] * 3 +
        profile.season[input.season] * 2 +
        matched.length * 2 -
        index * 0.01;
      return { destination, profile, matched, score };
    })
    .sort((a, b) => b.score - a.score);

  const { destination, profile, matched } = ranked[0];
  const nights = budgetNights[input.budget];

  const preferred = profile.middle.filter((item) => input.interests.includes(item.tag));
  const others = profile.middle.filter((item) => !input.interests.includes(item.tag));
  const middle = [...preferred, ...others].slice(0, 3);
  const spans = ["Day 2", "Days 3–4", `Days 5–${nights}`];

  const days: PlannerDay[] = [
    profile.arrival,
    ...middle.map(({ title, detail }, index) => ({ label: spans[index], title, detail })),
    profile.departure,
  ];

  const interestLabels = matched.map(
    (id) => interests.find((item) => item.id === id)?.label.toLowerCase() ?? id,
  );

  const reasons = [
    profile.moodNote[input.mood],
    profile.seasonNote[input.season],
    interestLabels.length > 0
      ? `It suits your interest in ${formatList(interestLabels)}.`
      : `${destination.name} is a strong all-rounder when interests are open.`,
  ];

  const perPerson = profile.nightlyBase * budgetMultiplier[input.budget] * nights;
  const solo = input.travelers === 1 ? 1.45 : 1;

  return {
    destinationId: destination.id,
    nights,
    reasons,
    days,
    estimate: {
      low: roundTo(perPerson * solo * 0.9, 50),
      high: roundTo(perPerson * solo * 1.15, 50),
      perPerson: true,
    },
  };
}

function formatList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function outlineFor(id: DestinationId, focus: Interest[] = []): PlannerDay[] {
  const profile = profiles[id];
  const preferred = profile.middle.filter((item) => focus.includes(item.tag));
  const others = profile.middle.filter((item) => !focus.includes(item.tag));
  const labels = ["Day 2", "Day 3", "Day 4"];
  return [
    profile.arrival,
    ...[...preferred, ...others].slice(0, 3).map(({ title, detail }, index) => ({ label: labels[index], title, detail })),
    { ...profile.departure, label: "Day 5" },
  ];
}

export function seasonNoteFor(id: DestinationId, season: Season) {
  return profiles[id].seasonNote[season];
}
