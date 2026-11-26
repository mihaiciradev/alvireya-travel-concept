import { describe, expect, it } from "vitest";
import { scenarioMenu, scenarios } from "@/content/concierge";
import { readProfile, respond, welcome } from "@/lib/concierge";

describe("profile reading", () => {
  it("picks up month, party and budget", () => {
    expect(readProfile("Two of us, early November, about 3000 euros each", {})).toMatchObject({
      when: "November",
      season: "autumn",
      party: "Two",
      budget: "€3000 each",
    });
  });

  it("recognises families, seasons and currencies", () => {
    expect(readProfile("A family trip with two kids this summer for £8k", {})).toMatchObject({
      party: "Family",
      season: "summer",
      budget: "£8k",
    });
  });

  it("does not read the verb may as a month", () => {
    expect(readProfile("We may want somewhere warm", {}).when).toBeUndefined();
    expect(readProfile("Somewhere warm in May", {}).when).toBe("May");
  });

  it("keeps what it already knew", () => {
    expect(readProfile("somewhere quiet", { party: "Solo", when: "March" })).toMatchObject({ party: "Solo", when: "March" });
  });
});

describe("conversation routing", () => {
  it.each([
    ["Our honeymoon, somewhere romantic", "romantic"],
    ["A five-star escape with a private villa", "luxury"],
    ["Hiking and the northern lights", "adventure"],
    ["Lazy beach days and warm sea", "beach"],
    ["Something easy with the kids", "family"],
    ["Temples, craft and great food", "culture"],
  ])("routes %j to the %s scenario", (text, tone) => {
    const { reply, profile } = respond(text, {});
    expect(reply.tone).toBe(tone);
    expect(profile.style).toBe(tone);
    expect(reply.picks.length).toBeGreaterThan(0);
    expect(reply.next.length).toBeGreaterThan(0);
  });

  it("personalises replies with what the visitor shared", () => {
    const { reply } = respond("A romantic trip for the two of us in November", {});
    expect(reply.body[0]).toMatch(/^For two, in November\./);
    expect(reply.picks[0].why).toMatch(/autumn|Autumn/);
  });

  it("answers destination questions and sketches itineraries", () => {
    expect(respond("Tell me about Kyoto", {}).reply).toMatchObject({ tone: "destination", focus: "kyoto" });
    const outline = respond("Can you plan five days in Lofoten?", {}).reply;
    expect(outline.tone).toBe("outline");
    expect(outline.outline?.days).toHaveLength(5);
  });

  it("builds a brief from the conversation", () => {
    let state = respond("Something romantic in September for two", {});
    state = respond({ kind: "outline", destination: "amalfi", label: "Sketch five days on the Amalfi Coast" }, state.profile);
    const { reply } = respond("How much would it cost?", state.profile);
    expect(reply.tone).toBe("brief");
    expect(reply.brief).toMatchObject({ style: "romantic", when: "September", party: "Two", destination: "amalfi" });
  });

  it("guides unsupported requests back to supported scenarios", () => {
    const { reply } = respond("What's the capital of Peru?", {});
    expect(reply.tone).toBe("guide");
    expect(reply.next).toEqual(scenarioMenu);
  });

  it("acknowledges details before a feeling is chosen", () => {
    expect(respond("Two of us in March", {}).reply.tone).toBe("noted");
  });

  it("offers every scenario on welcome", () => {
    expect(welcome().next.map((item) => item.label)).toEqual(scenarios.map((item) => item.label));
  });
});
