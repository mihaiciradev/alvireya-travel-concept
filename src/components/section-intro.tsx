import type { ReactNode } from "react";

type SectionIntroProps = {
  index: string;
  label: string;
  title: ReactNode;
  titleId: string;
  children?: ReactNode;
  tone?: "light" | "dark";
};

export function SectionIntro({ index, label, title, titleId, children, tone = "light" }: SectionIntroProps) {
  const dark = tone === "dark";
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <p className={`eyebrow flex h-fit items-center gap-3 lg:col-span-3 lg:pt-6 ${dark ? "text-gold" : "text-ink-muted"}`}>
        <span>{index}</span>
        <span aria-hidden="true" className="h-px w-8 bg-current opacity-50" />
        <span>{label}</span>
      </p>
      <div className="lg:col-span-9">
        <h2
          id={titleId}
          className={`headline max-w-[16ch] text-[clamp(2.6rem,6.4vw,5.4rem)] ${dark ? "text-paper" : "text-ink"}`}
        >
          {title}
        </h2>
        {children ? (
          <p className={`mt-7 max-w-2xl text-[1.08rem] leading-relaxed ${dark ? "text-paper/75" : "text-ink-soft"}`}>
            {children}
          </p>
        ) : null}
      </div>
    </div>
  );
}
