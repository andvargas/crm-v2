"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle, Bell, BriefcaseBusiness, Building2, CalendarCheck2,
  CircleDot, ContactRound, FileText, Gauge, LayoutDashboard, Menu, MoreHorizontal,
  RefreshCw, Search, Settings, Target, WalletCards, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { companyId } from "../lib/crm";
import { QuickAdd } from "../components/quick-add";
import { InteractionEditor } from "../components/interaction-editor";

type Contact = {
  _id: string;
  name?: { fullName?: string; firstName?: string; lastName?: string };
  email?: string;
  jobTitle?: string;
  company?: string;
  updatedAt: string;
  interactions?: { updatedAt?: string }[];
};

type Company = {
  _id: string;
  name?: { companyName?: string };
  industry?: string;
  updatedAt: string;
  contacts?: Contact[];
};

type Interaction = {
  _id: string;
  fullName?: string;
  companyName?: string;
  type?: string;
  channel?: string;
  leadStatus?: string;
  leadStages?: string[];
  note?: string;
  comms?: { _id?: string; outcome?: string; timeStamp?: string }[];
  createdAt?: string;
  updatedAt: string;
};

function useCrmData() {
  const contacts = useQuery({ queryKey: ["contacts"], queryFn: () => api<Contact[]>("/contacts") });
  const companies = useQuery({ queryKey: ["companies"], queryFn: () => api<Company[]>("/companies") });
  const interactions = useQuery({ queryKey: ["interactions"], queryFn: () => api<Interaction[]>("/interactions") });
  return {
    contacts: contacts.data ?? [], companies: companies.data ?? [], interactions: interactions.data ?? [],
    isLoading: contacts.isLoading || companies.isLoading || interactions.isLoading,
    error: contacts.error || companies.error || interactions.error,
    refresh: () => Promise.all([contacts.refetch(), companies.refetch(), interactions.refetch()]),
    isFetching: contacts.isFetching || companies.isFetching || interactions.isFetching,
  };
}

const financeNavigation = [
  { label: "Invoices", icon: FileText }, { label: "Budget", icon: WalletCards }, { label: "Reports", icon: Gauge },
];

function Sidebar({ open, onClose, counts }: { open: boolean; onClose: () => void; counts: { contacts: number; companies: number; activities: number } }) {
  const navigation = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Opportunities", icon: Target },
    { label: "Contacts", icon: ContactRound, count: counts.contacts },
    { label: "Companies", icon: Building2, count: counts.companies },
    { label: "Activities", icon: CalendarCheck2, count: counts.activities },
  ];
  return <>
    {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={onClose} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center justify-between px-6"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><BriefcaseBusiness size={20} /></div><div><p className="text-[17px] font-bold tracking-tight text-slate-950">Studio CRM</p><p className="text-xs text-slate-500">Business workspace</p></div></div><button aria-label="Close navigation" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={onClose}><X size={19} /></button></div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6"><p className="px-3 pb-2 pt-5 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Workspace</p>{navigation.map((item) => <NavItem key={item.label} {...item} />)}<p className="px-3 pb-2 pt-7 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Finance</p>{financeNavigation.map((item) => <NavItem key={item.label} {...item} />)}</nav>
      <div className="border-t border-slate-100 p-3"><NavItem label="Settings" icon={Settings} /><button className="mt-2 flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50"><div className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">AV</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">Andras Vargas</p><p className="truncate text-xs text-slate-500">Workspace owner</p></div><MoreHorizontal size={17} className="text-slate-400" /></button></div>
    </aside>
  </>;
}

function NavItem({ label, icon: Icon, active, count }: { label: string; icon: typeof LayoutDashboard; active?: boolean; count?: number }) {
  const href: Record<string, string> = { Dashboard: "/", Opportunities: "/opportunities", Contacts: "/contacts", Companies: "/companies", Activities: "/activities", Invoices: "/invoices", Budget: "/budget", Reports: "/reports", Settings: "/settings" };
  return <a href={href[label] || "#"} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon size={18} /><span className="flex-1 text-left">{label}</span>{count !== undefined && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{count}</span>}</a>;
}

const contactName = (contact: Contact) => contact.name?.fullName || [contact.name?.firstName, contact.name?.lastName].filter(Boolean).join(" ") || "Unnamed contact";
const formatDate = (date: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "?";
const normalize = (value?: string) => (value || "Unspecified").replaceAll("-", " ");

function LoadingDashboard() {
  return <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-40 rounded-2xl border border-slate-200 bg-white p-5"><div className="size-10 rounded-xl bg-slate-100" /><div className="mt-5 h-4 w-24 rounded bg-slate-100" /><div className="mt-3 h-7 w-16 rounded bg-slate-100" /></div>)}</div>;
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const data = useCrmData();
  const sortedInteractions = useMemo(() => [...data.interactions].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)), [data.interactions]);
  const companyNames = useMemo(() => new Map(data.companies.map((company) => [company._id, company.name?.companyName || "Unknown company"])), [data.companies]);
  const recentContacts = useMemo(() => {
    const latestActivity = (contact: Contact) => Math.max(0, ...(contact.interactions ?? []).map((item) => Date.parse(item.updatedAt || "") || 0));
    const term = search.trim().toLowerCase();
    return [...data.contacts].sort((a, b) => latestActivity(b) - latestActivity(a)).filter((contact) => {
      if (!term) return true;
      const linkedCompany = companyId(contact);
      return [contactName(contact), contact.email, contact.jobTitle, linkedCompany ? companyNames.get(linkedCompany) : undefined]
        .some((value) => value?.toLowerCase().includes(term));
    }).slice(0, 5);
  }, [companyNames, data.contacts, search]);
  const openLeads = useMemo(() => data.interactions.filter((item) => !["closed", "closed won", "rejected"].includes((item.leadStatus || "").toLowerCase())).length, [data.interactions]);
  const statuses = useMemo(() => {
    const counts = new Map<string, number>();
    data.interactions.forEach((item) => counts.set(normalize(item.leadStatus), (counts.get(normalize(item.leadStatus)) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [data.interactions]);
  const filteredInteractions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sortedInteractions.filter((item) => !term || [item.fullName, item.companyName, item.type, item.leadStatus, item.note].some((value) => value?.toLowerCase().includes(term))).slice(0, 6);
  }, [search, sortedInteractions]);

  const metrics = [
    { label: "Contacts", value: data.contacts.length, detail: `${data.contacts.filter((item) => item.email).length} with email addresses`, icon: ContactRound, tone: "indigo" },
    { label: "Companies", value: data.companies.length, detail: `${data.companies.filter((item) => item.contacts?.length).length} with linked contacts`, icon: Building2, tone: "sky" },
    { label: "Interactions", value: data.interactions.length, detail: `${sortedInteractions[0] ? `Last updated ${formatDate(sortedInteractions[0].updatedAt)}` : "No activity yet"}`, icon: CalendarCheck2, tone: "emerald" },
    { label: "Open leads", value: openLeads, detail: "Based on current lead status", icon: Target, tone: "amber" },
  ];

  return <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
    <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} counts={{ contacts: data.contacts.length, companies: data.companies.length, activities: data.interactions.length }} />
    <main className="lg:pl-[272px]">
      <header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-8"><button aria-label="Open navigation" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button><div className="relative hidden max-w-md flex-1 sm:block"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search interactions" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="Search interactions, contacts, companies..." />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100"><X size={14} strokeWidth={2.5} /></button>}</div><div className="ml-auto flex items-center gap-2"><button aria-label="Notifications" className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"><Bell size={19} /></button><QuickAdd /></div></header>
      <div className="mx-auto max-w-[1500px] px-4 py-7 md:px-8 md:py-9">
        <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-sm font-medium text-indigo-600">Live workspace</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-[34px]">Good to see you, Andras</h1><p className="mt-2 text-sm text-slate-500">A live overview of your CRM data.</p></div><button onClick={() => data.refresh()} disabled={data.isFetching} className="flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-60"><RefreshCw size={16} className={data.isFetching ? "animate-spin" : ""} />Refresh data</button></section>

        {data.error ? <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800"><AlertCircle className="mt-0.5 shrink-0" size={19} /><div><p className="text-sm font-semibold">The CRM API could not be reached</p><p className="mt-1 text-xs text-rose-700">Check that the local PM2 backend is running on port 8000, then refresh.</p></div></div> : null}
        {search.trim() ? null : data.isLoading ? <LoadingDashboard /> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, detail, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03)]"><div className={`metric-icon metric-icon-${tone}`}><Icon size={19} /></div><p className="mt-5 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></article>)}</section>}

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
          <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-950">Recent interactions</h2><p className="mt-0.5 text-xs text-slate-500">Latest enquiries, calls and messages</p></div><span className="text-xs font-semibold text-slate-400">{filteredInteractions.length} shown</span></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400"><th className="px-5 py-3 font-semibold">Contact / company</th><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Updated</th><th /></tr></thead><tbody>{filteredInteractions.map((item) => <tr key={item._id} role="button" tabIndex={0} onClick={() => setEditingInteraction(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setEditingInteraction(item); } }} className="cursor-pointer border-b border-slate-100 outline-none last:border-0 hover:bg-slate-50/70 focus:bg-indigo-50/60"><td className="px-5 py-4"><p className="text-sm font-semibold text-slate-900">{item.fullName || item.companyName || "Unnamed interaction"}</p><p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">{item.companyName && item.fullName ? item.companyName : item.note || "No note"}</p></td><td className="px-4 py-4"><span className="stage stage-slate capitalize">{normalize(item.type)}</span></td><td className="px-4 py-4 text-sm capitalize text-slate-600">{normalize(item.leadStatus)}</td><td className="px-4 py-4 text-sm text-slate-500">{formatDate(item.updatedAt)}</td><td className="px-4"><button type="button" onClick={(event) => { event.stopPropagation(); setEditingInteraction(item); }} aria-label={`View interaction for ${item.fullName || item.companyName || "unnamed record"}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table>{!data.isLoading && filteredInteractions.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No interactions match your search.</p>}</div></article>
          <article className="rounded-2xl border border-slate-200/80 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-950">Recent contacts</h2><p className="mt-0.5 text-xs text-slate-500">{search.trim() ? "Matching contacts by latest interaction" : "Sorted by latest interaction"}</p></div><div className="p-2">{recentContacts.map((contact, index) => { const name = contactName(contact); const latest = [...(contact.interactions ?? [])].sort((a, b) => Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || ""))[0]?.updatedAt; return <a href={`/contacts/${contact._id}`} key={contact._id} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-50"><div className={`avatar avatar-${["indigo", "emerald", "amber", "rose"][index % 4]}`}>{initials(name)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{name}</p><p className="truncate text-xs text-slate-400">{companyNames.get(companyId(contact) || "") || contact.email || "No company linked"}</p></div><span className="text-[11px] font-medium text-slate-400">{latest ? formatDate(latest) : "No activity"}</span></a>; })}{recentContacts.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No contacts match your search.</p>}</div></article>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-3"><article className="rounded-2xl bg-slate-950 p-5 text-white md:col-span-2"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Lead status snapshot</p><h2 className="mt-2 text-xl font-bold">{data.interactions.length} recorded interactions</h2><p className="mt-1 text-sm text-slate-400">Grouped by the most common current statuses</p></div><CircleDot className="text-slate-600" size={28} /></div><div className="mt-7 grid gap-3 sm:grid-cols-4">{statuses.map(([status, count], index) => <div key={status} className="rounded-xl bg-white/5 p-3"><div className={`mb-2 h-1.5 rounded-full status-bar-${index}`} /><p className="text-xl font-bold">{count}</p><p className="mt-1 truncate text-xs capitalize text-slate-400">{status}</p></div>)}</div></article><article className="rounded-2xl border border-dashed border-slate-300 bg-white p-5"><div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-500"><WalletCards size={19} /></div><p className="mt-5 text-sm font-medium text-slate-500">Financial overview</p><p className="mt-1 text-xl font-bold text-slate-950">Coming next</p><p className="mt-2 text-xs leading-5 text-slate-400">Invoice and budget figures will appear here once those modules are connected.</p></article></section>
      </div>
    </main>
    <InteractionEditor interaction={editingInteraction} onClose={() => setEditingInteraction(null)} />
  </div>;
}
