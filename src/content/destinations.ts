export type DestinationId = "lofoten" | "kyoto" | "atacama" | "amalfi";
export type Mood = "restore" | "wander" | "discover" | "celebrate";
export type Season = "winter" | "spring" | "summer" | "autumn";
export type Interest = "food" | "nature" | "design" | "culture" | "skies" | "slow";

export type Photo = {
  src: string;
  alt: string;
  credit: { name: string; url: string };
};

export type Destination = {
  id: DestinationId;
  name: string;
  country: string;
  coordinates: string;
  mood: string;
  headline: string;
  story: string;
  bestTime: string;
  idealStay: string;
  pace: string;
  accent: string;
  tint: string;
  photo: Photo;
};

export const heroPhoto: Photo = {
  src: "https://images.unsplash.com/photo-1560260240-982812cf588c",
  alt: "Aerial view of a warm sandy beach meeting turquoise surf, with two tiny figures casting long shadows on the sand",
  credit: {
    name: "Silas Baisch",
    url: "https://unsplash.com/photos/an-aerial-view-of-a-beach-and-ocean-fKYFUs0UE0s",
  },
};

export const destinations: Destination[] = [
  {
    id: "lofoten",
    name: "Lofoten",
    country: "Norway",
    coordinates: "68.2° N · 13.6° E",
    mood: "Arctic light",
    headline: "Mountains that rise straight out of the sea.",
    story:
      "Red fishing cabins, granite peaks and a light that behaves differently this far north. In winter the aurora moves overhead. In summer the sun barely sets, and nobody seems to mind.",
    bestTime: "Feb–Mar for aurora, Jun–Jul for midnight sun",
    idealStay: "6–8 nights",
    pace: "Slow, wild, outdoors",
    accent: "#3f6d86",
    tint: "#e6ecec",
    photo: {
      src: "https://images.unsplash.com/photo-1663428520845-056989f8a664",
      alt: "Red and white fishing cabins on the water at Hamnøy in Lofoten, with steep snow-streaked mountains behind",
      credit: {
        name: "Benoît Deschasaux",
        url: "https://unsplash.com/photos/a-group-of-houses-by-a-body-of-water-with-mountains-in-the-background-with-lofoten-in-the-background-ut7XZMquCoU",
      },
    },
  },
  {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    coordinates: "35.0° N · 135.8° E",
    mood: "Quiet rituals",
    headline: "A city that rewards the early riser.",
    story:
      "Temple gardens before the crowds arrive, dinners that read like a calendar of the season, and wooden townhouses where time feels negotiable. Kyoto is best taken one neighborhood at a time.",
    bestTime: "Late Mar–Apr for blossom, Nov for autumn color",
    idealStay: "5–7 nights",
    pace: "Unhurried, curious",
    accent: "#a2433a",
    tint: "#f1e4df",
    photo: {
      src: "https://images.unsplash.com/photo-1761141954476-2921e2e43e99",
      alt: "A traditional pagoda above Kyoto at sunset, framed by cherry blossoms and distant mountains",
      credit: {
        name: "Nathalie Lays",
        url: "https://unsplash.com/photos/traditional-japanese-temple-with-cherry-blossoms-at-sunset-4Q-Rbu8Ipcg",
      },
    },
  },
  {
    id: "atacama",
    name: "Atacama",
    country: "Chile",
    coordinates: "22.9° S · 68.2° W",
    mood: "Under clear skies",
    headline: "One of the driest places on Earth, and the clearest nights.",
    story:
      "Salt flats, wind-carved ridges and lagoons at altitude. Days are bright and enormous. After dark, the sky above San Pedro is among the best anywhere for seeing the Milky Way with your own eyes.",
    bestTime: "Mar–May and Sep–Nov",
    idealStay: "5–6 nights",
    pace: "Adventurous, spacious",
    accent: "#b0562d",
    tint: "#f2e3d6",
    photo: {
      src: "https://images.unsplash.com/photo-1556741495-4a9f3c6935e8",
      alt: "Wind-carved ridges of the Atacama Desert glowing orange in low sun near San Pedro de Atacama",
      credit: {
        name: "Vinícius Henrique Photography",
        url: "https://unsplash.com/photos/landscape-photography-of-rock-mountain-A7GwggrhXm4",
      },
    },
  },
  {
    id: "amalfi",
    name: "Amalfi Coast",
    country: "Italy",
    coordinates: "40.6° N · 14.6° E",
    mood: "Long afternoons",
    headline: "Lemon groves, sea light, and nowhere to rush.",
    story:
      "Pastel villages stacked on cliffs, boats instead of roads, and lunches that drift into the evening. Made for travelers who want their beauty with a slower clock.",
    bestTime: "May–Jun and September",
    idealStay: "5–7 nights",
    pace: "Easy, sociable",
    accent: "#1f6f8b",
    tint: "#e3edee",
    photo: {
      src: "https://images.unsplash.com/photo-1612698093158-e07ac200d44e",
      alt: "Colorful houses stacked on a rocky cliffside above turquoise water on the Amalfi Coast",
      credit: {
        name: "Tom Podmore",
        url: "https://unsplash.com/photos/colorful-buildings-on-amalfi-cliffside-1zkHXas1GIo",
      },
    },
  },
];

export function getDestination(id: DestinationId): Destination {
  const destination = destinations.find((item) => item.id === id);
  if (!destination) {
    throw new Error(`Unknown destination: ${id}`);
  }
  return destination;
}
