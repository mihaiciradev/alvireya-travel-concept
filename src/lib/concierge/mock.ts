import type { ModelClient } from "./engine";

const replies: { match: RegExp; text: string }[] = [
  {
    match: /cold|snow|aurora|north|winter/i,
    text: "Somewhere cold and quiet points north. **Lofoten** in late February gives you blue-hour light, sea cabins and a real chance of aurora, with hikes short enough to leave long evenings free.\n\n- Day 1: Bodø, ferry to the islands\n- Day 2: Ridge walk above Reine\n- Day 3: Aurora boat trip, timed to the forecast\n\nWould you travel as two, or with a group?\n[[cards: lofoten]]\n[[ask: Just the two of us | What would it roughly cost? | Something warmer instead]]",
  },
  {
    match: /.*/,
    text: "Here is a first idea. **Kyoto** in November pairs red maples with quiet temple mornings, while the **Amalfi Coast** in September keeps the warm sea without the peak crowds. Both suit an unhurried week.\n\nWhich matters more to you right now: food and culture, or water and long lunches?\n[[cards: kyoto, amalfi]]\n[[ask: Food and culture | Water and long lunches | Show me a 5-day outline]]\n[[go: planner]]",
  },
];

export function mockModel(): ModelClient {
  return {
    stream({ messages }, signal) {
      const last = messages[messages.length - 1]?.content ?? "";
      const reply = replies.find((item) => item.match.test(last))!.text;
      const chunks = reply.match(/[\s\S]{1,6}/g) ?? [];
      return {
        text: (async function* () {
          await new Promise((resolve) => setTimeout(resolve, 900));
          for (const chunk of chunks) {
            if (signal.aborted) throw signal.reason;
            await new Promise((resolve) => setTimeout(resolve, 22));
            yield chunk;
          }
        })(),
        final: async () => ({ inputTokens: 1800, outputTokens: Math.ceil(reply.length / 4), stopReason: "end_turn" }),
      };
    },
  };
}
