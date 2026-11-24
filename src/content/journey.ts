import type { DestinationId } from "./destinations";

export type Stay = {
  id: string;
  name: string;
  kind: string;
  setting: string;
  bestFor: string;
  nightly: number;
};

export type Extra = {
  id: string;
  label: string;
  detail: string;
  price: number;
  per: "person" | "group" | "stay-percent";
};

export const stays: Record<DestinationId, Stay[]> = {
  lofoten: [
    { id: "skarv", name: "Skarv Sea Cabins", kind: "Restored fishing cabins", setting: "On stilts above the harbor", bestFor: "Slow mornings by the water", nightly: 240 },
    { id: "hvit", name: "Hvit Fjord Hotel", kind: "Small design hotel", setting: "Glass-walled sauna on the fjord", bestFor: "Comfort after big days outside", nightly: 390 },
    { id: "ridge", name: "The Ridge House", kind: "Private house", setting: "Alone under the peaks", bestFor: "Families and small groups", nightly: 560 },
  ],
  kyoto: [
    { id: "hanakago", name: "Ryokan Hanakago", kind: "Traditional inn", setting: "Quiet lane in Higashiyama", bestFor: "Kaiseki dinners and hot baths", nightly: 420 },
    { id: "kamo", name: "Kamo River Rooms", kind: "Minimal city hotel", setting: "On the river, near Gion", bestFor: "Walking everywhere", nightly: 260 },
    { id: "machiya", name: "Machiya No. 7", kind: "Restored townhouse", setting: "Private wooden house", bestFor: "Privacy and space", nightly: 480 },
  ],
  atacama: [
    { id: "estrella", name: "Estrella Domes", kind: "Desert domes", setting: "Telescope outside every door", bestFor: "Night-sky lovers", nightly: 310 },
    { id: "adobe", name: "Adobe & Sky Lodge", kind: "Lodge with guided days", setting: "Courtyards facing the volcanoes", bestFor: "Everything arranged for you", nightly: 460 },
    { id: "quebrada", name: "Quebrada House", kind: "Boutique guesthouse", setting: "Edge of San Pedro", bestFor: "Independent explorers", nightly: 220 },
  ],
  amalfi: [
    { id: "scalinata", name: "Casa Scalinata", kind: "Family-run hotel", setting: "Terraces above Positano", bestFor: "Views from breakfast", nightly: 340 },
    { id: "marea", name: "Hotel Marea Alta", kind: "Cliffside hotel", setting: "Private sea platform", bestFor: "Swimming and celebrating", nightly: 520 },
    { id: "terrazza", name: "Terrazza Nove", kind: "Suites in a palazzo", setting: "Above Amalfi's old town", bestFor: "Culture and long dinners", nightly: 380 },
  ],
};

export const signatureExtra: Record<DestinationId, Extra> = {
  lofoten: { id: "signature", label: "Aurora or midnight-sun boat trip", detail: "Timed around the forecast", price: 180, per: "person" },
  kyoto: { id: "signature", label: "Private tea ceremony", detail: "With a tea master in a temple garden", price: 95, per: "person" },
  atacama: { id: "signature", label: "Stargazing with an astronomer", detail: "Private session with telescopes", price: 110, per: "person" },
  amalfi: { id: "signature", label: "A day on a wooden gozzo", detail: "Private boat and skipper", price: 210, per: "person" },
};

export const commonExtras: Extra[] = [
  { id: "guide", label: "Local guide for two days", detail: "Someone who knows the quiet routes", price: 360, per: "group" },
  { id: "transfers", label: "Private transfers", detail: "Airport to door, both ways", price: 140, per: "group" },
  { id: "flex", label: "Flexible change terms", detail: "Example policy for the stay", price: 8, per: "stay-percent" },
];

export const planningFee = 150;
