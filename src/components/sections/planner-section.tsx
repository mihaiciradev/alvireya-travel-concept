import { Planner } from "../planner";
import { SectionIntro } from "../section-intro";

export function PlannerSection() {
  return (
    <section id="planner" aria-labelledby="planner-title" className="bg-mist">
      <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <SectionIntro
          index="02"
          label="Plan with a little help"
          titleId="planner-title"
          title={
            <>
              Start with a feeling. <em className="font-light">We&rsquo;ll find the place.</em>
            </>
          }
        >
          This is how an AI-assisted planner could sit inside a travel agency website: a few honest
          questions, then a first draft your team can refine. Here it runs on simple, transparent
          rules so you can try it safely.
        </SectionIntro>
        <div className="mt-14 md:mt-20">
          <Planner />
        </div>
      </div>
    </section>
  );
}
