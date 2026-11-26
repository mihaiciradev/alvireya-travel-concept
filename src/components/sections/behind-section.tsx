import { workflow } from "@/content/capabilities";
import { site } from "@/lib/site";
import { ArrowUpRight } from "../icons";
import { LayerExplorer } from "../layer-explorer";
import { SectionIntro } from "../section-intro";

const honesty = [
  {
    title: "Real on this page",
    body: "The design, the storytelling, the accessibility work and the performance engineering. The hero concierge too: when live replies are on, it is a real AI model with a small daily allowance.",
  },
  {
    title: "Simulated on this page",
    body: "The planner logic, the hotels, the prices and the request form. ALVIREYA is not connected to any supplier, booking system or CRM.",
  },
  {
    title: "What WebbingHUB builds",
    body: "The connected version: supplier integrations, booking workflows, assistants and internal tools for a real agency.",
  },
];

export function BehindSection() {
  return (
    <section id="behind" aria-labelledby="behind-title" className="on-dark relative overflow-hidden bg-night text-paper">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(244,238,227,1)_1px,transparent_1px),linear-gradient(90deg,rgba(244,238,227,1)_1px,transparent_1px)] [background-size:72px_72px]"
      />
      <div className="relative mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <p className="eyebrow mb-10 inline-flex items-center gap-2 rounded-full border border-gold/40 px-3 py-1.5 text-[0.62rem] text-gold">
          ALVIREYA is a concept by WebbingHUB
        </p>
        <SectionIntro
          tone="dark"
          index="04"
          label="Behind the experience"
          titleId="behind-title"
          title={
            <>
              A website can be the <em className="font-light text-sky">front door</em> to your whole operation.
            </>
          }
        >
          Every screen you just used is an interface. Behind a real version of it sit the systems that
          make a travel business run. Here is how those layers fit together, and which parts this
          concept actually demonstrates.
        </SectionIntro>

        <div className="mt-16 md:mt-24">
          <LayerExplorer />
        </div>

        <div className="mt-24 md:mt-36">
          <h3 className="headline max-w-[22ch] text-[clamp(2rem,4.4vw,3.4rem)]">
            The same request, <em className="font-light text-gold">two very different days.</em>
          </h3>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[2rem] bg-paper/10 ring-1 ring-paper/10 lg:grid-cols-2">
            <div className="bg-night p-7 md:p-10">
              <p className="eyebrow text-paper/55">A typical agency workflow</p>
              <ol className="mt-7 space-y-5">
                {workflow.before.map((item, index) => (
                  <li key={item} className="flex items-baseline gap-5 text-[1.02rem] text-paper/70">
                    <span className="font-mono text-[0.75rem] text-paper/60">0{index + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-[#10263a] p-7 md:p-10">
              <p className="eyebrow text-sky">With a connected website</p>
              <ol className="mt-7 space-y-5">
                {workflow.after.map((item, index) => (
                  <li key={item} className="flex items-baseline gap-5 text-[1.02rem] text-paper">
                    <span className="font-mono text-[0.75rem] text-sky">0{index + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-[0.85rem] leading-relaxed text-paper/55">
            Your team stays in charge of every quote and every client. Automation removes the copying
            and chasing, not the expertise.
          </p>
        </div>

        <div className="mt-24 grid gap-10 border-t border-paper/15 pt-14 md:mt-32 md:grid-cols-3">
          {honesty.map((item) => (
            <div key={item.title}>
              <h3 className="eyebrow text-gold">{item.title}</h3>
              <p className="mt-4 text-[1rem] leading-relaxed text-paper/75">{item.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 max-w-3xl text-[1rem] leading-relaxed text-paper/75">
          Supplier connectivity is already part of WebbingHUB&rsquo;s work for travel businesses, through
          its{" "}
          <a
            href={site.studio.travelUrl}
            className="inline-flex items-center gap-1 text-paper underline decoration-gold/60 underline-offset-4 hover:decoration-gold"
          >
            TRAVEL by WebbingHUB
            <ArrowUpRight className="h-4 w-4" />
          </a>{" "}
          integrations for hotels, bed banks and tour operators.
        </p>
      </div>
    </section>
  );
}
