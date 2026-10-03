"use client";

import type { ComponentProps } from "react";
import { track } from "@/lib/analytics/client";
import type { ClientEvent } from "@/lib/analytics/events";

export function TrackedStudioLink({ placement, eventName = "studio_cta_click", onClick, ...props }: ComponentProps<"a"> & { placement: string; eventName?: ClientEvent }) {
  return <a {...props} onClick={(event) => { track(eventName, { placement }); onClick?.(event); }} />;
}
