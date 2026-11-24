"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { layers, statusLabel, type CapabilityStatus } from "@/content/capabilities";

const statusStyle: Record<CapabilityStatus, string> = {
  shown: "border-sky/60 text-sky",
  simulated: "border-paper/40 text-paper/80",
  build: "border-gold/60 text-gold",
};

const planePattern = [
  "bg-[linear-gradient(rgba(244,238,227,0.16)_1px,transparent_1px)] bg-[size:100%_18%]",
  "bg-[radial-gradient(rgba(95,179,218,0.55)_1.5px,transparent_2px)] bg-[size:22px_22px]",
  "bg-[repeating-linear-gradient(115deg,rgba(201,164,106,0.28)_0_1px,transparent_1px_16px)]",
  "bg-[linear-gradient(90deg,rgba(244,238,227,0.14)_1px,transparent_1px)] bg-[size:14%_100%]",
];

export function LayerExplorer() {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const keys: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1,
    };
    let next: number | null = null;
    if (event.key in keys) next = (active + keys[event.key] + layers.length) % layers.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = layers.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-6">
        <div className="relative mx-auto h-[20rem] max-w-[32rem] [perspective:1600px] sm:h-[30rem]" aria-hidden="true">
          {layers.map((layer, index) => {
            const lifted = index === active;
            const offset = (index - (layers.length - 1) / 2) * 17;
            return (
              <div
                key={layer.id}
                className="absolute inset-x-[14%] top-1/2 h-[44%] [transform-style:preserve-3d]"
                style={{ transform: `translateY(calc(-50% + ${offset}%))`, zIndex: layers.length - index }}
              >
                <div
                  className={`layer-plane absolute inset-0 rounded-[1.75rem] border ${planePattern[index]} ${lifted ? "border-sky bg-sky/15" : "border-paper/20 bg-paper/[0.04]"}`}
                  style={{
                    transform: `rotateX(62deg) rotateZ(-34deg) translateZ(${lifted ? 40 : 0}px)`,
                  }}
                >
                  <span
                    className={`eyebrow absolute top-4 left-5 text-[0.6rem] ${lifted ? "text-sky" : "text-paper/50"}`}
                  >
                    {layer.index} · {layer.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-6">
        <div role="tablist" aria-label="Layers behind the experience" aria-orientation="horizontal" className="flex flex-wrap gap-2">
          {layers.map((layer, index) => (
            <button
              key={layer.id}
              ref={(element) => {
                tabs.current[index] = element;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${layer.id}`}
              aria-selected={index === active}
              aria-controls={`${baseId}-panel-${layer.id}`}
              tabIndex={index === active ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={onKeyDown}
              className={`flex h-11 items-center gap-2 rounded-full border px-4 text-[0.9rem] transition-colors ${index === active ? "border-paper bg-paper text-ink" : "border-paper/25 text-paper/75 hover:border-paper/60 hover:text-paper"}`}
            >
              <span className="font-mono text-[0.7rem] opacity-80">{layer.index}</span>
              {layer.name}
            </button>
          ))}
        </div>

        {layers.map((layer, index) => (
          <div
            key={layer.id}
            role="tabpanel"
            id={`${baseId}-panel-${layer.id}`}
            aria-labelledby={`${baseId}-tab-${layer.id}`}
            hidden={index !== active}
            className="mt-8"
          >
            <p className="font-display text-[1.7rem] leading-snug text-paper">{layer.summary}</p>
            <ul className="mt-6 divide-y divide-paper/10 border-y border-paper/10">
              {layer.capabilities.map((capability) => (
                <li key={capability.name} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:gap-6">
                  <div>
                    <h3 className="text-[1.02rem] font-medium text-paper">{capability.name}</h3>
                    <p className="mt-1 text-[0.9rem] leading-relaxed text-paper/65">{capability.detail}</p>
                  </div>
                  <span
                    className={`eyebrow h-fit w-fit rounded-full border px-2.5 py-1 text-[0.56rem] whitespace-nowrap ${statusStyle[capability.status]}`}
                  >
                    {statusLabel[capability.status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
