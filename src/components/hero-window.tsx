"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getDestination, type DestinationId } from "@/content/destinations";
import { WINDOW_EVENT } from "@/lib/events";

function useWindowDestination() {
  const [id, setId] = useState<DestinationId | null>(null);
  useEffect(() => {
    const onShow = (event: Event) => setId((event as CustomEvent<DestinationId | null>).detail);
    window.addEventListener(WINDOW_EVENT, onShow);
    return () => window.removeEventListener(WINDOW_EVENT, onShow);
  }, []);
  return id;
}

export function HeroWindowView() {
  const id = useWindowDestination();
  const [shown, setShown] = useState<DestinationId[]>([]);

  useEffect(() => {
    if (!id) return;
    const frame = requestAnimationFrame(() => setShown((list) => (list.includes(id) ? list : [...list, id])));
    return () => cancelAnimationFrame(frame);
  }, [id]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {shown.map((item) => {
        const destination = getDestination(item);
        return (
          <Image
            key={item}
            src={destination.photo.src}
            alt=""
            fill
            quality={68}
            sizes="(min-width: 1024px) 40vw, 92vw"
            data-active={item === id}
            className="window-view object-cover"
          />
        );
      })}
    </div>
  );
}

export function HeroWindowCaption({ fallback }: { fallback: string }) {
  const id = useWindowDestination();
  const destination = id ? getDestination(id) : null;
  return (
    <span aria-live="polite">
      {destination ? `Window seat · ${destination.name}, ${destination.country}, picked in conversation` : fallback}
    </span>
  );
}

export function BoardingDestination({ fallback }: { fallback: string }) {
  const id = useWindowDestination();
  return <>{id ? getDestination(id).name : fallback}</>;
}
