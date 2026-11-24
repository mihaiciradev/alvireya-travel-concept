import { BuildNote } from "../build-note";
import { JourneyBuilder } from "../journey-builder";
import { SectionIntro } from "../section-intro";

export function JourneySection() {
  return (
    <section id="journey" aria-labelledby="journey-title">
      <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-36">
        <SectionIntro
          index="03"
          label="From maybe to booked"
          titleId="journey-title"
          title={
            <>
              A quote you can <em className="font-light">actually read.</em>
            </>
          }
        >
          Inspiration is only half the job. Here a traveler compares stays, shapes the trip and sees
          every line of the price before talking to anyone. Hotels and prices are fictional examples.
        </SectionIntro>
        <div className="mt-14 md:mt-20">
          <JourneyBuilder />
        </div>
        <BuildNote className="mt-14 md:mt-20">
          Stays and rates come from your connected suppliers, your margins are applied automatically,
          and your team approves each quote before it goes out. Accepted quotes can move straight into
          booking and payment.
        </BuildNote>
      </div>
    </section>
  );
}
