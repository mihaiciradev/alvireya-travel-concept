type MarkProps = { className?: string };

export function AlvireyaMark({ className }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <path d="M5 27 15 5.5 25 27" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="miter" />
      <path
        d="M8.7 19.2C14 18.6 20 16.4 27.6 11.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="27.8" cy="11" r="1.7" fill="var(--color-coral)" />
    </svg>
  );
}

type LogoProps = { size?: "sm" | "lg"; className?: string };

export function AlvireyaLogo({ size = "sm", className = "" }: LogoProps) {
  const large = size === "lg";
  return (
    <span className={`inline-flex items-center ${large ? "gap-3" : "gap-2.5"} ${className}`}>
      <AlvireyaMark className={large ? "h-8 w-8" : "h-[1.6rem] w-[1.6rem]"} />
      <span
        className={`font-display leading-none font-[360] tracking-[0.34em] ${large ? "text-[1.6rem]" : "text-[1.18rem]"} -mr-[0.34em]`}
      >
        ALVIREYA
      </span>
    </span>
  );
}
