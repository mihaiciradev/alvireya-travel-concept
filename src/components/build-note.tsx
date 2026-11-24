import type { ReactNode } from "react";

export function BuildNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`max-w-2xl border-l-2 border-gold/70 py-1 pl-5 ${className}`}>
      <p className="eyebrow text-[0.62rem] text-ink-muted">In a real build</p>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}
