"use client";

import {
  Bell, BriefcaseBusiness, Building2, CalendarCheck2, ContactRound, FileText,
  Gauge, LayoutDashboard, Menu, Search, Settings, Target, WalletCards, X,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { QuickAdd } from "./quick-add";

const workspace = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Opportunities", icon: Target, href: "/opportunities" },
  { label: "Contacts", icon: ContactRound, href: "/contacts" },
  { label: "Companies", icon: Building2, href: "/companies" },
  { label: "Activities", icon: CalendarCheck2, href: "/activities" },
];
const finance = [
  { label: "Invoices", icon: FileText, href: "/invoices" },
  { label: "Budget", icon: WalletCards, href: "/budget" },
  { label: "Reports", icon: Gauge, href: "/reports" },
];

function NavLink({ item, active }: { item: (typeof workspace)[number]; active: string }) {
  const Icon = item.icon;
  const selected = item.href === "/" ? active === "/" : active.startsWith(item.href);
  return <Link href={item.href} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${selected ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon size={18} /><span>{item.label}</span></Link>;
}

export function CrmShell({ children, activePath, search, onSearch }: { children: React.ReactNode; activePath: string; search?: string; onSearch?: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
    {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center justify-between px-6"><Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><BriefcaseBusiness size={20} /></span><span><span className="block text-[17px] font-bold tracking-tight text-slate-950">Studio CRM</span><span className="block text-xs text-slate-500">Business workspace</span></span></Link><button aria-label="Close navigation" className="rounded-lg p-2 text-slate-500 lg:hidden" onClick={() => setOpen(false)}><X size={19} /></button></div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6"><p className="px-3 pb-2 pt-5 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Workspace</p>{workspace.map((item) => <NavLink key={item.href} item={item} active={activePath} />)}<p className="px-3 pb-2 pt-7 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Finance</p>{finance.map((item) => <NavLink key={item.href} item={item} active={activePath} />)}</nav>
      <div className="border-t border-slate-100 p-3"><a href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"><Settings size={18} />Settings</a><div className="mt-2 flex items-center gap-3 rounded-xl p-3"><div className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">AV</div><div><p className="text-sm font-semibold">Andras Vargas</p><p className="text-xs text-slate-500">Workspace owner</p></div></div></div>
    </aside>
    <main className="lg:pl-[272px]"><header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-8"><button aria-label="Open navigation" className="rounded-lg p-2 text-slate-600 lg:hidden" onClick={() => setOpen(true)}><Menu size={21} /></button>{onSearch ? <div className="relative hidden max-w-md flex-1 sm:block"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={search} onChange={(event) => onSearch(event.target.value)} aria-label="Search" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="Search records..." />{search && <button type="button" aria-label="Clear search" onClick={() => onSearch("")} className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100"><X size={14} strokeWidth={2.5} /></button>}</div> : <div className="flex-1" />}<button aria-label="Notifications" className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600"><Bell size={19} /></button><QuickAdd /></header>{children}</main>
  </div>;
}
