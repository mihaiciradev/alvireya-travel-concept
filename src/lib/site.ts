export const site = {
  name: "VOYRA",
  url: "https://voyra.webbinghub.io",
  title: "VOYRA — Future of Travel Agency Websites | WebbingHUB",
  description:
    "Explore VOYRA, an interactive travel website concept by WebbingHUB, showcasing modern design, AI-assisted travel experiences, and connected booking workflows.",
  studio: {
    name: "WebbingHUB",
    url: "https://webbinghub.io",
    contactUrl: "https://webbinghub.io/contact",
    travelUrl: "https://travel.webbinghub.io",
  },
} as const;

export const navigation = [
  { href: "#destinations", label: "Destinations" },
  { href: "#planner", label: "Plan" },
  { href: "#journey", label: "Book" },
  { href: "#behind", label: "Behind the experience" },
] as const;
