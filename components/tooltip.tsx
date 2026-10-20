"use client";

import { ReactNode, useId } from "react";

/** Wraps a single focusable element and shows `label` above it on hover or keyboard focus. */
export function Tooltip({ label, children }: { label: string; children: (describedBy: string) => ReactNode }) {
  const id = useId();
  return <span className="group/tooltip relative inline-flex">
    {children(id)}
    <span id={id} role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">{label}</span>
  </span>;
}
