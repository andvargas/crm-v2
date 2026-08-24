"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  ChevronDown,
  CircleDollarSign,
  ContactRound,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Target,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Opportunities", icon: Target, count: 12 },
  { label: "Contacts", icon: ContactRound },
  { label: "Companies", icon: Building2 },
  { label: "Activities", icon: CalendarCheck2, count: 4 },
];

const financeNavigation = [
  { label: "Invoices", icon: FileText },
  { label: "Budget", icon: WalletCards },
  { label: "Reports", icon: Gauge },
];

const metrics = [
  { label: "Pipeline value", value: "£48,250", detail: "12 open opportunities", change: "+8.2%", positive: true, icon: CircleDollarSign },
  { label: "Activities due", value: "7", detail: "4 need attention today", change: "Today", positive: false, icon: CalendarCheck2 },
  { label: "Outstanding", value: "£6,480", detail: "Across 5 invoices", change: "2 overdue", positive: false, icon: FileText },
  { label: "Monthly budget", value: "72%", detail: "£7,180 of £10,000", change: "On track", positive: true, icon: WalletCards },
];

const activities = [
  { initials: "AM", name: "Alex Morgan", company: "Northstar Studio", action: "Proposal follow-up", time: "09:30", tone: "indigo" },
  { initials: "SC", name: "Sofia Chen", company: "Field & Form", action: "Discovery call", time: "11:00", tone: "emerald" },
  { initials: "RB", name: "Radu Balan", company: "Constructiv", action: "Invoice #1048 due", time: "Today", tone: "amber" },
  { initials: "LH", name: "Laura Hill", company: "Paper Kite", action: "Send project estimate", time: "Tomorrow", tone: "rose" },
];

const opportunities = [
  { company: "Northstar Studio", contact: "Alex Morgan", stage: "Proposal", value: "£12,500", date: "30 Aug", tone: "violet" },
  { company: "Field & Form", contact: "Sofia Chen", stage: "Qualified", value: "£8,200", date: "4 Sep", tone: "sky" },
  { company: "Constructiv", contact: "Radu Balan", stage: "Negotiation", value: "£18,000", date: "12 Sep", tone: "amber" },
  { company: "Paper Kite", contact: "Laura Hill", stage: "New lead", value: "£4,750", date: "18 Sep", tone: "slate" },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><BriefcaseBusiness size={20} /></div>
            <div><p className="text-[17px] font-bold tracking-tight text-slate-950">Studio CRM</p><p className="text-xs text-slate-500">Business workspace</p></div>
          </div>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onClose}><X size={19} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <p className="px-3 pb-2 pt-5 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Workspace</p>
          {navigation.map((item) => <NavItem key={item.label} {...item} />)}
          <p className="px-3 pb-2 pt-7 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Finance</p>
          {financeNavigation.map((item) => <NavItem key={item.label} {...item} />)}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <NavItem label="Settings" icon={Settings} />
          <button className="mt-2 flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50">
            <div className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">AV</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">Andras Vargas</p><p className="truncate text-xs text-slate-500">Workspace owner</p></div>
            <MoreHorizontal size={17} className="text-slate-400" />
          </button>
        </div>
      </aside>
    </>
  );
}

function NavItem({ label, icon: Icon, active, count }: { label: string; icon: typeof LayoutDashboard; active?: boolean; count?: number }) {
  return <button className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon size={18} strokeWidth={active ? 2.3 : 1.9} /><span className="flex-1 text-left">{label}</span>{count ? <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-indigo-100" : "bg-slate-100 text-slate-500"}`}>{count}</span> : null}</button>;
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-8">
          <button aria-label="Open navigation" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div className="relative hidden max-w-md flex-1 sm:block"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input aria-label="Search CRM" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="Search contacts, companies, invoices..." /></div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"><Bell size={19} /><span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-rose-500" /></button>
            <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><Plus size={18} /><span className="hidden sm:inline">Quick add</span><ChevronDown className="hidden sm:inline" size={15} /></button>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-7 md:px-8 md:py-9">
          <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="mb-1 text-sm font-medium text-indigo-600">Sunday, 23 August</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-[34px]">Good afternoon, Andras</h1><p className="mt-2 text-sm text-slate-500">Here’s what needs your attention across the business.</p></div>
            <button className="flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm"><CalendarCheck2 size={16} />This month<ChevronDown size={15} /></button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, detail, change, positive, icon: Icon }) => (
              <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03)]">
                <div className="mb-5 flex items-start justify-between"><div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon size={19} /></div><span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${positive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{change}</span></div>
                <p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-xs text-slate-400">{detail}</p>
              </article>
            ))}
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.85fr]">
            <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-950">Active opportunities</h2><p className="mt-0.5 text-xs text-slate-500">Your current sales pipeline</p></div><button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View pipeline</button></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400"><th className="px-5 py-3 font-semibold">Company</th><th className="px-4 py-3 font-semibold">Stage</th><th className="px-4 py-3 font-semibold">Value</th><th className="px-4 py-3 font-semibold">Close date</th><th /></tr></thead><tbody>{opportunities.map((item) => <tr key={item.company} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"><td className="px-5 py-4"><p className="text-sm font-semibold text-slate-900">{item.company}</p><p className="mt-0.5 text-xs text-slate-400">{item.contact}</p></td><td className="px-4 py-4"><span className={`stage stage-${item.tone}`}>{item.stage}</span></td><td className="px-4 py-4 text-sm font-semibold">{item.value}</td><td className="px-4 py-4 text-sm text-slate-500">{item.date}</td><td className="px-4"><button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div>
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-950">Next activities</h2><p className="mt-0.5 text-xs text-slate-500">Your upcoming work</p></div><button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><MoreHorizontal size={19} /></button></div>
              <div className="p-2">{activities.map((item) => <div key={item.name} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-50"><div className={`avatar avatar-${item.tone}`}>{item.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{item.action}</p><p className="truncate text-xs text-slate-400">{item.name} · {item.company}</p></div><span className="text-xs font-medium text-slate-500">{item.time}</span></div>)}</div>
              <div className="border-t border-slate-100 p-4"><button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Plus size={16} />Add activity</button></div>
            </article>
          </section>

          <section className="mt-5 grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl bg-slate-950 p-5 text-white md:col-span-2"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Pipeline snapshot</p><h2 className="mt-2 text-xl font-bold">£48,250 in active opportunities</h2><p className="mt-1 text-sm text-slate-400">Weighted forecast: £28,930</p></div><UsersRound className="text-slate-600" size={28} /></div><div className="mt-7 flex h-2 overflow-hidden rounded-full bg-slate-800"><span className="w-[18%] bg-sky-400" /><span className="w-[27%] bg-indigo-400" /><span className="w-[35%] bg-violet-400" /><span className="w-[20%] bg-emerald-400" /></div><div className="mt-3 flex justify-between text-[11px] text-slate-400"><span>New £8.7k</span><span>Qualified £13k</span><span>Proposal £16.8k</span><span>Won £9.7k</span></div></article>
            <article className="rounded-2xl border border-slate-200/80 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">Contacts added</p><p className="mt-1 text-2xl font-bold">24</p></div><div className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><UsersRound size={19} /></div></div><div className="mt-5 flex items-end gap-1.5">{[30,45,34,60,52,73,90,65,82,100,74,92].map((height, i) => <span key={i} className="flex-1 rounded-t bg-indigo-100 last:bg-indigo-500" style={{ height: `${height * .45}px` }} />)}</div><p className="mt-2 text-xs text-emerald-600">↑ 18% from last month</p></article>
          </section>
        </div>
      </main>
    </div>
  );
}
