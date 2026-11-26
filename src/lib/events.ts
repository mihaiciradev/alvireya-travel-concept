import type { DestinationId } from "@/content/destinations";

export const DESTINATION_EVENT = "alvireya:destination";
export const WINDOW_EVENT = "alvireya:window";

export function selectDestination(id: DestinationId) {
  window.dispatchEvent(new CustomEvent<DestinationId>(DESTINATION_EVENT, { detail: id }));
}

export function showInWindow(id: DestinationId | null) {
  window.dispatchEvent(new CustomEvent<DestinationId | null>(WINDOW_EVENT, { detail: id }));
}
