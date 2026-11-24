"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Destination } from "@/content/destinations";

type StageItem = Pick<Destination, "id" | "name" | "country" | "coordinates" | "tint" | "photo">;

export function DestinationStage({ items }: { items: StageItem[] }) {
  const [active, setActive] = useState(items[0].id);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = ref.current?.closest("section");
    if (!section) return;
    const chapters = section.querySelectorAll<HTMLElement>("[data-chapter]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-chapter");
            const match = items.find((item) => item.id === id);
            if (match) {
              setActive(match.id);
              section.style.setProperty("--tint", match.tint);
            }
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    chapters.forEach((chapter) => observer.observe(chapter));
    return () => observer.disconnect();
  }, [items]);

  const current = items.find((item) => item.id === active) ?? items[0];

  return (
    <div ref={ref} className="sticky top-24 h-[calc(100svh-8rem)] max-h-[860px]">
      <div className="relative h-full overflow-hidden rounded-[2.25rem] bg-ink">
        {items.map((item) => (
          <div key={item.id} className="stage-image absolute inset-0" data-active={item.id === active}>
            <Image
              src={item.photo.src}
              alt={item.photo.alt}
              fill
              quality={70}
              fetchPriority="low"
              sizes="(min-width: 1440px) 680px, 48vw"
              className="object-cover"
            />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(12,24,36,0.65),transparent_45%)]" />
        <div className="absolute inset-x-8 bottom-8 flex items-end justify-between gap-6 text-paper" aria-live="polite">
          <div>
            <p className="eyebrow text-paper/75">{current.coordinates}</p>
            <p className="mt-2 font-display text-4xl">
              {current.name}
              <span className="text-paper/70">, {current.country}</span>
            </p>
          </div>
          <ol className="flex gap-1.5" aria-hidden="true">
            {items.map((item) => (
              <li
                key={item.id}
                className={`h-1 rounded-full transition-all duration-500 ${item.id === active ? "w-8 bg-paper" : "w-3 bg-paper/40"}`}
              />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
