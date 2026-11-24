"use client";

import { useEffect, useId, useState } from "react";
import { navigation } from "@/lib/site";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 items-center gap-2 rounded-full border border-ink/15 bg-paper/70 px-4 text-sm text-ink backdrop-blur"
      >
        {open ? "Close" : "Menu"}
        <span aria-hidden="true" className="flex w-4 flex-col gap-[5px]">
          <span className={`h-px bg-current transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`} />
          <span className={`h-px bg-current transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
        </span>
      </button>

      <nav
        id={menuId}
        aria-label="Main"
        hidden={!open}
        className="absolute inset-x-3 top-[4.25rem] rounded-3xl border border-ink/10 bg-paper p-6 shadow-[0_30px_60px_-30px_rgba(16,32,47,0.45)]"
      >
        <ul className="flex flex-col">
          {navigation.map((item, index) => (
            <li key={item.href} className="border-b border-ink/10 last:border-none">
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-4 py-4 font-display text-[1.7rem] text-ink"
              >
                <span className="eyebrow text-ink-muted">0{index + 1}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          onClick={() => setOpen(false)}
          className="mt-6 flex h-12 items-center justify-center rounded-full bg-ink text-[0.95rem] font-medium text-paper"
        >
          Build yours with WebbingHUB
        </a>
        <p className="eyebrow mt-4 text-center text-ink-muted">A travel experience concept by WebbingHUB</p>
      </nav>
    </div>
  );
}
