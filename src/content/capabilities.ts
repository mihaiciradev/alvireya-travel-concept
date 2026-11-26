export type CapabilityStatus = "shown" | "simulated" | "build";

export type Capability = {
  name: string;
  detail: string;
  status: CapabilityStatus;
};

export type Layer = {
  id: string;
  index: string;
  name: string;
  summary: string;
  capabilities: Capability[];
};

export const statusLabel: Record<CapabilityStatus, string> = {
  shown: "Working on this page",
  simulated: "Simulated on this page",
  build: "Built for real agencies",
};

export const layers: Layer[] = [
  {
    id: "experience",
    index: "L1",
    name: "Experience",
    summary: "What your customers see, touch and remember.",
    capabilities: [
      { name: "Destination storytelling", detail: "Editorial pages that sell a place, not a product code.", status: "shown" },
      { name: "SEO and performance engineering", detail: "Server-rendered, built to load quickly on phones, and readable by search engines.", status: "shown" },
      { name: "Multilingual websites", detail: "Content, prices and search in every market you sell to.", status: "build" },
      { name: "Customer portals", detail: "Trips, documents, payments and changes in one signed-in place.", status: "build" },
    ],
  },
  {
    id: "intelligence",
    index: "L2",
    name: "Intelligence",
    summary: "Logic that turns a vague wish into a concrete proposal.",
    capabilities: [
      { name: "Personalized recommendations", detail: "Here, a fixed set of rules. In production, your inventory and history.", status: "simulated" },
      { name: "AI travel concierge", detail: "Here, curated scenarios. In production, live AI grounded in your inventory, with handover to your agents.", status: "simulated" },
      { name: "Automated quotations", detail: "Draft quotes built from live rates and your margins, ready for review.", status: "simulated" },
      { name: "Lead capture and qualification", detail: "Requests arrive structured, scored and routed to the right person.", status: "build" },
    ],
  },
  {
    id: "connections",
    index: "L3",
    name: "Connections",
    summary: "The plumbing between your website and the travel industry.",
    capabilities: [
      { name: "Supplier API integrations", detail: "Bed banks, hotel chains, DMCs and local partners over XML, SOAP or REST.", status: "build" },
      { name: "Multi-supplier hotel search", detail: "One search across several sources, mapped and de-duplicated.", status: "build" },
      { name: "Booking workflows", detail: "Holds, confirmations, changes and cancellations with clear states.", status: "build" },
      { name: "CRM integrations", detail: "Every inquiry and quote lands where your team already works.", status: "build" },
    ],
  },
  {
    id: "operations",
    index: "L4",
    name: "Operations",
    summary: "The tools your team uses behind the scenes.",
    capabilities: [
      { name: "Business process automation", detail: "Follow-ups, reminders and document generation without copy-paste.", status: "build" },
      { name: "Custom dashboards", detail: "Inquiries, quotes, conversion and supplier health in one view.", status: "build" },
      { name: "Internal tools", detail: "Back-office screens shaped around how your agents actually work.", status: "build" },
    ],
  },
];

export const workflow = {
  before: [
    "Inquiry arrives by email",
    "Agent checks several supplier portals",
    "Quote assembled in a spreadsheet",
    "Follow-up depends on memory",
  ],
  after: [
    "Guided request with dates and preferences",
    "One search across connected suppliers",
    "Draft quote generated for agent review",
    "CRM record and follow-ups created automatically",
  ],
};
