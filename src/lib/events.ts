import type { DestinationId } from "@/content/destinations";

export const DESTINATION_EVENT = "voyra:destination";

export function selectDestination(id: DestinationId) {
  window.dispatchEvent(new CustomEvent<DestinationId>(DESTINATION_EVENT, { detail: id }));
}
