import type { DestinationId } from "@/content/destinations";

const signals: Record<DestinationId, RegExp[]> = {
  lofoten: [/cold|snow|winter|aurora|northern|arctic|norway|fjord|hik|wild|cabin|quiet|midnight sun/i],
  kyoto: [/japan|kyoto|temple|culture|food|city|tea|craft|garden|blossom|autumn|maple|history/i],
  atacama: [/desert|star|sky|skies|chile|adventure|landscape|space|remote|hot spring|astronom/i],
  amalfi: [/italy|sea|beach|coast|honeymoon|romantic|summer|lemon|boat|swim|celebrat|anniversary|warm|wine/i],
};

function rank(text: string) {
  return (Object.keys(signals) as DestinationId[])
    .map((id, index) => ({
      id,
      score: signals[id].reduce((sum, pattern) => sum + (text.match(new RegExp(pattern, "gi"))?.length ?? 0), 0) - index * 0.01,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.id);
}

export function curatedMatch(text: string, context = ""): DestinationId[] {
  const direct = rank(text);
  if (direct.length) return direct;
  const earlier = rank(context);
  return earlier.length ? earlier : ["kyoto", "lofoten"];
}

export const starters = [
  "A quiet week somewhere cold, with real silence",
  "Honeymoon in September, around €5k each",
  "Big landscapes and dark skies in spring",
  "A food-first city trip for two in autumn",
];
