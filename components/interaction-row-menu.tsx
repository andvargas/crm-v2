"use client";

import { ExternalLink, MoreHorizontal, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH = 176;

const safeLink = (link?: string) => {
  const value = link?.trim();
  return value && /^https?:\/\//i.test(value) ? value : "";
};

export function InteractionRowMenu({ label, link, onEdit }: { label: string; link?: string; onEdit: () => void }) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const href = safeLink(link);

  useEffect(() => {
    if (!position) return;
    menu.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const close = (event: Event) => {
      if (event.target instanceof Node && (menu.current?.contains(event.target) || button.current?.contains(event.target))) return;
      setPosition(null);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setPosition(null); button.current?.focus(); } };
    const dismiss = () => setPosition(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [position]);

  const toggle = () => {
    if (position) return setPosition(null);
    const rect = button.current?.getBoundingClientRect();
    if (!rect) return;
    const height = href ? 92 : 50;
    const below = rect.bottom + 6 + height <= window.innerHeight;
    setPosition({ top: below ? rect.bottom + 6 : rect.top - 6 - height, left: Math.max(8, rect.right - MENU_WIDTH) });
  };

  const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50";

  return <>
    <button ref={button} type="button" onClick={(event) => { event.stopPropagation(); toggle(); }} onKeyDown={(event) => event.stopPropagation()} aria-haspopup="menu" aria-expanded={!!position} aria-label={`Actions for ${label}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><MoreHorizontal size={18} /></button>
    {position && createPortal(<div ref={menu} role="menu" tabIndex={-1} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} style={{ top: position.top, left: position.left, width: MENU_WIDTH }} className="fixed z-50 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
      <button type="button" role="menuitem" onClick={() => { setPosition(null); onEdit(); }} className={item}><Pencil size={15} className="text-slate-400" />Edit</button>
      {href && <a role="menuitem" href={href} target="_blank" rel="noopener noreferrer" onClick={() => setPosition(null)} className={item}><ExternalLink size={15} className="text-slate-400" />Open link</a>}
    </div>, document.body)}
  </>;
}
