"use client";

import type { ReactNode } from "react";
import type { DestinationId } from "@/content/destinations";
import { selectDestination } from "@/lib/events";

type PlanLinkProps = {
  destination: DestinationId;
  className?: string;
  children: ReactNode;
};

export function PlanLink({ destination, className, children }: PlanLinkProps) {
  return (
    <a href="#journey" className={className} onClick={() => selectDestination(destination)}>
      {children}
    </a>
  );
}
